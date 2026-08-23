"use client";

import { Code2Icon } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { ImageUploadButton } from "~/components/image-upload-button";
import { ThemeToggle } from "~/components/theme-toggle";
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
import { Textarea } from "~/components/ui/textarea";

export default function CommunitySettingsPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const router = useRouter();
  const getCommunity = api.community.getBySlug.useQuery({ slug });
  const updateCommunity = api.community.update.useMutation();
  const getMe = api.profile.getMe.useQuery();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [iconObjectKey, setIconObjectKey] = useState<string | null>(null);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const community = getCommunity.data;
  const me = getMe.data;

  const isOwner = community?.ownerId === me?.id;
  const isModerator = false;

  const [prevCommunity, setPrevCommunity] = useState(community);
  if (community !== prevCommunity) {
    setPrevCommunity(community);
    setName(community?.name ?? "");
    setDescription(community?.description ?? "");
    setIconObjectKey(community?.iconObjectKey ?? null);
  }

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus(null);

    if (!community) {
      return;
    }

    try {
      await updateCommunity.mutateAsync({
        communityId: community.id,
        name: name.trim(),
        description: description.trim() || undefined,
        iconObjectKey: iconObjectKey ?? undefined,
      });
      setStatus({ type: "success", message: "Community updated." });
      router.refresh();
    } catch (err) {
      setStatus({
        type: "error",
        message:
          err instanceof Error ? err.message : "Failed to update community.",
      });
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Code2Icon className="size-4" aria-hidden="true" />
            <span className="text-sm font-semibold">DevsHub</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6">
        {getCommunity.isLoading ? (
          <div className="flex flex-col gap-3" aria-hidden="true">
            <Skeleton className="h-6 w-40 rounded" />
            <Skeleton className="h-4 w-64 rounded" />
            <Skeleton className="h-9 w-full rounded-md" />
            <Skeleton className="h-24 w-full rounded-md" />
          </div>
        ) : !community ? (
          <Alert variant="destructive">
            <AlertDescription>
              Community not found or you don&apos;t have access.{" "}
              <Link href="/" className="underline">
                Back home
              </Link>
            </AlertDescription>
          </Alert>
        ) : !isOwner && !isModerator ? (
          <Alert variant="destructive">
            <AlertDescription>
              Only the owner or a moderator can edit this community.{" "}
              <Link href={`/community/${slug}`} className="underline">
                Back to community
              </Link>
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col gap-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Community settings
              </h1>
              <p className="text-muted-foreground text-sm">
                Manage d/{community.slug}.{" "}
                <Link
                  href={`/community/${community.slug}`}
                  className="text-primary hover:underline"
                >
                  View community
                </Link>
              </p>{" "}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Icon</CardTitle>
                <CardDescription>
                  The icon appears on the community page and listings.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUploadButton
                  label={iconObjectKey ? "Change icon" : "Upload icon"}
                  onUploaded={(key) => setIconObjectKey(key)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
                <CardDescription>
                  Update the community name and description.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    maxLength={100}
                    required
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    maxLength={500}
                    rows={4}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <span className="text-muted-foreground self-end text-xs">
                    {description.length}/500
                  </span>
                </div>
              </CardContent>
            </Card>

            {status && (
              <Alert
                variant={status.type === "error" ? "destructive" : "default"}
              >
                <AlertDescription>{status.message}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={updateCommunity.isPending}>
              {updateCommunity.isPending ? "Saving…" : "Save changes"}
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}
