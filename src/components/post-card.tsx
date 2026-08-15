import Link from "next/link";
import { MessageCircleIcon } from "lucide-react";

import { UserAvatar } from "~/components/user-avatar";
import { VoteButton } from "~/components/vote-button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

export function PostCard({
  post,
  imageSrc,
  isLoggedIn,
}: {
  post: {
    id: string;
    title: string;
    slug: string;
    body: string | null;
    imageObjectKey: string | null;
    score: number;
    commentCount: number;
    createdAt: Date;
    myVote: number | null;
    author: { username: string | null; name: string | null };
    community: { slug: string };
  };
  imageSrc?: string | null;
  isLoggedIn?: boolean;
}) {
  return (
    <Card size="sm">
      <div className="flex gap-3">
        <div className="pt-(--card-spacing) pl-(--card-spacing)">
          <VoteButton
            targetType="post"
            targetId={post.id}
            score={post.score}
            myVote={post.myVote}
            isLoggedIn={Boolean(isLoggedIn)}
            layout="vertical"
          />
        </div>
        <div className="min-w-0 flex-1">
          <CardHeader>
            <CardTitle className="text-base leading-snug">
              <Link href={`/post/${post.slug}`} className="hover:text-primary">
                {post.title}
              </Link>
            </CardTitle>
          </CardHeader>
          {imageSrc && (
            <CardContent className="pt-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageSrc}
                alt={post.title}
                className="max-h-72 w-full rounded-md object-cover"
              />
            </CardContent>
          )}
          <CardContent>
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
                  size="sm"
                />
                <Link
                  href={`/user/${post.author.username ?? ""}`}
                  className="hover:text-foreground"
                >
                  {post.author.username ?? post.author.name}
                </Link>
              </span>
              <span>{timeAgo(post.createdAt)}</span>
            </div>
          </CardContent>
          <CardContent className="text-muted-foreground flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <MessageCircleIcon className="size-3.5" aria-hidden="true" />
              {post.commentCount} comments
            </span>
          </CardContent>
        </div>
      </div>
    </Card>
  );
}
