import Link from "next/link";

import { createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { db } from "~/server/db";
import { communityMembers } from "~/server/db/schema";
import { eq } from "drizzle-orm";

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
            <Link
              key={community.id}
              href={`/community/${community.slug}`}
              className="hover:bg-muted flex items-center justify-between gap-2 rounded-md px-2 py-1 text-sm"
            >
              <span className="truncate font-medium">d/{community.slug}</span>
              <span className="text-muted-foreground shrink-0 text-xs">
                {community.memberCount}
              </span>
            </Link>
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
          <Link
            key={community.id}
            href={`/community/${community.slug}`}
            className="hover:bg-muted flex items-center justify-between gap-2 rounded-md px-2 py-1 text-sm"
          >
            <span className="truncate font-medium">d/{community.slug}</span>
            <span className="text-muted-foreground shrink-0 text-xs">
              {community.memberCount}
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}