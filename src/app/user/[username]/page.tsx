import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TRPCError } from "@trpc/server";
import { CalendarIcon, MessageCircleIcon, Code2Icon } from "lucide-react";

import { UserAvatar } from "~/components/user-avatar";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { getSignedDownloadUrl } from "~/server/s3";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `@${username} | DevsHub`,
    description: `Profile of ${username} on DevsHub.`,
  };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const ctx = await createTRPCContext({ headers: new Headers() });
  const caller = createCaller(ctx);

  let user;
  try {
    user = await caller.profile.getByUsername({ username });
  } catch (err) {
    if (err instanceof TRPCError && err.code === "NOT_FOUND") {
      notFound();
    }
    throw err;
  }

  const avatarSrc = user.avatarObjectKey
    ? await getSignedDownloadUrl(user.avatarObjectKey)
    : null;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <UserAvatar
            name={user.name}
            username={user.username}
            src={avatarSrc}
            size="lg"
          />
          <div className="flex flex-col">
            <h1 className="text-2xl font-semibold tracking-tight">
              {user.name ?? `@${user.username}`}
            </h1>
            <span className="text-muted-foreground font-mono text-sm">
              @{user.username}
            </span>
          </div>
        </div>

        {user.bio && <p className="text-sm">{user.bio}</p>}

        <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="flex items-center gap-1.5">
            <CalendarIcon className="size-3.5" aria-hidden="true" />
            Joined {formatDate(user.createdAt)}
          </span>
          <span>{user.posts.length} posts</span>
          <span>{user.comments.length} comments</span>
        </div>

        {user.memberships.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {user.memberships.map((membership) => (
              <Badge key={membership.communityId} variant="secondary">
                <Link href={`/community/${membership.community.slug}`}>
                  r/{membership.community.slug}
                </Link>
              </Badge>
            ))}
          </div>
        )}
      </section>

      <Separator />

      <Tabs defaultValue="posts">
        <TabsList>
          <TabsTrigger value="posts">
            <MessageCircleIcon aria-hidden="true" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-4">
          {user.posts.length === 0 ? (
            <p className="text-muted-foreground text-sm">No posts yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {user.posts.map((post) => (
                <Card key={post.id} size="sm">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">
                      <Link
                        href={`/community/${post.community.slug}`}
                        className="text-muted-foreground hover:text-foreground mr-2 text-xs"
                      >
                        r/{post.community.slug}
                      </Link>
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
                      <span className="flex items-center gap-1">
                        <span aria-hidden="true">▲</span>
                        {post.score} points
                      </span>
                      <span>{post.commentCount} comments</span>
                      <span>{formatDate(post.createdAt)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="comments" className="mt-4">
          {user.comments.length === 0 ? (
            <p className="text-muted-foreground text-sm">No comments yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {user.comments.map((comment) => (
                <Card key={comment.id} size="sm">
                  <CardContent className="flex flex-col gap-2">
                    <p className="text-sm">{comment.body}</p>
                    <div className="text-muted-foreground flex items-center gap-3 text-xs">
                      <Link
                        href={`/post/${comment.post.slug}`}
                        className="hover:text-primary flex items-center gap-1"
                      >
                        <Code2Icon className="size-3" aria-hidden="true" />
                        {comment.post.title}
                      </Link>
                      <span>in r/{comment.post.community.slug}</span>
                      <span>{formatDate(comment.createdAt)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}
