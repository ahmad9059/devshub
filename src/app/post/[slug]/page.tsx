import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TRPCError } from "@trpc/server";
import { CalendarIcon, MessageCircleIcon, PencilIcon } from "lucide-react";

import { AppShell } from "~/components/layout/app-shell";
import { Markdown } from "~/components/markdown";
import { PostActions } from "~/components/post-actions";
import { CommentSection } from "~/components/comment-tree";
import { ReportDialog } from "~/components/report-dialog";
import { UserAvatar } from "~/components/user-avatar";
import { VoteButton } from "~/components/vote-button";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { getSignedDownloadUrl } from "~/server/s3";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const ctx = await createTRPCContext({ headers: new Headers() });
  const caller = createCaller(ctx);

  try {
    const post = await caller.post.getBySlug({ slug });
    return {
      title: post.title,
      description:
        post.body?.slice(0, 160) ??
        `A post by ${post.author.username ?? post.author.name} in d/${post.community.slug}.`,
      openGraph: {
        title: post.title,
        description:
          post.body?.slice(0, 160) ??
          `A post by ${post.author.username ?? post.author.name} in d/${post.community.slug}.`,
        type: "article",
        publishedTime: post.createdAt.toISOString(),
      },
    };
  } catch {
    return {
      title: slug.replace(/-/g, " "),
      description: "A post on DevsHub.",
    };
  }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ctx = await createTRPCContext({ headers: new Headers() });
  const caller = createCaller(ctx);

  let post;
  try {
    post = await caller.post.getBySlug({ slug });
  } catch (err) {
    if (err instanceof TRPCError && err.code === "NOT_FOUND") {
      notFound();
    }
    throw err;
  }

  const sessionUserId = ctx.session?.user?.id ?? null;
  const isAuthor = post.authorId === sessionUserId;

  const imageSrc = post.imageObjectKey
    ? await getSignedDownloadUrl(post.imageObjectKey)
    : null;
  const authorAvatarSrc = post.author.avatarObjectKey
    ? await getSignedDownloadUrl(post.author.avatarObjectKey)
    : null;

  return (
    <AppShell>
      <article className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <Link
                href={`/community/${post.community.slug}`}
                className="hover:text-foreground font-medium"
              >
                d/{post.community.slug}
              </Link>
              <span className="flex items-center gap-1">
                <UserAvatar
                  name={post.author.name}
                  username={post.author.username}
                  src={authorAvatarSrc}
                  size="sm"
                />
                <Link
                  href={`/user/${post.author.username ?? ""}`}
                  className="hover:text-foreground"
                >
                  {post.author.username ?? post.author.name}
                </Link>
              </span>
              <span className="flex items-center gap-1">
                <CalendarIcon className="size-3" aria-hidden="true" />
                {formatDate(post.createdAt)}
              </span>
            </div>
            <CardTitle className="text-2xl font-semibold tracking-tight">
              {post.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {imageSrc && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageSrc}
                alt={post.title}
                className="max-h-[480px] w-full rounded-md object-cover"
              />
            )}
            {post.body && <Markdown content={post.body} />}
            <Separator />
            <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-sm">
              <div className="flex items-center gap-4">
                <VoteButton
                  targetType="post"
                  targetId={post.id}
                  score={post.score}
                  myVote={post.myVote}
                  isLoggedIn={Boolean(sessionUserId)}
                />
                <span className="flex items-center gap-1">
                  <MessageCircleIcon className="size-4" aria-hidden="true" />
                  {post.commentCount} comments
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isAuthor && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      nativeButton={false}
                      render={<Link href={`/post/${post.slug}/edit`} />}
                    >
                      <PencilIcon aria-hidden="true" />
                      Edit
                    </Button>
                    <PostActions postId={post.id} />
                  </>
                )}
                <ReportDialog targetType="post" targetId={post.id} />
              </div>
            </div>
          </CardContent>
        </Card>

        <CommentSection
          postId={post.id}
          currentUserId={sessionUserId}
          initialCount={post.commentCount}
        />
      </article>
    </AppShell>
  );
}
