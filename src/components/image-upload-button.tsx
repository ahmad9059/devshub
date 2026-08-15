"use client";

import { ImageIcon } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "~/components/ui/button";
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

export function ImageUploadButton({
  label = "Upload image",
  onUploaded,
}: {
  label?: string;
  onUploaded: (objectKey: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
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

    setPending(true);
    try {
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
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
      >
        <ImageIcon aria-hidden="true" />
        {pending ? "Uploading…" : label}
      </Button>
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
