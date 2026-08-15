import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { users } from "~/server/db/schema";
import { verifyTurnstileToken } from "~/server/turnstile";

const signupSchema = z.object({
  name: z.string().trim().min(2).max(50),
  email: z.string().trim().toLowerCase().email().max(255),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number")
    .regex(/[^a-zA-Z0-9]/, "Password must contain a special character"),
  turnstileToken: z.string().min(1),
});

export const authRouter = createTRPCRouter({
  signup: publicProcedure
    .input(signupSchema)
    .mutation(async ({ ctx, input }) => {
      const turnstileValid = await verifyTurnstileToken(input.turnstileToken);
      if (!turnstileValid) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Bot verification failed. Please try again.",
        });
      }

      const existing = await ctx.db.query.users.findFirst({
        where: (table, { eq }) => eq(table.email, input.email),
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists.",
        });
      }

      const passwordHash = await bcrypt.hash(input.password, 12);
      const [user] = await ctx.db
        .insert(users)
        .values({
          name: input.name,
          email: input.email,
          passwordHash,
        })
        .returning();

      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create account. Please try again.",
        });
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      };
    }),
  getSession: publicProcedure.query(({ ctx }) => ctx.session),
});
