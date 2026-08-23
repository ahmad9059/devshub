import type { Metadata } from "next";
import Link from "next/link";

import { auth } from "~/auth";
import { AppShell } from "~/components/layout/app-shell";
import { PostCard } from "~/components/post-card";
import { createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Explore",
  description: "Trending communities and popular posts on DevsHub.",
};

export default async function ExplorePage() {
  const ctx = await createTRPCContext({ headers: new Headers() });
  const caller = createCaller(ctx);
  const { trendingCommunities, popularPosts } = await caller.search.trending();

  const session = await auth();
  const isLoggedIn = Boolean(session?.user);

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <h1 className="text-xl font-semibold tracking-tight">
            Trending Communities
          </h1>
          {trendingCommunities.length === 0 ? (
            <p className="text-muted-foreground text-sm">No communities yet.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {trendingCommunities.map((community) => (
                <Link
                  key={community.id}
                  href={`/community/${community.slug}`}
                  className="hover:bg-muted flex items-center justify-between rounded-md px-2 py-2 text-sm"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">d/{community.slug}</span>
                    {community.description && (
                      <span className="text-muted-foreground line-clamp-1 text-xs">
                        {community.description}
                      </span>
                    )}
                  </div>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {community.memberCount} members
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold tracking-tight">
            Popular Posts (last 24h)
          </h2>
          {popularPosts.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No posts in the last 24 hours.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {popularPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  imageSrc={post.imageSrc}
                  authorAvatarSrc={post.authorAvatarSrc}
                  isLoggedIn={isLoggedIn}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
