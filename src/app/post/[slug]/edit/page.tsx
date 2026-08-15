import { AppShell } from "~/components/layout/app-shell";
import { EditPostForm } from "./edit-post-form";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <AppShell>
      <EditPostForm slug={slug} />
    </AppShell>
  );
}
