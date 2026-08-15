import { auth } from "~/auth";
import { AppShell } from "~/components/layout/app-shell";
import { PostFeed } from "~/components/post-feed";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  const isLoggedIn = Boolean(session?.user);

  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold tracking-tight">Home</h1>
        <PostFeed isLoggedIn={isLoggedIn} />
      </div>
    </AppShell>
  );
}
