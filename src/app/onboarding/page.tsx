"use client";

import { Code2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

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

export default function OnboardingPage() {
  const router = useRouter();
  const getMe = api.profile.getMe.useQuery();
  const updateProfile = api.profile.updateProfile.useMutation();

  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: usernameCheck, isFetching: checkingUsername } =
    api.profile.checkUsername.useQuery(
      { username },
      { enabled: username.length >= 3 },
    );

  const isAvailable =
    username.length >= 3 &&
    usernameCheck?.available === true &&
    !checkingUsername;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!isAvailable) {
      setError("Please choose an available username.");
      return;
    }

    try {
      await updateProfile.mutateAsync({
        username: username.trim().toLowerCase(),
      });
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save your username.",
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
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-xl">Pick a username</CardTitle>
            <CardDescription>
              This is how the community will know you. You can change it later
              from settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  minLength={3}
                  maxLength={20}
                  pattern="[a-z0-9-]+"
                  required
                  autoFocus
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="your-username"
                />
                {username.length < 3 ? (
                  <span className="text-muted-foreground text-xs">
                    Minimum 3 characters. Lowercase letters, numbers, and
                    hyphens.
                  </span>
                ) : checkingUsername ? (
                  <span className="text-muted-foreground text-xs">
                    Checking…
                  </span>
                ) : usernameCheck?.available ? (
                  <span className="text-xs text-emerald-500">
                    Username is available.
                  </span>
                ) : (
                  <span className="text-destructive text-xs">
                    {usernameCheck?.reason === "invalid"
                      ? "Use lowercase letters, numbers, and hyphens only."
                      : "Username is already taken."}
                  </span>
                )}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" disabled={!isAvailable || getMe.isLoading}>
                {updateProfile.isPending ? "Saving…" : "Continue"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
