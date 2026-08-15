import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { communities, communityMembers } from "~/server/db/schema";

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(30)
  .regex(/^[a-z0-9-]+$/, "Use only lowercase letters, numbers, and hyphens");

const nameSchema = z.string().trim().min(1).max(100);

const descriptionSchema = z.string().trim().max(500).optional();

const MAX_COMMUNITIES_PER_USER = 50;

function requireUserId(session: { user?: { id?: string } | null } | null) {
  const id = session?.user?.id;
  if (!id) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return id;
}

export const communityRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        slug: slugSchema,
        name: nameSchema,
        description: descriptionSchema,
        iconObjectKey: z.string().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = requireUserId(ctx.session);

      const count = await ctx.db.$count(
        communityMembers,
        eq(communityMembers.userId, userId),
      );
      if (count >= MAX_COMMUNITIES_PER_USER) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You've reached the community creation limit.",
        });
      }

      const existing = await ctx.db.query.communities.findFirst({
        where: (table, { eq }) => eq(table.slug, input.slug),
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "That community slug is already taken.",
        });
      }

      const communityId = randomUUID();
      await ctx.db.batch([
        ctx.db.insert(communities).values({
          id: communityId,
          slug: input.slug,
          name: input.name,
          description: input.description ?? null,
          iconObjectKey: input.iconObjectKey ?? null,
          ownerId: userId,
          memberCount: 1,
        }),
        ctx.db.insert(communityMembers).values({
          communityId,
          userId,
          role: "owner",
        }),
      ]);

      return {
        id: communityId,
        slug: input.slug,
        name: input.name,
      };
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string().trim().toLowerCase().min(1) }))
    .query(async ({ ctx, input }) => {
      const community = await ctx.db.query.communities.findFirst({
        where: (table, { eq }) => eq(table.slug, input.slug),
        with: {
          owner: true,
          posts: {
            where: (table, { isNull }) => isNull(table.deletedAt),
            with: { author: true, community: true },
            orderBy: (table, { desc }) => [desc(table.createdAt)],
          },
        },
      });

      if (!community) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return community;
    }),

  list: publicProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(50).default(10),
        offset: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.db.query.communities.findMany({
        orderBy: (table, { desc }) => [
          desc(table.memberCount),
          desc(table.createdAt),
        ],
        limit: input.limit,
        offset: input.offset,
      });

      return items;
    }),

  listMine: protectedProcedure.query(async ({ ctx }) => {
    const userId = requireUserId(ctx.session);

    const memberships = await ctx.db.query.communityMembers.findMany({
      where: (table, { eq }) => eq(table.userId, userId),
      with: { community: true },
      orderBy: (table, { desc }) => [desc(table.joinedAt)],
    });

    return memberships;
  }),

  join: protectedProcedure
    .input(z.object({ communityId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = requireUserId(ctx.session);

      const community = await ctx.db.query.communities.findFirst({
        where: (table, { eq }) => eq(table.id, input.communityId),
      });
      if (!community) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const existing = await ctx.db.query.communityMembers.findFirst({
        where: (table, { and, eq }) =>
          and(
            eq(table.communityId, input.communityId),
            eq(table.userId, userId),
          ),
      });
      if (existing) {
        return { joined: false };
      }

      await ctx.db.batch([
        ctx.db.insert(communityMembers).values({
          communityId: input.communityId,
          userId,
          role: "member",
        }),
        ctx.db
          .update(communities)
          .set({ memberCount: sql`${communities.memberCount} + 1` })
          .where(eq(communities.id, input.communityId)),
      ]);

      return { joined: true };
    }),

  leave: protectedProcedure
    .input(z.object({ communityId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = requireUserId(ctx.session);

      const membership = await ctx.db.query.communityMembers.findFirst({
        where: (table, { and, eq }) =>
          and(
            eq(table.communityId, input.communityId),
            eq(table.userId, userId),
          ),
      });
      if (!membership) {
        return { left: false };
      }

      if (membership.role === "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Owners cannot leave their own community.",
        });
      }

      await ctx.db.batch([
        ctx.db
          .delete(communityMembers)
          .where(
            and(
              eq(communityMembers.communityId, input.communityId),
              eq(communityMembers.userId, userId),
            ),
          ),
        ctx.db
          .update(communities)
          .set({ memberCount: sql`${communities.memberCount} - 1` })
          .where(eq(communities.id, input.communityId)),
      ]);

      return { left: true };
    }),

  update: protectedProcedure
    .input(
      z.object({
        communityId: z.string().uuid(),
        name: nameSchema.optional(),
        description: descriptionSchema,
        iconObjectKey: z.string().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = requireUserId(ctx.session);

      const membership = await ctx.db.query.communityMembers.findFirst({
        where: (table, { and, eq }) =>
          and(
            eq(table.communityId, input.communityId),
            eq(table.userId, userId),
          ),
      });
      if (
        !membership ||
        (membership.role !== "owner" && membership.role !== "moderator")
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the owner or a moderator can edit this community.",
        });
      }

      const values: {
        name?: string;
        description?: string | null;
        iconObjectKey?: string;
      } = {};

      if (input.name !== undefined) {
        values.name = input.name;
      }
      if (input.description !== undefined) {
        values.description =
          input.description === "" ? null : input.description;
      }
      if (input.iconObjectKey !== undefined) {
        values.iconObjectKey = input.iconObjectKey;
      }

      if (Object.keys(values).length === 0) {
        return { updated: false };
      }

      await ctx.db
        .update(communities)
        .set(values)
        .where(eq(communities.id, input.communityId));

      return { updated: true };
    }),

  checkSlug: publicProcedure
    .input(z.object({ slug: z.string().trim().toLowerCase().min(1) }))
    .query(async ({ ctx, input }) => {
      const parsed = slugSchema.safeParse(input.slug);
      if (!parsed.success) {
        return { available: false, reason: "invalid" };
      }

      const existing = await ctx.db.query.communities.findFirst({
        where: (table, { eq }) => eq(table.slug, input.slug),
      });

      return { available: existing === undefined, reason: "taken" };
    }),
});
