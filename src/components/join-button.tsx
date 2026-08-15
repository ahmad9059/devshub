"use client";

import { Loader2Icon, UserCheckIcon, UserPlusIcon } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

export function JoinButton({
  communityId,
  isMember,
  isOwner,
}: {
  communityId: string;
  isMember: boolean;
  isOwner?: boolean;
}) {
  const router = useRouter();
  const [confirmLeave, setConfirmLeave] = useState(false);

  const join = api.community.join.useMutation({
    onSettled: () => {
      router.refresh();
    },
  });

  const leave = api.community.leave.useMutation({
    onSettled: () => {
      setConfirmLeave(false);
      router.refresh();
    },
  });

  if (isOwner) {
    return null;
  }

  if (isMember) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={leave.isPending}
        onClick={() => {
          if (confirmLeave) {
            leave.mutate({ communityId });
          } else {
            setConfirmLeave(true);
          }
        }}
      >
        {leave.isPending ? (
          <Loader2Icon className="animate-spin" aria-hidden="true" />
        ) : (
          <UserCheckIcon aria-hidden="true" />
        )}
        {confirmLeave ? "Confirm leave?" : "Joined"}
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      disabled={join.isPending}
      onClick={() => join.mutate({ communityId })}
    >
      {join.isPending ? (
        <Loader2Icon className="animate-spin" aria-hidden="true" />
      ) : (
        <UserPlusIcon aria-hidden="true" />
      )}
      Join
    </Button>
  );
}

export function JoinButtonSignedOut() {
  return (
    <Button size="sm" onClick={() => signIn()}>
      <UserPlusIcon aria-hidden="true" />
      Join
    </Button>
  );
}
