import { AppShell } from "~/components/layout/app-shell";
import { SubmitForm } from "./submit-form";

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ community?: string }>;
}) {
  const { community } = await searchParams;

  return (
    <AppShell>
      <SubmitForm initialCommunitySlug={community} />
    </AppShell>
  );
}
