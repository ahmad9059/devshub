"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "~/trpc/react";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";

export function EditPostForm({ slug }: { slug: string }) {
  const router = useRouter();

  const getPost = api.post.getBySlug.useQuery({ slug });
  const updatePost = api.post.update.useMutation();

  const post = getPost.data;

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [prevPost, setPrevPost] = useState(post);
  if (post !== prevPost) {
    setPrevPost(post);
    setTitle(post?.title ?? "");
    setBody(post?.body ?? "");
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus(null);

    if (!post) {
      return;
    }

    try {
      await updatePost.mutateAsync({
        id: post.id,
        title: title.trim(),
        body: body.trim() || undefined,
      });
      setStatus({ type: "success", message: "Post updated." });
      router.refresh();
      router.push(`/post/${post.slug}`);
    } catch (err) {
      setStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to update post.",
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold tracking-tight">Edit post</h1>
      <Card>
        <CardHeader>
          <CardTitle>Update your post</CardTitle>
          <CardDescription>
            Edit the title and body of your post.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {getPost.isLoading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : !post ? (
            <Alert variant="destructive">
              <AlertDescription>
                Post not found.{" "}
                <Link href="/" className="underline">
                  Back home
                </Link>
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  maxLength={300}
                  minLength={3}
                  required
                  onChange={(e) => setTitle(e.target.value)}
                />
                <span className="text-muted-foreground self-end text-xs">
                  {title.length}/300
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="body">Body (markdown)</Label>
                <Textarea
                  id="body"
                  value={body}
                  rows={10}
                  maxLength={40000}
                  onChange={(e) => setBody(e.target.value)}
                />
              </div>

              {status && (
                <Alert
                  variant={status.type === "error" ? "destructive" : "default"}
                >
                  <AlertDescription>{status.message}</AlertDescription>
                </Alert>
              )}

              <div className="flex items-center gap-2">
                <Button type="submit" disabled={updatePost.isPending}>
                  {updatePost.isPending ? "Saving…" : "Save changes"}
                </Button>
                <Button
                  variant="ghost"
                  nativeButton={false}
                  render={<Link href={`/post/${post.slug}`} />}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
