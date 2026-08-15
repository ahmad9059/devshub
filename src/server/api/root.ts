import { authRouter } from "~/server/api/routers/auth";
import { profileRouter } from "~/server/api/routers/profile";
import { storageRouter } from "~/server/api/routers/storage";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  storage: storageRouter,
  profile: profileRouter,
});
export type AppRouter = typeof appRouter;
export const createCaller = createCallerFactory(appRouter);
