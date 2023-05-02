import { type coinCodexPrediction } from "@prisma/client";
import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { upsertDbAndReturn } from "~/server/api/routers/coinCodexRouter";
import { api } from "~/utils/api";

const Home: NextPage<Iprops> = (props) => {
  const coinShort = api.coinCodexRouter.getShortsAndUrls.useQuery();
  const getCoinPredictionData = api.coinCodexRouter.scrape.useMutation();
  const truncatePredictions = api.coinCodexRouter.truncate.useMutation();

  const eth = props.ethData;
  console.log("---", coinShort.data?.availableCoins);
  const [loading, setLoading] = useState<boolean>(true);
  const [coinData, setCoinData] = useState<Map<string, coinCodexPrediction>>(
    new Map<string, coinCodexPrediction>()
  );
  const [coin, setCoin] = useState<string>("");

  const reload = (coin: string): void => {
    getCoinPredictionData.mutate({ coin: coin });
    setCoin(coin);
  };
  const truncate = (): void => {
    truncatePredictions.mutate(true);
    setLoading(true);
    setCoin("");
    setCoinData(new Map<string, coinCodexPrediction>());
  };

  useEffect(() => {
    if (
      getCoinPredictionData.data?.coinData &&
      getCoinPredictionData.data.coinData.name == coin
    ) {
      setCoinData((prev) => {
        prev.set(
          coin,
          getCoinPredictionData.data?.coinData as coinCodexPrediction
        );
        return prev;
      });
    }

    setLoading(!loading);
  }, [coin, getCoinPredictionData.data]);

  useEffect(() => {
    if (coinShort.data?.availableCoins) {
      setCoinData(coinShort.data?.availableCoins);
    }
  }, [coinShort.data?.availableCoins]);

  return (
    <>
      <Head>
        <title>Crypto</title>
        <meta name="description" content="Crypto Scraper" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <div
          className={
            loading
              ? `bg-black text-[20px] text-white`
              : `text-[20px] text-white`
          }
        >
          <table>
            <tbody>
              <tr>
                <th>
                  <button
                    disabled={loading}
                    onClick={() => {
                      truncate();
                    }}
                  >
                    Truncate
                  </button>
                </th>
                <th></th>
                {eth.days
                  ? eth.days
                      .split(";")
                      .map((day: string) => <th key={day}>{day}</th>)
                  : "-"}
              </tr>

              {coinShort.data?.coinShort.map((coin) => (
                <tr key={coin}>
                  <td>
                    {
                      <Link
                        href={coinShort.data.url.get(coin) as string}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {coin}
                      </Link>
                    }
                  </td>
                  <td>
                    <button
                      disabled={loading}
                      onClick={() => {
                        reload(coin);
                      }}
                    >
                      Reload
                    </button>
                  </td>
                  {coinData.get(coin) ? (
                    <CoinData
                      data={coinData.get(coin) as coinCodexPrediction}
                    />
                  ) : (
                    <td>{"-"}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
};

export default Home;

const CoinData = ({ data }: CoinDataProps): JSX.Element => {
  const percentages = data.percentages?.split(";") || ["0"];
  return (
    <>
      {data.values?.split(";").map((value: string, index) => (
        <td key={index}>
          {value}
          <span
            className={
              Number(percentages[index]?.replace("%", "")) >= 0
                ? `text-green-600`
                : `text-red-600`
            }
          >
            ({data.percentages?.split(";")[index]})
          </span>
        </td>
      ))}
    </>
  );
};

interface CoinDataProps {
  data: coinCodexPrediction;
}
interface Iprops {
  ethData: coinCodexPrediction;
}

export async function getServerSideProps() {
  return { props: { ethData: (await upsertDbAndReturn("ETH"))?.coinData } };
}
