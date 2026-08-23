import Link from "next/link";

import { createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export async function TrendingWidget({ limit = 5 }: { limit?: number }) {
  const ctx = await createTRPCContext({ headers: new Headers() });
  const caller = createCaller(ctx);
  const { trendingCommunities } = await caller.search.trending();

  const communities = trendingCommunities.slice(0, limit);

  if (communities.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Trending Communities</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {communities.map((community) => (
          <Link
            key={community.id}
            href={`/community/${community.slug}`}
            className="hover:bg-muted group/community flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-[background-color,transform] duration-150 active:scale-[0.98]"
          >
            <span className="group-hover/community:text-primary font-medium transition-colors duration-200">
              d/{community.slug}
            </span>
            <span className="text-muted-foreground text-xs">
              {community.memberCount} members
            </span>
          </Link>
        ))}
        <Link
          href="/explore"
          className="hover:text-foreground text-muted-foreground mt-1 px-2 text-xs"
        >
          View all
        </Link>
      </CardContent>
    </Card>
  );
}
