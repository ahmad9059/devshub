"use client";

import { CheckCircle2Icon, CircleAlertIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { AvatarUploader } from "~/components/avatar-uploader";
import { UserAvatar } from "~/components/user-avatar";
import { api } from "~/trpc/react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
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
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import { Textarea } from "~/components/ui/textarea";

export default function SettingsPage() {
  const getMe = api.profile.getMe.useQuery();
  const updateProfile = api.profile.updateProfile.useMutation();

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarObjectKey, setAvatarObjectKey] = useState<string | null>(null);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const me = getMe.data;

  const [prevMe, setPrevMe] = useState(me);
  if (me !== prevMe) {
    setPrevMe(me);
    setUsername(me?.username ?? "");
    setBio(me?.bio ?? "");
    setAvatarObjectKey(me?.avatarObjectKey ?? null);
  }

  const signedUrl = api.storage.getSignedDownloadUrl.useQuery(
    { key: avatarObjectKey! },
    { enabled: Boolean(avatarObjectKey) },
  );

  const { data: usernameCheck, isFetching: checkingUsername } =
    api.profile.checkUsername.useQuery(
      { username },
      { enabled: username.length >= 3 && username !== me?.username },
    );
  const usernameAvailable = useMemo(() => {
    if (username.length < 3) {
      return null;
    }
    if (username === me?.username) {
      return true;
    }
    return usernameCheck?.available ?? null;
  }, [username, me?.username, usernameCheck]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus(null);

    try {
      await updateProfile.mutateAsync({
        username: username.trim().toLowerCase() || undefined,
        bio: bio.trim() || undefined,
        avatarObjectKey: avatarObjectKey ?? undefined,
      });
      setStatus({
        type: "success",
        message: "Profile saved successfully.",
      });
    } catch (err) {
      setStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to save profile.",
      });
    }
  };

  if (getMe.isLoading) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6 py-6">
        <div className="flex flex-col gap-3" aria-hidden="true">
          <Skeleton className="h-8 w-32 rounded" />
          <Skeleton className="size-20 rounded-full" />
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-24 w-full rounded-md" />
        </div>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6 py-6">
        <Alert variant="destructive">
          <CircleAlertIcon aria-hidden="true" />
          <AlertTitle>Could not load profile</AlertTitle>
          <AlertDescription>
            Please try again later.{" "}
            <Link href="/" className="underline">
              Back home
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your public profile.{" "}
          {me.username && (
            <Link
              href={`/user/${me.username}`}
              className="text-primary hover:underline"
            >
              View your public profile
            </Link>
          )}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Avatar</CardTitle>
          <CardDescription>
            Your avatar is shown across the site. Images are stored privately
            and served securely.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AvatarUploader
            name={me.name}
            username={me.username}
            avatarSrc={signedUrl.data}
            onUploaded={(key) => {
              setAvatarObjectKey(key);
            }}
          />
        </CardContent>
      </Card>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Your username appears in your profile URL and byline.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                minLength={3}
                maxLength={20}
                pattern="[a-z0-9-]+"
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your-username"
                className={
                  usernameAvailable === false
                    ? "aria-invalid:border-destructive"
                    : ""
                }
              />
              {username.length < 3 ? (
                <span className="text-muted-foreground text-xs">
                  Minimum 3 characters. Lowercase letters, numbers, and hyphens.
                </span>
              ) : checkingUsername ? (
                <span className="text-muted-foreground text-xs">Checking…</span>
              ) : usernameAvailable === true ? (
                <span className="text-xs text-emerald-500">
                  Username is available.
                </span>
              ) : usernameAvailable === false ? (
                <span className="text-destructive text-xs">
                  {username === me.username
                    ? ""
                    : "Username is taken or invalid."}
                </span>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                maxLength={500}
                rows={4}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell the community a little about yourself."
              />
              <span className="text-muted-foreground self-end text-xs">
                {bio.length}/500
              </span>
            </div>
          </CardContent>
        </Card>

        {status && (
          <Alert variant={status.type === "error" ? "destructive" : "default"}>
            {status.type === "success" ? (
              <CheckCircle2Icon aria-hidden="true" />
            ) : (
              <CircleAlertIcon aria-hidden="true" />
            )}
            <AlertTitle>
              {status.type === "success" ? "Saved" : "Something went wrong"}
            </AlertTitle>
            <AlertDescription>{status.message}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={updateProfile.isPending}>
            {updateProfile.isPending ? "Saving…" : "Save changes"}
          </Button>
          {usernameAvailable === false && (
            <span className="text-muted-foreground text-xs">
              Choose an available username to save.
            </span>
          )}
        </div>
      </form>

      <Separator />

      <div className="text-muted-foreground flex items-center gap-3 text-sm">
        <UserAvatar
          name={me.name}
          username={me.username}
          src={signedUrl.data}
          size="sm"
        />
        <span>{me.username ? `@${me.username}` : (me.name ?? me.email)}</span>
      </div>
    </div>
  );
}
