"use client";

import { Loader2Icon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

export function PostActions({ postId }: { postId: string }) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deletePost = api.post.delete.useMutation({
    onSuccess: () => {
      router.push("/");
      router.refresh();
    },
  });

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={deletePost.isPending}
      onClick={() => {
        if (confirmDelete) {
          deletePost.mutate({ id: postId });
        } else {
          setConfirmDelete(true);
        }
      }}
    >
      {deletePost.isPending ? (
        <Loader2Icon className="animate-spin" aria-hidden="true" />
      ) : (
        <Trash2Icon aria-hidden="true" />
      )}
      {confirmDelete ? "Confirm delete?" : "Delete"}
    </Button>
  );
}
