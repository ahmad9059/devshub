import { AppShell } from "~/components/layout/app-shell";
import { PostFeed } from "~/components/post-feed";

export default function HomePage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold tracking-tight">Home</h1>
        <PostFeed />
      </div>
    </AppShell>
  );
}
