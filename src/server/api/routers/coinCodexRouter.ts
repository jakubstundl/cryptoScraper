import { z } from "zod";
import { prisma } from "~/server/db";
import { scrapeCoinCodexPRedictions } from "~/server/scrapeCoinCodex";
import { coinPredictions, coinShort } from "~/server/coinsList";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { coinTradeData, type coinCodexPrediction } from "@prisma/client";

export const coinCodexRouter = createTRPCRouter({
  getInitialData: publicProcedure.query(async () => {
    return {
      coinShort: coinShort(),
      url: coinPredictions,
      availableCoins: await getAvailableCoins(),
      coinTradeData: await getCoinTradeData(),
    };
  }),

  scrape: publicProcedure
    .input(z.object({ coin: z.string() }))
    .mutation(async ({ input }) => {
      const coin = input.coin;
      try {
        await prisma.coinCodexPrediction.delete({ where: { name: coin } });
      } catch (error) {
        console.log("Unable to delete");
      }
      return await upsertDbAndReturn(coin);
    }),

  truncate: publicProcedure.input(z.boolean()).mutation(async ({ input }) => {
    if (input) {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE coinCodexPrediction;`);
        return { message: true };
      } catch (error) {
        return { message: false };
      }
    } else {
      return { message: false };
    }
  }),

  fillDb: publicProcedure.query(async () => {
    let index = 0;
    const numberOfCoins = coinShort().length 
    for (const coin of coinShort()) {   
      index++;
      try {
        await prisma.coinCodexPrediction.delete ({ where: { name: coin } });
      } catch (error) {
        console.log("No data to delete");        
      }      
      await upsertDbAndReturn(coin);
      console.log(coin," upsert ", `${index} of ${numberOfCoins}`);      
    }
  }),
  updateTradeData: publicProcedure
    .input(z.object({ name:z.string(),count:z.number(),
      boughtFor:z.number(),
      boughtAt:z.number(),
      sellAt:z.number(),
    }))
    .mutation(async ({ input }) => {
      
      try {
        await prisma.coinTradeData.upsert({
          where: {
            name: input.name,
          },
          update: { count:input.count },
          create: {
            name: input.name,
            count:input.count,
            boughtFor:input.boughtFor,
            boughtAt:input.boughtAt,
            sellAt:input.sellAt
          },
        });

        await prisma.coinTradeData.update({where:{name:input.name}, data:{
          count:input.count,
          boughtFor:input.boughtFor,
          boughtAt:input.boughtAt,
          sellAt:input.sellAt
  
        }})
      } catch (error) {
        console.log("Unable to update trade data");
      }
      return await prisma.coinTradeData.findUnique({
        where: { name: input.name },
      });
    }),
});

export const upsertDbAndReturn = async (
  coin: string
): Promise<
  | {
      coinData: coinCodexPrediction | null;
    }
  | undefined
> => {
  try {
    if (coinPredictions.has(coin)) {
      const dataFRomDb = await prisma.coinCodexPrediction.findUnique({
        where: { name: coin },
      });
      if (
        dataFRomDb &&
        dataFRomDb.time &&
        Math.abs(dataFRomDb.time - Date.now()) / 1000 / 60 < 720 //12h
      ) {
        return { coinData: dataFRomDb };
      } else {
        const data = await scrapeCoinCodexPRedictions(
          coinPredictions.get(coin) as string
        );
        await prisma.coinCodexPrediction.upsert({
          where: {
            name: coin,
          },
          update: { time: Date.now() },

          create: {
            name: coin,
            time: Date.now(),
          },
        });
        await prisma.coinCodexPrediction.update({
          where: { name: coin },
          data: {
            time: Date.now(),
            days: data.get("days"),
            values: data.get("values"),
            percentages: data.get("percentages"),
          },
        });
        const dataFRomDb = await prisma.coinCodexPrediction.findUnique({
          where: { name: coin },
        });
        return { coinData: dataFRomDb };
      }
    }
  } catch (error) {
    console.log("Couldnt upsert");
  }
};

const getAvailableCoins = async () => {
  try {
    const map = new Map<string, coinCodexPrediction>();
    for (const coin of coinShort()) {
      const dataFromDb = await prisma.coinCodexPrediction.findUnique({
        where: { name: coin },
      });
      if (dataFromDb) {
        map.set(coin, dataFromDb);
      }
    }
    return map;
  } catch (error) {
    console.log("Couldnt get available coins");
  }
};


const getCoinTradeData = async () => {
  try {
    const map = new Map<string, coinTradeData>();
    for (const coin of coinShort()) {
      const dataFromDb = await prisma.coinTradeData.findUnique({
        where: { name: coin },
      });
      if (dataFromDb) {
        map.set(coin, dataFromDb);
      }
    }
    return map;
  } catch (error) {
    console.log("Couldnt get coinTradeData");
  }
};