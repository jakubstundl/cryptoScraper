import { z } from "zod";
import { prisma } from "~/server/db";
import { scrape } from "~/server/scraper";
import { coinPredictions, coinShort } from "~/server/coinsList";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const scrapingRouter = createTRPCRouter({
  getShortsAndUrls: publicProcedure.query(() => {
    return {coinShort:coinShort, url:coinPredictions};
  }),

  getEther: publicProcedure.query(async () => {
    if (coinPredictions.has("ETH")) {
      const dataFRomDb = await prisma.coinPrediction.findUnique({
        where: { name: "ETH" },
      });
      if (
        dataFRomDb &&
        dataFRomDb.time &&
        Math.abs(dataFRomDb.time - Date.now()) / 1000 / 60 < 60 //60min
      ) {
        return { coinData: dataFRomDb };
      } else {
        const data = await scrape(coinPredictions.get("ETH") as string);
        await prisma.coinPrediction.upsert({
          where: {
            name: "ETH",
          },
          update: { time: Date.now() },

          create: {
            name: "ETH",
            time: Date.now(),
          },
        });
        await prisma.coinPrediction.update({
          where: { name: "ETH" },
          data: {
            time: Date.now(),
            d1: data.get("d1"),
            d2: data.get("d2"),
            d3: data.get("d3"),
            d4: data.get("d4"),
            d5: data.get("d5"),
            d6: data.get("d6"),
            d7: data.get("d7"),
            v1: data.get("v1"),
            v2: data.get("v2"),
            v3: data.get("v3"),
            v4: data.get("v4"),
            v5: data.get("v5"),
            v6: data.get("v6"),
            v7: data.get("v7"),
          },
        });
        const dataFRomDb = await prisma.coinPrediction.findUnique({
          where: { name: "ETH" },
        });
        return { coinData: dataFRomDb };
      }
    }
  }),

  scrape: publicProcedure
    .input(z.object({ coin: z.string() }))
    .mutation(async ({input}) => {
      const coin = input.coin;
       if (coinPredictions.has(coin)) {
        const dataFRomDb = await prisma.coinPrediction.findUnique({
          where: { name: coin },
        });
        if (
          dataFRomDb &&
          dataFRomDb.time &&
          Math.abs(dataFRomDb.time - Date.now()) / 1000 / 60 < 60 //60min
        ) {
                    return { coinData: dataFRomDb };
        } else {
          const data = await scrape(coinPredictions.get(coin) as string);
          await prisma.coinPrediction.upsert({
            where: {
              name: coin,
            },
            update: { time: Date.now() },
  
            create: {
              name: coin,
              time: Date.now(),
            },
          });
          await prisma.coinPrediction.update({
            where: { name: coin },
            data: {
              time: Date.now(),
              d1: data.get("d1"),
              d2: data.get("d2"),
              d3: data.get("d3"),
              d4: data.get("d4"),
              d5: data.get("d5"),
              d6: data.get("d6"),
              d7: data.get("d7"),
              v1: data.get("v1"),
              v2: data.get("v2"),
              v3: data.get("v3"),
              v4: data.get("v4"),
              v5: data.get("v5"),
              v6: data.get("v6"),
              v7: data.get("v7"),
              p1: data.get("p1"),
              p2: data.get("p2"),
              p3: data.get("p3"),
              p4: data.get("p4"),
              p5: data.get("p5"),
              p6: data.get("p6"),
              p7: data.get("p7"),
            },
          });
          const dataFRomDb = await prisma.coinPrediction.findUnique({
            where: { name: coin },
          });
          return { coinData: dataFRomDb };
        }
      }

    }),
});
