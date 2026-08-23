"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ImageUploadButton } from "~/components/image-upload-button";
import { api } from "~/trpc/react";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";

export function SubmitForm({
  initialCommunitySlug,
}: {
  initialCommunitySlug?: string;
}) {
  const router = useRouter();
  const listMine = api.community.listMine.useQuery();
  const createPost = api.post.create.useMutation();

  const [communityId, setCommunityId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageObjectKey, setImageObjectKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const memberships = listMine.data ?? [];
  const joined = memberships
    .map((m) => m.community)
    .sort((a, b) => a.slug.localeCompare(b.slug));

  const appliedPreselect = useState(false);
  if (
    !appliedPreselect[0] &&
    communityId === "" &&
    initialCommunitySlug &&
    joined.length > 0
  ) {
    const match = joined.find((c) => c.slug === initialCommunitySlug);
    if (match) {
      setCommunityId(match.id);
    }
    appliedPreselect[1](true);
  }

  const canSubmit =
    communityId &&
    title.trim().length >= 3 &&
    (body.trim().length > 0 || Boolean(imageObjectKey));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    try {
      const post = await createPost.mutateAsync({
        communityId,
        title: title.trim(),
        body: body.trim() || undefined,
        imageObjectKey: imageObjectKey ?? undefined,
      });
      router.push(`/post/${post.slug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create post.");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold tracking-tight">New post</h1>

      <Card>
        <CardHeader>
          <CardTitle>Create a post</CardTitle>
          <CardDescription>
            Share something with your communities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {listMine.isLoading ? (
            <div className="flex flex-col gap-3" aria-hidden="true">
              <Skeleton className="h-9 w-full rounded-md" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          ) : joined.length === 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-muted-foreground text-sm">
                You haven&apos;t joined any communities yet.
              </p>
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href="/create-community" />}
              >
                Create a community
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="community">Community</Label>
                <Select
                  value={communityId}
                  onValueChange={(value) => {
                    if (value) setCommunityId(value);
                  }}
                >
                  <SelectTrigger id="community" className="w-full">
                    <SelectValue placeholder="Choose a community">
                      {(value: string | null) =>
                        joined.find((c) => c.id === value)?.slug
                          ? `d/${joined.find((c) => c.id === value)!.slug}`
                          : "Choose a community"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {joined.map((community) => (
                      <SelectItem key={community.id} value={community.id}>
                        d/{community.slug}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  maxLength={300}
                  minLength={3}
                  required
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="A clear, descriptive title"
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
                  rows={8}
                  maxLength={40000}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your post… supports **markdown**"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Image (optional)</Label>
                <ImageUploadButton
                  label={imageObjectKey ? "Change image" : "Upload image"}
                  onUploaded={(key) => setImageObjectKey(key)}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={!canSubmit || createPost.isPending}
              >
                {createPost.isPending ? "Posting…" : "Post"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
