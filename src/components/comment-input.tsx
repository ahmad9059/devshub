"use client";

import { Loader2Icon } from "lucide-react";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { api } from "~/trpc/react";

export function CommentInput({
  postId,
  parentCommentId,
  autoFocus,
  onDone,
}: {
  postId: string;
  parentCommentId?: string;
  autoFocus?: boolean;
  onDone?: () => void;
}) {
  const utils = api.useUtils();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const create = api.comment.create.useMutation({
    onSuccess: () => {
      setBody("");
      setError(null);
      utils.comment.list.invalidate({ postId });
      onDone?.();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const canSubmit = body.trim().length > 0;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    create.mutate({
      postId,
      body: body.trim(),
      parentCommentId,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={40000}
        autoFocus={autoFocus}
        placeholder={parentCommentId ? "Write a reply…" : "Add a comment…"}
      />
      {error && <p className="text-destructive text-sm">{error}</p>}
      <div className="flex items-center gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={!canSubmit || create.isPending}
        >
          {create.isPending ? (
            <Loader2Icon className="animate-spin" aria-hidden="true" />
          ) : null}
          {parentCommentId ? "Reply" : "Comment"}
        </Button>
        {onDone && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setBody("");
              onDone();
            }}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
