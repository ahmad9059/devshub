"use client";

import { useState } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";

import { CommentCard } from "~/components/comment-card";
import { CommentInput } from "~/components/comment-input";
import { CommentSkeleton } from "~/components/comment-skeleton";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { api } from "~/trpc/react";

type Sort = "best" | "new" | "top";

type CommentNode = {
  comment: {
    id: string;
    postId: string;
    body: string;
    score: number;
    depth: number;
    deletedAt: Date | null;
    createdAt: Date;
    myVote: number | null;
    authorAvatarSrc?: string | null;
    author: { id: string; name: string | null; username: string | null };
  };
  replies: CommentNode[];
};

function CommentThread({
  node,
  currentUserId,
  depth,
}: {
  node: CommentNode;
  currentUserId?: string | null;
  depth: number;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const indent = Math.min(depth, 5);

  return (
    <div className="flex flex-col gap-2">
      <div
        className="relative flex flex-col gap-2"
        style={{ paddingLeft: indent > 0 ? 16 : 0 }}
      >
        {indent > 0 && (
          <div className="bg-border absolute top-0 bottom-0 left-0 w-px" />
        )}
        <CommentCard comment={node.comment} currentUserId={currentUserId} />
      </div>
      {node.replies.length > 0 && (
        <div
          className="flex flex-col gap-2"
          style={{ paddingLeft: indent > 0 ? 16 : 0 }}
        >
          {!collapsed && (
            <div className="flex flex-col gap-2">
              {node.replies.map((reply) => (
                <CommentThread
                  key={reply.comment.id}
                  node={reply}
                  currentUserId={currentUserId}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1 text-xs"
          >
            {collapsed ? (
              <ChevronRightIcon className="size-3" aria-hidden="true" />
            ) : (
              <ChevronDownIcon className="size-3" aria-hidden="true" />
            )}
            {node.replies.length}{" "}
            {node.replies.length === 1 ? "reply" : "replies"}
          </button>
        </div>
      )}
    </div>
  );
}

export function CommentSection({
  postId,
  currentUserId,
  initialCount,
}: {
  postId: string;
  currentUserId?: string | null;
  initialCount: number;
}) {
  const [sort, setSort] = useState<Sort>("best");

  const comments = api.comment.list.useQuery({
    postId,
    sort,
  });

  const tree = comments.data?.tree ?? [];

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">
          Comments ({comments.data?.count ?? initialCount})
        </h2>
        <Tabs value={sort} onValueChange={(value) => setSort(value as Sort)}>
          <TabsList>
            <TabsTrigger value="best">Best</TabsTrigger>
            <TabsTrigger value="new">New</TabsTrigger>
            <TabsTrigger value="top">Top</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {currentUserId && <CommentInput postId={postId} />}

      {comments.isLoading ? (
        <CommentSkeleton />
      ) : tree.length === 0 ? (
        <p className="text-muted-foreground py-4 text-center text-sm">
          No comments yet. Be the first to comment.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {tree.map((node) => (
            <CommentThread
              key={node.comment.id}
              node={node}
              currentUserId={currentUserId}
              depth={0}
            />
          ))}
        </div>
      )}
    </section>
  );
}
