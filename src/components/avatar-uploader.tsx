"use client";

import { CameraIcon } from "lucide-react";
import { useRef, useState } from "react";

import { UserAvatar } from "~/components/user-avatar";
import { api } from "~/trpc/react";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/avif"];

function extensionFor(contentType: string): string {
  switch (contentType) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    case "image/avif":
      return "avif";
    default:
      return "png";
  }
}

export function AvatarUploader({
  name,
  username,
  avatarSrc,
  onUploaded,
}: {
  name?: string | null;
  username?: string | null;
  avatarSrc?: string | null;
  onUploaded: (objectKey: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const createUpload = api.storage.createImageUpload.useMutation();

  const handleFile = async (file: File | undefined) => {
    setError(null);
    if (!file) {
      return;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Please choose a PNG, JPEG, WebP, or AVIF image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be 5 MB or smaller.");
      return;
    }

    const { key, uploadUrl } = await createUpload.mutateAsync({
      contentType: file.type as "image/png",
      extension: extensionFor(file.type) as "png",
    });

    await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    onUploaded(key);
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group/avatar-upload relative"
        aria-label="Upload avatar"
      >
        <UserAvatar
          name={name}
          username={username}
          src={avatarSrc}
          size="lg"
          className="cursor-pointer transition-opacity group-hover/avatar-upload:opacity-80"
        />
        <span className="bg-primary text-primary-foreground ring-background absolute right-0 bottom-0 flex size-6 items-center justify-center rounded-full ring-2">
          <CameraIcon className="size-3" aria-hidden="true" />
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif"
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
      {error && <span className="text-destructive text-sm">{error}</span>}
    </div>
  );
}
