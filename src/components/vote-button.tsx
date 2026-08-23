"use client";

import { ArrowBigDownIcon, ArrowBigUpIcon } from "lucide-react";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { cn } from "~/lib/utils";

export function VoteButton({
  targetType,
  targetId,
  score,
  myVote,
  isLoggedIn,
  layout = "horizontal",
}: {
  targetType: "post" | "comment";
  targetId: string;
  score: number;
  myVote: number | null;
  isLoggedIn: boolean;
  layout?: "horizontal" | "vertical";
}) {
  const utils = api.useUtils();
  const [displayScore, setDisplayScore] = useState(score);
  const [vote, setVote] = useState<number | null>(myVote);

  const cast = api.vote.cast.useMutation({
    onMutate: async ({ value }) => {
      await utils.post.list.cancel();
      const prevVote = vote;
      const prevScore = displayScore;

      // Compute optimistic state
      let nextVote: number | null;
      let delta = 0;
      if (prevVote === null) {
        nextVote = value;
        delta = value;
      } else if (prevVote === value) {
        nextVote = null;
        delta = -value;
      } else {
        nextVote = value;
        delta = 2 * value;
      }

      setVote(nextVote);
      setDisplayScore((s) => s + delta);

      return { prevVote, prevScore };
    },
    onError: (_err, _vars, context) => {
      if (context) {
        setVote(context.prevVote);
        setDisplayScore(context.prevScore);
      }
    },
    onSettled: () => {
      void utils.post.list.invalidate();
      void utils.comment.list.invalidate();
    },
  });

  const handleVote = (value: 1 | -1) => {
    if (!isLoggedIn) {
      void signIn();
      return;
    }
    cast.mutate({ targetType, targetId, value });
  };

  const upActive = vote === 1;
  const downActive = vote === -1;

  const vertical = layout === "vertical";

  return (
    <div
      className={cn(
        "flex items-center gap-0.5",
        vertical ? "flex-col" : "flex-row",
      )}
    >
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="Upvote"
        disabled={cast.isPending}
        onClick={() => handleVote(1)}
        className={cn(
          "transition-[color,transform,background-color] duration-150 hover:scale-110 active:scale-90",
          upActive && "text-primary hover:text-primary scale-110",
        )}
      >
        <ArrowBigUpIcon
          className={cn(
            "size-4 transition-transform duration-200",
            upActive && "fill-current",
          )}
          aria-hidden="true"
        />
      </Button>
      <span
        className={cn(
          "text-muted-foreground min-w-6 text-center text-sm font-medium tabular-nums transition-colors duration-200",
          vertical && "text-xs",
          upActive && "text-primary",
          downActive && "text-destructive",
        )}
      >
        {displayScore}
      </span>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="Downvote"
        disabled={cast.isPending}
        onClick={() => handleVote(-1)}
        className={cn(
          "transition-[color,transform,background-color] duration-150 hover:scale-110 active:scale-90",
          downActive && "text-destructive hover:text-destructive scale-110",
        )}
      >
        <ArrowBigDownIcon
          className={cn(
            "size-4 transition-transform duration-200",
            downActive && "fill-current",
          )}
          aria-hidden="true"
        />
      </Button>
    </div>
  );
}
