import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

import { createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { db } from "~/server/db";
import { communityMembers } from "~/server/db/schema";
import { eq } from "drizzle-orm";

function CommunityRow({
  href,
  slug,
  memberCount,
}: {
  href: string;
  slug: string;
  memberCount: number;
}) {
  return (
    <Link
      href={href}
      className="hover:bg-muted group/community flex items-center justify-between gap-2 rounded-md px-2 py-1 text-sm transition-[background-color,transform] duration-150 active:scale-[0.98]"
    >
      <span className="truncate font-medium">{slug}</span>
      <span className="text-muted-foreground flex shrink-0 items-center gap-1 text-xs">
        {memberCount}
        <ChevronRightIcon
          className="size-3 -translate-x-1 opacity-0 transition-[opacity,transform] duration-150 group-hover/community:translate-x-0 group-hover/community:opacity-100"
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}

export async function CommunityList({
  userId,
  limit = 50,
}: {
  userId?: string | null;
  limit?: number;
}) {
  if (userId) {
    const memberships = await db.query.communityMembers.findMany({
      where: eq(communityMembers.userId, userId),
      with: { community: true },
    });

    const joined = memberships
      .map((membership) => membership.community)
      .sort((a, b) => b.memberCount - a.memberCount)
      .slice(0, limit);

    if (joined.length === 0) {
      return null;
    }

    return (
      <Card className="shrink-0">
        <CardHeader>
          <CardTitle className="text-sm">Joined Communities</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-0.5">
          {joined.map((community) => (
            <CommunityRow
              key={community.id}
              href={`/community/${community.slug}`}
              slug={`d/${community.slug}`}
              memberCount={community.memberCount}
            />
          ))}
        </CardContent>
      </Card>
    );
  }

  const ctx = await createTRPCContext({ headers: new Headers() });
  const caller = createCaller(ctx);
  const communities = await caller.community.list({ limit });

  if (communities.length === 0) {
    return null;
  }

  return (
    <Card className="shrink-0">
      <CardHeader>
        <CardTitle className="text-sm">Top Communities</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-0.5">
        {communities.map((community) => (
          <CommunityRow
            key={community.id}
            href={`/community/${community.slug}`}
            slug={`d/${community.slug}`}
            memberCount={community.memberCount}
          />
        ))}
      </CardContent>
    </Card>
  );
}
