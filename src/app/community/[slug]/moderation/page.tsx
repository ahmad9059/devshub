import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TRPCError } from "@trpc/server";

import { auth } from "~/auth";
import { AppShell } from "~/components/layout/app-shell";
import { createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { ModerationQueue } from "./moderation-queue";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Moderation: d/${slug}`,
    description: `Moderation queue for d/${slug}.`,
  };
}

export default async function ModerationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ctx = await createTRPCContext({ headers: new Headers() });
  const caller = createCaller(ctx);

  let community;
  try {
    community = await caller.community.getBySlug({ slug });
  } catch (err) {
    if (err instanceof TRPCError && err.code === "NOT_FOUND") {
      notFound();
    }
    throw err;
  }

  const session = await auth();
  const sessionUserId = session?.user?.id ?? null;

  // Verify caller is a moderator/owner.
  const membership = sessionUserId
    ? await ctx.db.query.communityMembers.findFirst({
        where: (table, { and, eq }) =>
          and(
            eq(table.communityId, community.id),
            eq(table.userId, sessionUserId),
          ),
      })
    : null;
  const isModerator =
    membership?.role === "owner" || membership?.role === "moderator";

  if (!isModerator) {
    notFound();
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Moderation queue
            </h1>
            <p className="text-muted-foreground text-sm">d/{community.slug}</p>
          </div>
          <Link
            href={`/community/${community.slug}`}
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            Back to community
          </Link>
        </div>
        <ModerationQueue communitySlug={slug} />
      </div>
    </AppShell>
  );
}
