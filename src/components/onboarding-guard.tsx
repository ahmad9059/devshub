import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "~/auth";
import { db } from "~/server/db";

export async function OnboardingGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return children;
  }

  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? headersList.get("pathname");

  if (pathname && pathname.startsWith("/onboarding")) {
    return children;
  }

  const user = await db.query.users.findFirst({
    where: (table, { eq }) => eq(table.id, userId),
    columns: { username: true },
  });

  if (user && !user.username) {
    redirect("/onboarding");
  }

  return children;
}
