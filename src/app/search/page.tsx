import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "~/auth";
import { AppShell } from "~/components/layout/app-shell";
import { SearchResults } from "./search-results";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `Search: ${q}` : "Search",
    description: "Search DevsHub for posts, communities, and developers.",
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  if (!q || !q.trim()) {
    redirect("/");
  }

  const query = q.trim();

  const session = await auth();
  const isLoggedIn = Boolean(session?.user);

  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold tracking-tight">
          Results for &ldquo;{query}&rdquo;
        </h1>
        <SearchResults query={query} isLoggedIn={isLoggedIn} />
      </div>
    </AppShell>
  );
}
