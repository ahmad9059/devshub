"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { FeedSkeleton } from "~/components/feed-skeleton";
import { PostCard } from "~/components/post-card";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { api } from "~/trpc/react";

export function PostFeed({
  communitySlug,
  isLoggedIn,
}: {
  communitySlug?: string;
  isLoggedIn?: boolean;
}) {
  const [sort, setSort] = useState<"hot" | "new" | "top">("hot");
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const feed = api.post.list.useInfiniteQuery(
    { sort, communitySlug, limit: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialCursor: undefined,
    },
  );

  const loadMore = useCallback(() => {
    if (feed.hasNextPage && !feed.isFetchingNextPage) {
      void feed.fetchNextPage();
    }
  }, [feed]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore, sort]);

  const posts = feed.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <Tabs
        value={sort}
        onValueChange={(value) => setSort(value as "hot" | "new" | "top")}
      >
        <TabsList>
          <TabsTrigger value="hot">Hot</TabsTrigger>
          <TabsTrigger value="new">New</TabsTrigger>
          <TabsTrigger value="top">Top</TabsTrigger>
        </TabsList>
      </Tabs>

      {feed.isLoading ? (
        <FeedSkeleton />
      ) : posts.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          No posts yet.
        </p>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            imageSrc={post.imageSrc}
            authorAvatarSrc={post.authorAvatarSrc}
            isLoggedIn={Boolean(isLoggedIn)}
          />
        ))
      )}

      <div ref={loadMoreRef} className="h-1" />
      {feed.isFetchingNextPage && <FeedSkeleton count={2} />}
    </div>
  );
}
