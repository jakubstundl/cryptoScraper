/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { type coinPrediction } from "@prisma/client";
import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { coinPredictions } from "~/server/coinsList";
import { prisma } from "~/server/db";
import { scrape } from "~/server/scraper";
import { api } from "~/utils/api";



const Home: NextPage = (props:any) => {
  const coinShort = api.defaultRouter.getShortsAndUrls.useQuery();
  const getCoinData = api.defaultRouter.scrape.useMutation();
  const eth = props.coinData
  const [loading, setLoading] = useState<boolean>(false)
  const [coinData, setCoinData] = useState<Map<string, coinPrediction>>(
    new Map<string, coinPrediction>()
  );
  const [coin, setCoin] = useState<string>("");

  const reload = (coin: string): void => {    
    getCoinData.mutate({ coin: coin });
    setCoin(coin);
  }

  useEffect(()=>{
    if (
      getCoinData.data?.coinData &&
      getCoinData.data.coinData.name == coin
    ){
       
setCoinData((prev)=>{
prev.set(coin, getCoinData.data?.coinData as coinPrediction)
  return prev
})
    }
    setLoading(!loading)
  }, [coin, getCoinData.data])



  return (
    <>
      <Head>
        <title>Crypto</title>
        <meta name="description" content="Crypto Scraper" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <div className="text-[20px] text-white">
          <table>
            <tbody>
            <tr>
              <th></th>
              <th></th>
              <th>{eth ? eth.d1 : "-"}</th>
              <th>{eth ? eth.d2 : "-"}</th>
              <th>{eth ? eth.d3 : "-"}</th>
              <th>{eth ? eth.d4 : "-"}</th>
              <th>{eth ? eth.d5 : "-"}</th>
              <th>{eth ? eth.d6 : "-"}</th>
              <th>{eth ? eth.d7 : "-"}</th>
            </tr>
            
            {coinShort.data?.coinShort.map((coin) => (
              <tr key={coin}>
                <td>{<Link href={coinShort.data.url.get(coin) as string} rel="noopener noreferrer" target="_blank">{coin}</Link>}</td>
                <td>
                  <button disabled={!loading}
                    onClick={() => {
                      reload(coin);
                    }}
                  >
                    Reload
                  </button>{" "}
                </td>
                <td>{coinData.get(coin)?.v1 || "-"} - <span>{coinData.get(coin)?.p1 || "-"}</span></td>
                <td>{coinData.get(coin)?.v2 || "-"}</td>
                <td>{coinData.get(coin)?.v3 || "-"}</td>
                <td>{coinData.get(coin)?.v4 || "-"}</td>
                <td>{coinData.get(coin)?.v5 || "-"}</td>
                <td>{coinData.get(coin)?.v6 || "-"}</td>
                <td>{coinData.get(coin)?.v7 || "-"}</td>
              </tr>
            ))}
          </tbody></table>
        </div>
      </main>
    </>
  );
};

export default Home;

const CoinData = ({ data }: CoinDataProps): JSX.Element => {
  return <td>
    {data.v1 || "-"} - <span>{data.p1 || "-"}</span>
  </td>
  ;
};

interface CoinDataProps {
  data: coinPrediction;
}


export async function getServerSideProps() {

 
  if (coinPredictions.has("ETH")) {
    const dataFRomDb = await prisma.coinPrediction.findUnique({
      where: { name: "ETH" },
    });
    if (
      dataFRomDb &&
      dataFRomDb.time &&
      Math.abs(dataFRomDb.time - Date.now()) / 1000 / 60 < 60 //60min
    ) {
      
      return { props:{coinData: dataFRomDb} };
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
      
      
      return { props:{coinData: dataFRomDb} };
    }
  }
 
}
