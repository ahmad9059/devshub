"use client";

import Link from "next/link";
import { useState } from "react";

import { PostCard } from "~/components/post-card";
import { UserAvatar } from "~/components/user-avatar";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { api } from "~/trpc/react";

type Tab = "posts" | "communities" | "users";

export function SearchResults({
  query,
  isLoggedIn,
}: {
  query: string;
  isLoggedIn?: boolean;
}) {
  const [tab, setTab] = useState<Tab>("posts");

  const posts = api.search.posts.useQuery({ q: query, limit: 20 });
  const communities = api.search.communities.useQuery({ q: query, limit: 20 });
  const users = api.search.users.useQuery({ q: query, limit: 20 });

  const active =
    tab === "posts" ? posts : tab === "communities" ? communities : users;

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
        <TabsList>
          <TabsTrigger value="posts">
            Posts{" "}
            {posts.data && posts.data.items.length > 0
              ? `(${posts.data.items.length})`
              : ""}
          </TabsTrigger>
          <TabsTrigger value="communities">
            Communities{" "}
            {communities.data && communities.data.length > 0
              ? `(${communities.data.length})`
              : ""}
          </TabsTrigger>
          <TabsTrigger value="users">
            Users{" "}
            {users.data && users.data.length > 0
              ? `(${users.data.length})`
              : ""}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {active.isLoading ? (
        <p className="text-muted-foreground text-sm">Searching…</p>
      ) : tab === "posts" ? (
        posts.data?.items.length ? (
          <div className="flex flex-col gap-3">
            {posts.data.items.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                imageSrc={post.imageSrc}
                authorAvatarSrc={post.authorAvatarSrc}
                isLoggedIn={Boolean(isLoggedIn)}
              />
            ))}
          </div>
        ) : (
          <EmptyState query={query} />
        )
      ) : tab === "communities" ? (
        communities.data?.length ? (
          <div className="flex flex-col gap-1">
            {communities.data.map((community) => (
              <Link
                key={community.id}
                href={`/community/${community.slug}`}
                className="hover:bg-muted flex items-center justify-between rounded-md px-2 py-1.5 text-sm"
              >
                <span className="font-medium">d/{community.slug}</span>
                <span className="text-muted-foreground text-xs">
                  {community.name} · {community.memberCount} members
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState query={query} />
        )
      ) : users.data?.length ? (
        <div className="flex flex-col gap-1">
          {users.data.map((user) => (
            <Link
              key={user.id}
              href={`/user/${user.username ?? ""}`}
              className="hover:bg-muted flex items-center gap-2 rounded-md px-2 py-1.5 text-sm"
            >
              <UserAvatar
                name={user.name}
                username={user.username}
                src={user.avatarSrc}
                size="sm"
              />
              <span className="font-medium">
                {user.username ? `@${user.username}` : user.name}
              </span>
              {user.name && user.name !== user.username && (
                <span className="text-muted-foreground text-xs">
                  {user.name}
                </span>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState query={query} />
      )}
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <p className="text-muted-foreground py-8 text-center text-sm">
      No results found for &ldquo;{query}&rdquo;
    </p>
  );
}
