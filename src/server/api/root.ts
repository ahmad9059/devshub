import { authRouter } from "~/server/api/routers/auth";
import { communityRouter } from "~/server/api/routers/community";
import { postRouter } from "~/server/api/routers/post";
import { profileRouter } from "~/server/api/routers/profile";
import { storageRouter } from "~/server/api/routers/storage";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  storage: storageRouter,
  profile: profileRouter,
  community: communityRouter,
  post: postRouter,
});
export type AppRouter = typeof appRouter;
export const createCaller = createCallerFactory(appRouter);
