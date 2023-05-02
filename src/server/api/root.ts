import { createTRPCRouter } from "~/server/api/trpc";
import { coinCodexRouter } from "./routers/coinCodexRouter";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  coinCodexRouter: coinCodexRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
