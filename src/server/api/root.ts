import { authRouter } from "~/server/api/routers/auth";
import { commentRouter } from "~/server/api/routers/comment";
import { communityRouter } from "~/server/api/routers/community";
import { postRouter } from "~/server/api/routers/post";
import { profileRouter } from "~/server/api/routers/profile";
import { searchRouter } from "~/server/api/routers/search";
import { storageRouter } from "~/server/api/routers/storage";
import { voteRouter } from "~/server/api/routers/vote";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  storage: storageRouter,
  profile: profileRouter,
  community: communityRouter,
  post: postRouter,
  comment: commentRouter,
  vote: voteRouter,
  search: searchRouter,
});
export type AppRouter = typeof appRouter;
export const createCaller = createCallerFactory(appRouter);
