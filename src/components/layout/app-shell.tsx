import Link from "next/link";
import { Suspense } from "react";
import { Code2Icon, HomeIcon, PlusIcon, TrendingUpIcon } from "lucide-react";

import { auth } from "~/auth";
import { CommunityList } from "~/components/community-list";
import { RecentActivity } from "~/components/recent-activity";
import { SearchBar } from "~/components/search-bar";
import { ThemeToggle } from "~/components/theme-toggle";
import { TrendingWidget } from "~/components/trending-widget";
import { UserAvatar } from "~/components/user-avatar";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { db } from "~/server/db";
import { getSignedDownloadUrl } from "~/server/s3";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const user = userId
    ? await db.query.users.findFirst({
        where: (table, { eq }) => eq(table.id, userId),
        columns: {
          id: true,
          name: true,
          username: true,
          avatarObjectKey: true,
        },
      })
    : null;

  const avatarSrc = user?.avatarObjectKey
    ? await getSignedDownloadUrl(user.avatarObjectKey)
    : null;

  const navItems = [
    { href: "/", label: "Home", icon: HomeIcon },
    { href: "/explore", label: "Explore", icon: TrendingUpIcon },
    { href: "/create-community", label: "Create community", icon: PlusIcon },
  ];

  return (
    <div className="bg-background min-h-screen">
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <Code2Icon className="size-4" aria-hidden="true" />
            <span className="text-sm font-semibold">DevsHub</span>
          </Link>
          <Suspense fallback={null}>
            <SearchBar className="hidden w-full max-w-xs flex-1 md:block" />
          </Suspense>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {user ? (
              <Button
                variant="default"
                size="sm"
                nativeButton={false}
                render={<Link href="/submit" />}
              >
                <PlusIcon aria-hidden="true" />
                New Post
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                nativeButton={false}
                render={<Link href="/login" />}
              >
                Log in
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>
        <div className="border-border mx-auto flex max-w-6xl px-4 pb-2 sm:px-6 md:hidden">
          <Suspense fallback={null}>
            <SearchBar className="w-full" />
          </Suspense>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6 sm:px-6">
        <aside className="hidden w-52 shrink-0 flex-col gap-4 lg:flex">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hover:bg-muted flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium"
              >
                <item.icon className="size-4" aria-hidden="true" />
                {item.label}
              </Link>
            ))}
          </nav>
          <Separator />
          <CommunityList limit={5} />
        </aside>

        <main className="min-w-0 flex-1">{children}</main>

        <aside className="hidden w-60 shrink-0 flex-col gap-4 xl:flex">
          {user ? (
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <UserAvatar
                name={user.name}
                username={user.username}
                src={avatarSrc}
                size="default"
              />
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">
                  {user.username ? `@${user.username}` : user.name}
                </span>
                <Link
                  href="/settings"
                  className="text-muted-foreground hover:text-foreground text-xs"
                >
                  Settings
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 rounded-lg border p-4">
              <p className="text-sm font-medium">Join DevsHub</p>
              <p className="text-muted-foreground text-xs">
                Log in to post, comment, and vote.
              </p>
              <Button
                size="sm"
                nativeButton={false}
                render={<Link href="/login" />}
              >
                Log in
              </Button>
            </div>
          )}

          {user && <RecentActivity userId={user.id} />}

          <TrendingWidget />

          <div className="flex flex-col gap-3 rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <TrendingUpIcon className="size-4" aria-hidden="true" />
              <p className="text-sm font-medium">About</p>
            </div>
            <p className="text-muted-foreground text-xs">
              DevsHub is a focused home for developers to share, build, and grow
              together.
            </p>
            <Link
              href="/policy"
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              Content Policy
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
