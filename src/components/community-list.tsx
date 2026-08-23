import Link from "next/link";

import { createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export async function CommunityList({ limit = 50 }: { limit?: number }) {
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
      <CardContent className="flex flex-col gap-1">
        {communities.map((community) => (
          <Link
            key={community.id}
            href={`/community/${community.slug}`}
            className="hover:bg-muted flex items-center justify-between rounded-md px-2 py-1.5 text-sm"
          >
            <span className="font-medium">d/{community.slug}</span>
            <span className="text-muted-foreground text-xs">
              {community.memberCount} members
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
