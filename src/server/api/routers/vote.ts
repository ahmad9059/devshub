import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { comments, posts, votes } from "~/server/db/schema";

const voteValueSchema = z.union([z.literal(1), z.literal(-1)]);

const targetSchema = z.object({
  targetType: z.enum(["post", "comment"]),
  targetId: z.string().uuid(),
});

function requireUserId(session: { user?: { id?: string } | null } | null) {
  const id = session?.user?.id;
  if (!id) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return id;
}

export const voteRouter = createTRPCRouter({
  cast: protectedProcedure
    .input(
      z.object({
        targetType: z.enum(["post", "comment"]),
        targetId: z.string().uuid(),
        value: voteValueSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = requireUserId(ctx.session);

      if (input.targetType === "post") {
        const post = await ctx.db.query.posts.findFirst({
          where: (t, { eq }) => eq(t.id, input.targetId),
          columns: { id: true, deletedAt: true },
        });
        if (!post || post.deletedAt) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
      } else {
        const comment = await ctx.db.query.comments.findFirst({
          where: (t, { eq }) => eq(t.id, input.targetId),
          columns: { id: true, deletedAt: true },
        });
        if (!comment || comment.deletedAt) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
      }

      const existing = await ctx.db.query.votes.findFirst({
        where: (table, { eq }) =>
          and(
            eq(table.userId, userId),
            eq(table.targetType, input.targetType),
            eq(table.targetId, input.targetId),
          ),
        columns: { id: true, value: true },
      });

      const table = input.targetType === "post" ? posts : comments;

      // Toggle off: same vote exists -> remove it
      if (existing && existing.value === input.value) {
        await ctx.db.batch([
          ctx.db.delete(votes).where(eq(votes.id, existing.id)),
          ctx.db
            .update(table)
            .set({ score: sql`${table.score} - ${input.value}` })
            .where(eq(table.id, input.targetId)),
        ]);
        return { vote: null as number | null, score: "reverted" as const };
      }

      // Change vote: different value exists -> update + apply delta 2*value
      if (existing && existing.value !== input.value) {
        await ctx.db.batch([
          ctx.db
            .update(votes)
            .set({ value: input.value })
            .where(eq(votes.id, existing.id)),
          ctx.db
            .update(table)
            .set({ score: sql`${table.score} + ${2 * input.value}` })
            .where(eq(table.id, input.targetId)),
        ]);
        return { vote: input.value, score: "changed" as const };
      }

      // New vote
      const voteId = crypto.randomUUID();
      await ctx.db.batch([
        ctx.db.insert(votes).values({
          id: voteId,
          userId,
          targetType: input.targetType,
          targetId: input.targetId,
          value: input.value,
        }),
        ctx.db
          .update(table)
          .set({ score: sql`${table.score} + ${input.value}` })
          .where(eq(table.id, input.targetId)),
      ]);
      return { vote: input.value, score: "added" as const };
    }),

  getMyVote: protectedProcedure
    .input(targetSchema)
    .query(async ({ ctx, input }) => {
      const userId = requireUserId(ctx.session);
      const existing = await ctx.db.query.votes.findFirst({
        where: (table, { eq }) =>
          and(
            eq(table.userId, userId),
            eq(table.targetType, input.targetType),
            eq(table.targetId, input.targetId),
          ),
        columns: { value: true },
      });
      return existing?.value ?? null;
    }),

  getMyVotes: publicProcedure
    .input(
      z.object({
        targetType: z.enum(["post", "comment"]),
        targetIds: z.array(z.string().uuid()).max(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id ?? null;
      if (!userId || input.targetIds.length === 0) {
        return {};
      }

      const rows = await ctx.db.query.votes.findMany({
        where: (table, { and, eq, inArray }) =>
          and(
            eq(table.userId, userId),
            eq(table.targetType, input.targetType),
            inArray(table.targetId, input.targetIds),
          ),
        columns: { targetId: true, value: true },
      });

      const map: Record<string, number> = {};
      for (const row of rows) {
        map[row.targetId] = row.value;
      }
      return map;
    }),
});
