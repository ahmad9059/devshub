import { authRouter } from "~/server/api/routers/auth";
import { communityRouter } from "~/server/api/routers/community";
import { profileRouter } from "~/server/api/routers/profile";
import { storageRouter } from "~/server/api/routers/storage";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  storage: storageRouter,
  profile: profileRouter,
  community: communityRouter,
});
export type AppRouter = typeof appRouter;
export const createCaller = createCallerFactory(appRouter);
