"use client";

import Link from "next/link";
import { useState } from "react";
import { MessageSquarePlusIcon, PencilIcon, Trash2Icon } from "lucide-react";

import { CommentInput } from "~/components/comment-input";
import { Markdown } from "~/components/markdown";
import { ReportDialog } from "~/components/report-dialog";
import { UserAvatar } from "~/components/user-avatar";
import { VoteButton } from "~/components/vote-button";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

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

export function CommentCard({
  comment,
  currentUserId,
}: {
  comment: {
    id: string;
    postId: string;
    body: string;
    score: number;
    depth: number;
    deletedAt: Date | null;
    createdAt: Date;
    myVote: number | null;
    author: { id: string; name: string | null; username: string | null };
  };
  currentUserId?: string | null;
}) {
  const utils = api.useUtils();
  const [showReply, setShowReply] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isAuthor = comment.author.id === currentUserId;
  const isDeleted = Boolean(comment.deletedAt);

  const update = api.comment.update.useMutation({
    onSuccess: () => {
      setEditing(false);
      utils.comment.list.invalidate({ postId: comment.postId });
    },
  });
  const remove = api.comment.delete.useMutation({
    onSuccess: () => {
      utils.comment.list.invalidate({ postId: comment.postId });
    },
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-xs">
        {isDeleted ? (
          <span className="text-muted-foreground font-medium">[deleted]</span>
        ) : (
          <>
            <UserAvatar
              name={comment.author.name}
              username={comment.author.username}
              size="sm"
            />
            <Link
              href={`/user/${comment.author.username ?? ""}`}
              className="hover:text-foreground font-medium"
            >
              {comment.author.username ?? comment.author.name}
            </Link>
          </>
        )}
        <span className="text-muted-foreground">
          · {timeAgo(comment.createdAt)}
        </span>
        <VoteButton
          targetType="comment"
          targetId={comment.id}
          score={comment.score}
          myVote={comment.myVote}
          isLoggedIn={Boolean(currentUserId)}
          layout="horizontal"
        />
      </div>

      {isDeleted ? (
        <p className="text-muted-foreground text-sm">
          This comment was deleted.
        </p>
      ) : editing ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            rows={3}
            className="border-input rounded-lg border bg-transparent px-2.5 py-2 text-sm"
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              disabled={update.isPending}
              onClick={() =>
                update.mutate({ id: comment.id, body: editBody.trim() })
              }
            >
              Save
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-sm">
          <Markdown content={comment.body} />
        </div>
      )}

      {!isDeleted && (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setShowReply((v) => !v)}
          >
            <MessageSquarePlusIcon aria-hidden="true" />
            Reply
          </Button>
          {isAuthor && (
            <>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setEditing(true)}
              >
                <PencilIcon aria-hidden="true" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="xs"
                disabled={remove.isPending}
                onClick={() => {
                  if (confirmDelete) {
                    remove.mutate({ id: comment.id });
                  } else {
                    setConfirmDelete(true);
                  }
                }}
              >
                <Trash2Icon aria-hidden="true" />
                {confirmDelete ? "Confirm delete?" : "Delete"}
              </Button>
            </>
          )}
          <ReportDialog targetType="comment" targetId={comment.id} />
        </div>
      )}

      {showReply && (
        <CommentInput
          postId={comment.postId}
          parentCommentId={comment.id}
          autoFocus
          onDone={() => setShowReply(false)}
        />
      )}
    </div>
  );
}
