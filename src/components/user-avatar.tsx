"use client";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";

export function UserAvatar({
  name,
  username,
  src,
  size = "default",
  className,
}: {
  name?: string | null;
  username?: string | null;
  src?: string | null;
  size?: "sm" | "default" | "lg";
  className?: string;
}) {
  const fallback =
    username?.[0]?.toUpperCase() ?? name?.[0]?.toUpperCase() ?? "?";

  return (
    <Avatar size={size} className={className}>
      {src && <AvatarImage src={src} alt={username ?? name ?? "user"} />}
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  );
}
