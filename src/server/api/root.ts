import { storageRouter } from "~/server/api/routers/storage";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

export const appRouter = createTRPCRouter({ storage: storageRouter });
export type AppRouter = typeof appRouter;
export const createCaller = createCallerFactory(appRouter);
