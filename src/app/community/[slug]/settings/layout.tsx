import { AppShell } from "~/components/layout/app-shell";

export default function CommunitySettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
