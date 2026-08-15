import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import type { db as drizzleDb } from "~/server/db";
import { reports, type ReportReason } from "~/server/db/schema";

type Db = typeof drizzleDb;

function requireUserId(session: { user?: { id?: string } | null } | null) {
  const id = session?.user?.id;
  if (!id) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return id;
}

async function getMembership(
  ctx: { db: Db },
  communityId: string,
  userId: string,
) {
  return ctx.db.query.communityMembers.findFirst({
    where: (table, { and, eq }) =>
      and(eq(table.communityId, communityId), eq(table.userId, userId)),
  });
}

function canModerate(role: string | undefined) {
  return role === "owner" || role === "moderator";
}

async function communityIdForTarget(
  ctx: { db: Db },
  targetType: "post" | "comment",
  targetId: string,
): Promise<string> {
  if (targetType === "post") {
    const post = await ctx.db.query.posts.findFirst({
      where: (table, { eq }) => eq(table.id, targetId),
      columns: { id: true, communityId: true, deletedAt: true },
    });
    if (!post || post.deletedAt) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }
    return post.communityId;
  }

  const comment = await ctx.db.query.comments.findFirst({
    where: (table, { eq }) => eq(table.id, targetId),
    with: { post: { columns: { communityId: true, deletedAt: true } } },
  });
  if (!comment || comment.deletedAt || comment.post.deletedAt) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }
  return comment.post.communityId;
}

export const reportRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        targetType: z.enum(["post", "comment"]),
        targetId: z.string().uuid(),
        reason: z.enum(["spam", "harassment", "off-topic", "other"]),
        details: z.string().trim().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = requireUserId(ctx.session);

      // Validate target exists and is not deleted.
      await communityIdForTarget(ctx, input.targetType, input.targetId);

      const [report] = await ctx.db
        .insert(reports)
        .values({
          reporterId: userId,
          targetType: input.targetType,
          targetId: input.targetId,
          reason: input.reason as ReportReason,
          details: input.details ?? null,
        })
        .returning({ id: reports.id });

      return { id: report!.id };
    }),

  listForCommunity: protectedProcedure
    .input(z.object({ communitySlug: z.string().trim().toLowerCase().min(1) }))
    .query(async ({ ctx, input }) => {
      const userId = requireUserId(ctx.session);

      const community = await ctx.db.query.communities.findFirst({
        where: (table, { eq }) => eq(table.slug, input.communitySlug),
        columns: { id: true },
      });
      if (!community) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const membership = await getMembership(ctx, community.id, userId);
      if (!canModerate(membership?.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only moderators can view the moderation queue.",
        });
      }

      // Fetch posts + comments in this community, then map reports to them.
      const communityPosts = await ctx.db.query.posts.findMany({
        where: (table, { eq }) => eq(table.communityId, community.id),
        columns: { id: true },
      });
      const postIds = communityPosts.map((p) => p.id);

      const postReports =
        postIds.length > 0
          ? await ctx.db.query.reports.findMany({
              where: (table, { and, eq, inArray }) =>
                and(
                  eq(table.targetType, "post"),
                  inArray(table.targetId, postIds),
                ),
              with: { reporter: true, resolver: true },
              orderBy: (table, { desc }) => [desc(table.createdAt)],
            })
          : [];

      const allComments = postIds.length
        ? await ctx.db.query.comments.findMany({
            where: (table, { inArray }) => inArray(table.postId, postIds),
            columns: { id: true },
          })
        : [];
      const commentIds = allComments.map((c) => c.id);

      const commentReports =
        commentIds.length > 0
          ? await ctx.db.query.reports.findMany({
              where: (table, { and, eq, inArray }) =>
                and(
                  eq(table.targetType, "comment"),
                  inArray(table.targetId, commentIds),
                ),
              with: { reporter: true, resolver: true },
              orderBy: (table, { desc }) => [desc(table.createdAt)],
            })
          : [];

      return { reports: [...postReports, ...commentReports] };
    }),

  resolve: protectedProcedure
    .input(
      z.object({
        reportId: z.string().uuid(),
        status: z.enum(["resolved", "dismissed"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = requireUserId(ctx.session);

      const report = await ctx.db.query.reports.findFirst({
        where: (table, { eq }) => eq(table.id, input.reportId),
        columns: { id: true, targetType: true, targetId: true, status: true },
      });
      if (!report) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Verify caller moderates the community the target belongs to.
      const communityId = await communityIdForTarget(
        ctx,
        report.targetType as "post" | "comment",
        report.targetId,
      );
      const membership = await getMembership(ctx, communityId, userId);
      if (!canModerate(membership?.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only moderators can resolve reports.",
        });
      }

      await ctx.db
        .update(reports)
        .set({ status: input.status, resolvedBy: userId })
        .where(eq(reports.id, input.reportId));

      return { updated: true };
    }),
});
