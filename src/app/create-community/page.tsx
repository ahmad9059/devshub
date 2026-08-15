"use client";

import { Code2Icon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ImageUploadButton } from "~/components/image-upload-button";
import { ThemeToggle } from "~/components/theme-toggle";
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

export default function CreateCommunityPage() {
  const router = useRouter();
  const createCommunity = api.community.create.useMutation();

  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [iconObjectKey, setIconObjectKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: slugCheck, isFetching: checkingSlug } =
    api.community.checkSlug.useQuery({ slug }, { enabled: slug.length >= 3 });

  const isAvailable =
    slug.length >= 3 && slugCheck?.available === true && !checkingSlug;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!isAvailable) {
      setError("Please choose an available slug.");
      return;
    }

    try {
      const community = await createCommunity.mutateAsync({
        slug: slug.trim().toLowerCase(),
        name: name.trim(),
        description: description.trim() || undefined,
        iconObjectKey: iconObjectKey ?? undefined,
      });
      router.push(`/community/${community.slug}`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create community.",
      );
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

      <main className="flex flex-col items-center px-4 py-12 sm:px-6">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <UsersIcon className="size-5" aria-hidden="true" />
              Create a community
            </CardTitle>
            <CardDescription>
              Communities are where developers gather around a shared topic.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="slug">Slug</Label>
                <div className="flex items-center">
                  <span className="text-muted-foreground pr-1.5 text-sm">
                    d/
                  </span>
                  <Input
                    id="slug"
                    value={slug}
                    minLength={3}
                    maxLength={30}
                    pattern="[a-z0-9-]+"
                    required
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="reactjs"
                  />
                </div>
                {slug.length < 3 ? (
                  <span className="text-muted-foreground text-xs">
                    Minimum 3 characters. Lowercase letters, numbers, and
                    hyphens. This becomes your community URL.
                  </span>
                ) : checkingSlug ? (
                  <span className="text-muted-foreground text-xs">
                    Checking…
                  </span>
                ) : slugCheck?.available ? (
                  <span className="text-xs text-emerald-500">
                    Slug is available.
                  </span>
                ) : (
                  <span className="text-destructive text-xs">
                    {slugCheck?.reason === "invalid"
                      ? "Use lowercase letters, numbers, and hyphens only."
                      : "That slug is already taken."}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  maxLength={100}
                  required
                  onChange={(e) => setName(e.target.value)}
                  placeholder="React"
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
                  placeholder="What is this community about?"
                />
                <span className="text-muted-foreground self-end text-xs">
                  {description.length}/500
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Icon (optional)</Label>
                <ImageUploadButton
                  label={iconObjectKey ? "Change icon" : "Upload icon"}
                  onUploaded={(key) => setIconObjectKey(key)}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={!isAvailable || createCommunity.isPending}
              >
                {createCommunity.isPending ? "Creating…" : "Create community"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
