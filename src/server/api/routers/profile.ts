import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { users } from "~/server/db/schema";

const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(20)
  .regex(/^[a-z0-9-]+$/, "Use only lowercase letters, numbers, and hyphens")
  .regex(/^[a-z0-9]/, "Username must start with a letter or number")
  .regex(/[a-z0-9]$/, "Username must end with a letter or number");

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const publicUserColumns = {
  id: true,
  name: true,
  email: true,
  username: true,
  bio: true,
  avatarObjectKey: true,
  createdAt: true,
} as const;

const publicUserSelect = {
  id: users.id,
  name: users.name,
  email: users.email,
  username: users.username,
  bio: users.bio,
  avatarObjectKey: users.avatarObjectKey,
  createdAt: users.createdAt,
} as const;

function requireUserId(session: { user?: { id?: string } | null } | null) {
  const id = session?.user?.id;
  if (!id) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return id;
}

export const profileRouter = createTRPCRouter({
  getByUsername: publicProcedure
    .input(z.object({ username: z.string().trim().toLowerCase().min(1) }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({
        columns: publicUserColumns,
        where: (table, { eq }) => eq(table.username, input.username),
        with: {
          posts: {
            with: { community: true },
            orderBy: (table, { desc }) => [desc(table.createdAt)],
          },
          comments: {
            with: { post: { with: { community: true } } },
            orderBy: (table, { desc }) => [desc(table.createdAt)],
          },
          memberships: {
            with: { community: true },
          },
        },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return user;
    }),

  getMe: protectedProcedure.query(async ({ ctx }) => {
    const userId = requireUserId(ctx.session);
    const user = await ctx.db.query.users.findFirst({
      columns: publicUserColumns,
      where: (table, { eq }) => eq(table.id, userId),
      with: {
        posts: { with: { community: true } },
        comments: { with: { post: true } },
        memberships: { with: { community: true } },
      },
    });

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return user;
  }),

  checkUsername: publicProcedure
    .input(z.object({ username: z.string().trim().toLowerCase().min(1) }))
    .query(async ({ ctx, input }) => {
      const parsed = usernameSchema.safeParse(input.username);
      if (!parsed.success) {
        return { available: false, reason: "invalid" };
      }

      const existing = await ctx.db.query.users.findFirst({
        where: (table, { eq }) => eq(table.username, input.username),
      });

      return { available: existing === undefined, reason: "taken" };
    }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        username: usernameSchema.optional(),
        bio: z.string().trim().max(500).optional(),
        avatarObjectKey: z.string().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = requireUserId(ctx.session);
      const current = await ctx.db.query.users.findFirst({
        where: (table, { eq }) => eq(table.id, userId),
      });
      if (!current) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const values: {
        username?: string;
        usernameUpdatedAt?: Date;
        bio?: string | null;
        avatarObjectKey?: string;
      } = {};

      if (input.username !== undefined && input.username !== current.username) {
        const existing = await ctx.db.query.users.findFirst({
          where: (table, { eq, ne }) =>
            and(eq(table.username, input.username!), ne(table.id, userId)),
        });
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "That username is already taken.",
          });
        }

        if (
          current.username &&
          current.usernameUpdatedAt &&
          Date.now() - current.usernameUpdatedAt.getTime() < THIRTY_DAYS_MS
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only change your username once every 30 days.",
          });
        }

        values.username = input.username;
        values.usernameUpdatedAt = new Date();
      }

      if (input.bio !== undefined) {
        values.bio = input.bio === "" ? null : input.bio;
      }

      if (input.avatarObjectKey !== undefined) {
        values.avatarObjectKey = input.avatarObjectKey;
      }

      if (Object.keys(values).length === 0) {
        const [unchanged] = await ctx.db
          .select(publicUserSelect)
          .from(users)
          .where(eq(users.id, userId));
        return unchanged!;
      }

      await ctx.db.update(users).set(values).where(eq(users.id, userId));

      const [updated] = await ctx.db
        .select(publicUserSelect)
        .from(users)
        .where(eq(users.id, userId));

      return updated!;
    }),
});
