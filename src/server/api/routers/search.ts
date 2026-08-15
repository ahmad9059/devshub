import { and, eq, ilike, isNull, lt, or, sql, type SQL } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { posts } from "~/server/db/schema";

const searchQuerySchema = z.string().trim().min(1).max(100);

export const searchRouter = createTRPCRouter({
  posts: publicProcedure
    .input(
      z.object({
        q: searchQuerySchema,
        cursor: z.object({ createdAt: z.date(), score: z.number() }).optional(),
        limit: z.number().int().min(1).max(50).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { q, limit } = input;

      const conditions: SQL[] = [isNull(posts.deletedAt)];

      // Full-text search on title + body, fallback to ILIKE for substring.
      const tsquery = sql`plainto_tsquery('english', ${q})`;
      conditions.push(
        sql`(
          to_tsvector('english', coalesce(${posts.title}, '') || ' ' || coalesce(${posts.body}, ''))
          @@ ${tsquery}
          OR ${posts.title} ILIKE ${`%${q}%`}
          OR ${posts.body} ILIKE ${`%${q}%`}
        )`,
      );

      if (input.cursor) {
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

      const items = await ctx.db.query.posts.findMany({
        where: and(...conditions),
        with: {
          author: true,
          community: true,
        },
        orderBy: (table, { desc }) => [
          desc(table.score),
          desc(table.createdAt),
        ],
        limit: limit + 1,
      });

      const hasMore = items.length > limit;
      const pageItems = items.slice(0, limit);
      const last = pageItems[pageItems.length - 1];

      return {
        items: pageItems.map((post) => ({ ...post, myVote: null })),
        nextCursor:
          hasMore && last
            ? { createdAt: last.createdAt, score: last.score }
            : null,
      };
    }),

  communities: publicProcedure
    .input(
      z.object({
        q: searchQuerySchema,
        limit: z.number().int().min(1).max(50).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { q, limit } = input;

      const items = await ctx.db.query.communities.findMany({
        where: (table, { or }) =>
          or(
            ilike(table.name, `%${q}%`),
            ilike(table.slug, `%${q}%`),
            table.description ? ilike(table.description, `%${q}%`) : undefined,
          ),
        orderBy: (table, { desc }) => [desc(table.memberCount)],
        limit,
      });

      return items;
    }),

  users: publicProcedure
    .input(
      z.object({
        q: searchQuerySchema,
        limit: z.number().int().min(1).max(50).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { q, limit } = input;

      const items = await ctx.db.query.users.findMany({
        columns: {
          id: true,
          username: true,
          name: true,
          avatarObjectKey: true,
        },
        where: (table, { or }) =>
          or(
            table.username ? ilike(table.username, `%${q}%`) : undefined,
            table.name ? ilike(table.name, `%${q}%`) : undefined,
          ),
        orderBy: (table, { asc }) => [asc(table.username)],
        limit,
      });

      return items;
    }),

  trending: publicProcedure.query(async ({ ctx }) => {
    const trendingCommunities = await ctx.db.query.communities.findMany({
      orderBy: (table, { desc }) => [desc(table.memberCount)],
      limit: 10,
    });

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const popularPosts = await ctx.db.query.posts.findMany({
      where: (table, { and, isNull, gte }) =>
        and(isNull(table.deletedAt), gte(table.createdAt, since24h)),
      with: {
        author: true,
        community: true,
      },
      orderBy: (table, { desc }) => [desc(table.score), desc(table.createdAt)],
      limit: 10,
    });

    return {
      trendingCommunities,
      popularPosts: popularPosts.map((post) => ({ ...post, myVote: null })),
    };
  }),
});
