import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TRPCError } from "@trpc/server";
import { CalendarIcon, MessageCircleIcon, SettingsIcon } from "lucide-react";

import { JoinButton, JoinButtonSignedOut } from "~/components/join-button";
import { UserAvatar } from "~/components/user-avatar";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `d/${slug} | DevsHub`,
    description: `The ${slug} community on DevsHub.`,
  };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });
}

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ctx = await createTRPCContext({ headers: new Headers() });
  const caller = createCaller(ctx);

  let community;
  try {
    community = await caller.community.getBySlug({ slug });
  } catch (err) {
    if (err instanceof TRPCError && err.code === "NOT_FOUND") {
      notFound();
    }
    throw err;
  }

  const sessionUserId = ctx.session?.user?.id ?? null;
  const membership = sessionUserId
    ? await ctx.db.query.communityMembers.findFirst({
        where: (table, { and, eq }) =>
          and(
            eq(table.communityId, community.id),
            eq(table.userId, sessionUserId),
          ),
      })
    : null;

  const isMember = Boolean(membership);
  const isOwner = community.ownerId === sessionUserId;
  const isModerator = membership?.role === "moderator";

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
      <section className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-muted flex size-12 items-center justify-center rounded-full text-xl font-semibold">
              {community.name[0]?.toUpperCase() ?? "C"}
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-semibold tracking-tight">
                d/{community.slug}
              </h1>
              <span className="text-muted-foreground text-sm">
                {community.name}
              </span>
            </div>
          </div>

          {sessionUserId ? (
            <div className="flex items-center gap-2">
              <JoinButton
                communityId={community.id}
                isMember={isMember}
                isOwner={isOwner}
              />
              {(isOwner || isModerator) && (
                <Button
                  variant="ghost"
                  size="sm"
                  render={<Link href={`/community/${slug}/settings`} />}
                >
                  <SettingsIcon aria-hidden="true" />
                  Settings
                </Button>
              )}
            </div>
          ) : (
            <JoinButtonSignedOut />
          )}
        </div>

        {community.description && (
          <p className="text-sm">{community.description}</p>
        )}

        <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span>{community.memberCount} members</span>
          <span>{community.postCount} posts</span>
          <span className="flex items-center gap-1.5">
            <CalendarIcon className="size-3.5" aria-hidden="true" />
            Created {formatDate(community.createdAt)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <UserAvatar
            name={community.owner.name}
            username={community.owner.username}
            size="sm"
          />
          <span className="text-muted-foreground">
            Created by{" "}
            <Link
              href={`/user/${community.owner.username ?? ""}`}
              className="text-foreground hover:underline"
            >
              {community.owner.username ?? community.owner.name}
            </Link>
          </span>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Posts</h2>
        {community.posts.length === 0 ? (
          <Card size="sm">
            <CardContent className="flex flex-col gap-1 py-6 text-center">
              <p className="text-sm font-medium">No posts yet</p>
              <p className="text-muted-foreground text-sm">
                Be the first to share something with this community.
              </p>
            </CardContent>
          </Card>
        ) : (
          community.posts.map((post) => (
            <Card key={post.id} size="sm">
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  <Link
                    href={`/post/${post.slug}`}
                    className="hover:text-primary"
                  >
                    {post.title}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground flex items-center gap-3 text-xs">
                  <span>
                    Posted by{" "}
                    <Link
                      href={`/user/${post.author.username ?? ""}`}
                      className="hover:text-foreground"
                    >
                      {post.author.username ?? post.author.name}
                    </Link>
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircleIcon className="size-3" aria-hidden="true" />
                    {post.commentCount}
                  </span>
                  <span>{post.score} points</span>
                  <span>{formatDate(post.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </section>
    </main>
  );
}
