import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, eq, isNull, lt, or, sql, type SQL } from "drizzle-orm";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { db } from "~/server/db";
import { checkRateLimit, postLimiter } from "~/server/lib/ratelimit";
import { communities, posts } from "~/server/db/schema";

const slugify = (title: string): string =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 350);

const postSortSchema = z.enum(["hot", "new", "top"]);

// Reddit hot ranking: log10(max(|score|,1)) + (epoch - 1134028003) / 45000
function hotScore(score: number, createdAt: Date): number {
  const order = Math.log10(Math.max(Math.abs(score), 1));
  const seconds = createdAt.getTime() / 1000;
  return order + (seconds - 1134028003) / 45000;
}

function requireUserId(session: { user?: { id?: string } | null } | null) {
  const id = session?.user?.id;
  if (!id) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return id;
}

async function uniqueSlug(title: string): Promise<string> {
  const base = slugify(title);
  let slug = base || "post";
  let n = 1;
  for (;;) {
    const existing = await db.query.posts.findFirst({
      where: (table, { eq }) => eq(table.slug, slug),
      columns: { id: true },
    });
    if (!existing) {
      return slug;
    }
    slug = `${base}-${n}`;
    n += 1;
  }
}

export const postRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        communityId: z.string().uuid(),
        title: z.string().trim().min(3).max(300),
        body: z.string().trim().max(40000).optional(),
        imageObjectKey: z.string().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = requireUserId(ctx.session);

      await checkRateLimit(postLimiter, `post:${userId}`);

      if (!input.body && !input.imageObjectKey) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A post needs body text or an image.",
        });
      }

      const community = await ctx.db.query.communities.findFirst({
        where: (table, { eq }) => eq(table.id, input.communityId),
      });
      if (!community) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Community not found.",
        });
      }

      const membership = await ctx.db.query.communityMembers.findFirst({
        where: (table, { and, eq }) =>
          and(
            eq(table.communityId, input.communityId),
            eq(table.userId, userId),
          ),
      });
      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must join this community before posting.",
        });
      }

      const slug = await uniqueSlug(input.title);

      const postId = randomUUID();
      await ctx.db.batch([
        ctx.db.insert(posts).values({
          id: postId,
          communityId: input.communityId,
          authorId: userId,
          title: input.title,
          slug,
          body: input.body ?? null,
          imageObjectKey: input.imageObjectKey ?? null,
        }),
        ctx.db
          .update(communities)
          .set({ postCount: sql`${communities.postCount} + 1` })
          .where(eq(communities.id, input.communityId)),
      ]);

      return { id: postId, slug };
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const post = await ctx.db.query.posts.findFirst({
        where: (table, { eq }) => eq(table.slug, input.slug),
        with: {
          author: true,
          community: true,
        },
      });

      if (!post || post.deletedAt) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const userId = ctx.session?.user?.id ?? null;
      let myVote: number | null = null;
      if (userId) {
        const vote = await ctx.db.query.votes.findFirst({
          where: (table, { and, eq }) =>
            and(
              eq(table.userId, userId),
              eq(table.targetType, "post"),
              eq(table.targetId, post.id),
            ),
          columns: { value: true },
        });
        myVote = vote?.value ?? null;
      }

      return { ...post, myVote };
    }),

  list: publicProcedure
    .input(
      z.object({
        sort: postSortSchema.default("hot"),
        communitySlug: z.string().optional(),
        cursor: z.object({ createdAt: z.date(), score: z.number() }).optional(),
        limit: z.number().int().min(1).max(50).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { sort, limit, communitySlug } = input;

      const community = communitySlug
        ? await ctx.db.query.communities.findFirst({
            where: (table, { eq }) => eq(table.slug, communitySlug),
            columns: { id: true },
          })
        : null;

      const conditions: SQL[] = [isNull(posts.deletedAt)];
      if (community) {
        conditions.push(eq(posts.communityId, community.id));
      }
      if (input.cursor) {
        if (sort === "new") {
          conditions.push(lt(posts.createdAt, input.cursor.createdAt));
        } else if (sort === "top") {
          conditions.push(lt(posts.score, input.cursor.score));
        } else {
          conditions.push(
            or(
              lt(posts.score, input.cursor.score),
              and(
                eq(posts.score, input.cursor.score),
                lt(posts.createdAt, input.cursor.createdAt),
              ),
            )!,
          );
        }
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const items = await ctx.db.query.posts.findMany({
        where,
        with: {
          author: true,
          community: true,
        },
        orderBy:
          sort === "new"
            ? (table, { desc }) => [desc(table.createdAt)]
            : (table, { desc }) => [desc(table.score), desc(table.createdAt)],
        limit: limit + 1,
      });

      const hasMore = items.length > limit;
      const pageItems = items.slice(0, limit);

      // Hot ranking: Reddit hot algorithm (order by score DESC, createdAt DESC
      // proxy for launch, per plan §3.4). Applied consistently with cursor above.
      if (sort === "hot") {
        pageItems.sort((a, b) => {
          const hotA = hotScore(a.score, a.createdAt);
          const hotB = hotScore(b.score, b.createdAt);
          return hotB - hotA;
        });
      }

      const last = pageItems[pageItems.length - 1];

      // Attach current user's vote state for each item (batch query).
      const userId = ctx.session?.user?.id ?? null;
      let myVotes: Record<string, number> = {};
      if (userId && pageItems.length > 0) {
        const rows = await ctx.db.query.votes.findMany({
          where: (table, { and, eq, inArray }) =>
            and(
              eq(table.userId, userId),
              eq(table.targetType, "post"),
              inArray(
                table.targetId,
                pageItems.map((p) => p.id),
              ),
            ),
          columns: { targetId: true, value: true },
        });
        myVotes = Object.fromEntries(rows.map((r) => [r.targetId, r.value]));
      }

      return {
        items: pageItems.map((post) => ({
          ...post,
          myVote: myVotes[post.id] ?? null,
        })),
        nextCursor:
          hasMore && last
            ? { createdAt: last.createdAt, score: last.score }
            : null,
      };
    }),

  listByUser: publicProcedure
    .input(
      z.object({
        username: z.string().trim().toLowerCase().min(1),
        cursor: z.date().optional(),
        limit: z.number().int().min(1).max(50).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({
        where: (table, { eq }) => eq(table.username, input.username),
        columns: { id: true },
      });
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const conditions: SQL[] = [
        eq(posts.authorId, user.id),
        isNull(posts.deletedAt),
      ];
      if (input.cursor) {
        conditions.push(lt(posts.createdAt, input.cursor));
      }

      const items = await ctx.db.query.posts.findMany({
        where: and(...conditions),
        with: { community: true },
        orderBy: (table, { desc }) => [desc(table.createdAt)],
        limit: input.limit + 1,
      });

      const hasMore = items.length > input.limit;
      const pageItems = items.slice(0, input.limit);
      const last = pageItems[pageItems.length - 1];

      return {
        items: pageItems,
        nextCursor: hasMore && last ? last.createdAt : null,
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().trim().min(3).max(300).optional(),
        body: z.string().trim().max(40000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = requireUserId(ctx.session);
      const post = await ctx.db.query.posts.findFirst({
        where: (table, { eq }) => eq(table.id, input.id),
      });
      if (!post || post.deletedAt) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      if (post.authorId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only edit your own posts.",
        });
      }

      const values: { title?: string; body?: string | null } = {};
      if (input.title !== undefined && input.title !== post.title) {
        values.title = input.title;
      }
      if (input.body !== undefined) {
        values.body = input.body === "" ? null : input.body;
      }

      if (Object.keys(values).length === 0) {
        return { updated: false };
      }

      await ctx.db.update(posts).set(values).where(eq(posts.id, input.id));

      return { updated: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = requireUserId(ctx.session);
      const post = await ctx.db.query.posts.findFirst({
        where: (table, { eq }) => eq(table.id, input.id),
      });
      if (!post || post.deletedAt) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      if (post.authorId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own posts.",
        });
      }

      await ctx.db
        .update(posts)
        .set({ deletedAt: new Date() })
        .where(eq(posts.id, input.id));

      return { deleted: true };
    }),

  modDelete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = requireUserId(ctx.session);
      const post = await ctx.db.query.posts.findFirst({
        where: (table, { eq }) => eq(table.id, input.id),
      });
      if (!post || post.deletedAt) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Caller must be a moderator/owner of the post's community.
      const membership = await ctx.db.query.communityMembers.findFirst({
        where: (table, { and, eq }) =>
          and(
            eq(table.communityId, post.communityId),
            eq(table.userId, userId),
          ),
      });
      const role = membership?.role;
      if (role !== "owner" && role !== "moderator") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only moderators can remove posts.",
        });
      }

      await ctx.db
        .update(posts)
        .set({ deletedAt: new Date() })
        .where(eq(posts.id, input.id));

      return { deleted: true };
    }),
});
