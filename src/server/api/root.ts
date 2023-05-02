import { createTRPCRouter } from "~/server/api/trpc";
import { scrapingRouter } from "~/server/api/routers/default";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  defaultRouter: scrapingRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
