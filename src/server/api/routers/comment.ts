import { TRPCError } from "@trpc/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { comments, posts } from "~/server/db/schema";

const MAX_DEPTH = 5;

const commentSortSchema = z.enum(["best", "new", "top"]);

function requireUserId(session: { user?: { id?: string } | null } | null) {
  const id = session?.user?.id;
  if (!id) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return id;
}

export const commentRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        postId: z.string().uuid(),
        body: z.string().trim().min(1).max(40000),
        parentCommentId: z.string().uuid().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = requireUserId(ctx.session);

      const post = await ctx.db.query.posts.findFirst({
        where: (table, { eq }) => eq(table.id, input.postId),
        columns: { id: true, deletedAt: true },
      });
      if (!post || post.deletedAt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found.",
        });
      }

      let depth = 0;
      if (input.parentCommentId) {
        const parent = await ctx.db.query.comments.findFirst({
          where: (table, { eq }) => eq(table.id, input.parentCommentId!),
          columns: { id: true, postId: true, depth: true, deletedAt: true },
        });
        if (!parent || parent.deletedAt) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Parent comment not found.",
          });
        }
        if (parent.postId !== input.postId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Reply must belong to the same post.",
          });
        }
        depth = parent.depth + 1;
      }

      const commentId = crypto.randomUUID();
      await ctx.db.batch([
        ctx.db.insert(comments).values({
          id: commentId,
          postId: input.postId,
          authorId: userId,
          parentCommentId: input.parentCommentId ?? null,
          body: input.body,
          depth: Math.min(depth, MAX_DEPTH),
        }),
        ctx.db
          .update(posts)
          .set({ commentCount: sql`${posts.commentCount} + 1` })
          .where(eq(posts.id, input.postId)),
      ]);

      return { id: commentId };
    }),

  list: publicProcedure
    .input(
      z.object({
        postId: z.string().uuid(),
        sort: commentSortSchema.default("best"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const post = await ctx.db.query.posts.findFirst({
        where: (table, { eq }) => eq(table.id, input.postId),
        columns: { id: true },
      });
      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const flat = await ctx.db.query.comments.findMany({
        where: (table, { eq }) => eq(table.postId, input.postId),
        with: { author: true },
      });

      const userId = ctx.session?.user?.id ?? null;
      let myVotes: Record<string, number> = {};
      if (userId && flat.length > 0) {
        const rows = await ctx.db.query.votes.findMany({
          where: (table, { and, eq, inArray }) =>
            and(
              eq(table.userId, userId),
              eq(table.targetType, "comment"),
              inArray(
                table.targetId,
                flat.map((c) => c.id),
              ),
            ),
          columns: { targetId: true, value: true },
        });
        myVotes = Object.fromEntries(rows.map((r) => [r.targetId, r.value]));
      }

      const flatWithVotes = flat.map((comment) => ({
        ...comment,
        myVote: myVotes[comment.id] ?? null,
      }));

      const byParent = new Map<string | null, typeof flatWithVotes>();
      for (const comment of flatWithVotes) {
        const key = comment.parentCommentId;
        const bucket = byParent.get(key) ?? [];
        bucket.push(comment);
        byParent.set(key, bucket);
      }

      const topLevel = byParent.get(null) ?? [];

      const sortFn = (
        a: (typeof flatWithVotes)[number],
        b: (typeof flatWithVotes)[number],
      ) => {
        if (input.sort === "new") {
          return b.createdAt.getTime() - a.createdAt.getTime();
        }
        if (input.sort === "top") {
          return b.score - a.score;
        }
        return (
          b.score - a.score || a.createdAt.getTime() - b.createdAt.getTime()
        );
      };

      type CommentNode = {
        comment: (typeof flatWithVotes)[number];
        replies: CommentNode[];
      };

      const buildTree = (
        list: (typeof flatWithVotes)[number][],
      ): CommentNode[] =>
        list.sort(sortFn).map((comment) => {
          const replies = byParent.get(comment.id) ?? [];
          return {
            comment,
            replies: comment.depth >= MAX_DEPTH ? [] : buildTree(replies),
          };
        });

      const tree = buildTree(topLevel);

      return {
        postId: input.postId,
        count: flat.length,
        tree,
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        body: z.string().trim().min(1).max(40000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = requireUserId(ctx.session);
      const comment = await ctx.db.query.comments.findFirst({
        where: (table, { eq }) => eq(table.id, input.id),
        columns: { id: true, authorId: true, deletedAt: true },
      });
      if (!comment || comment.deletedAt) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      if (comment.authorId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only edit your own comments.",
        });
      }

      await ctx.db
        .update(comments)
        .set({ body: input.body })
        .where(eq(comments.id, input.id));

      return { updated: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = requireUserId(ctx.session);
      const comment = await ctx.db.query.comments.findFirst({
        where: (table, { eq }) => eq(table.id, input.id),
        columns: { id: true, authorId: true, deletedAt: true },
      });
      if (!comment || comment.deletedAt) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      if (comment.authorId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own comments.",
        });
      }

      await ctx.db
        .update(comments)
        .set({ deletedAt: new Date(), body: "[deleted]" })
        .where(eq(comments.id, input.id));

      return { deleted: true };
    }),
});
