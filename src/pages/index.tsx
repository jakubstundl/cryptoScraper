import { coinTradeData, type coinCodexPrediction } from "@prisma/client";
import { log } from "console";
import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { upsertDbAndReturn } from "~/server/api/routers/coinCodexRouter";
import { api } from "~/utils/api";

const Home: NextPage<Iprops> = (props) => {
  const initialData = api.coinCodexRouter.getInitialData.useQuery();
  const getCoinPredictionData = api.coinCodexRouter.scrape.useMutation();
  const truncatePredictions = api.coinCodexRouter.truncate.useMutation();

  const predictionDays = 3;

  const eth = props.ethData;
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
    if (initialData.data?.availableCoins) {
      setCoinData(initialData.data?.availableCoins);
    }
  }, [initialData.data?.availableCoins]);

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
                <th></th>
                <th>BoughtFor</th>
                <th>Count</th>
                <th>BoughtAt</th>
                <th>SellAt</th>
                {eth.days
                  ? eth.days
                      .split(";")
                      .slice(0, predictionDays)
                      .map((day: string) => <th key={day}>{day}</th>)
                  : "-"}
              </tr>

              {initialData.data?.coinShort
                .sort((a, b) => {
                  return (
                    (initialData.data.coinTradeData?.get(b)?.boughtFor || 0) -
                    (initialData.data.coinTradeData?.get(a)?.boughtFor || 0)
                  );
                })
                .map((coin) => (
                  <tr key={coin}>
                    <td>
                      {
                        <Link
                          href={initialData.data.url.get(coin) as string}
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
                        prices={coinData.get(coin) as coinCodexPrediction}
                        tradeData={initialData.data.coinTradeData?.get(coin)}
                        predictionDays={predictionDays}
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

const CoinData = ({
  prices,
  tradeData,
  predictionDays,
}: CoinDataProps): JSX.Element => {
  const updateTradeDataToBd = api.coinCodexRouter.updateTradeData.useMutation();
  const [tradeDisplaydata, setTradeDisplayData] = useState<{
    name: string;
    count: number;
    boughtFor: number;
    boughtAt: number;
    sellAt: number;
  }>({
    name: prices.name,
    count: tradeData?.count || 0,
    boughtFor: tradeData?.boughtFor || 0,
    boughtAt: tradeData?.boughtAt || 0,
    sellAt: tradeData?.sellAt || 0,
  });

  const [render, setRender] = useState<number>(0);
  const [editMode, setEditMode] = useState<boolean>(false);
  const editWindow = useRef<HTMLDivElement>(null);
  const countInput = useRef<HTMLInputElement>(null);
  const boughtForInput = useRef<HTMLInputElement>(null);
  const boughtAtInput = useRef<HTMLInputElement>(null);
  const sellAtInput = useRef<HTMLInputElement>(null);
  const btn = useRef<HTMLButtonElement>(null);

  const updateTradeData = () => {
    const data = {
      name: prices.name,
      count: Number(countInput.current?.value || 0),
      boughtFor: Number(boughtForInput.current?.value || 0),
      boughtAt: Number(boughtAtInput.current?.value || 0),
      sellAt: Number(sellAtInput.current?.value || 0),
    };
    updateTradeDataToBd.mutate(data);
    setEditMode(false);
  };

  const handleClickOutside = (ev: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const targetElement = ev.target as HTMLElement;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (
      editWindow.current &&
      !editWindow.current.contains(targetElement) &&
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ev.target != btn.current
    ) {
      setEditMode(false);
    }
  };

  const percentages = prices.percentages?.split(";") || ["0"];

  const editModeON = "absolute bg-white z-10";
  const editModeOff = "hidden";

  useEffect(() => {
    document.addEventListener("click", handleClickOutside, true);
    return () => {
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, []);

  useEffect(() => {
    if(updateTradeDataToBd.data){

      setTradeDisplayData({
        name: prices.name,
        count: updateTradeDataToBd.data?.count || 0,
        boughtFor: updateTradeDataToBd.data?.boughtFor || 0,
        boughtAt: updateTradeDataToBd.data?.boughtAt || 0,
        sellAt: updateTradeDataToBd.data?.sellAt || 0,
      });
    }
    console.log("here");
    
  }, [updateTradeDataToBd.data]);

  return (
    <>
      <td className="relative">
        <button
          ref={btn}
          onClick={() => {
            setEditMode(!editMode);
          }}
        >
          Edit
        </button>
        <div ref={editWindow} className={editMode ? editModeON : editModeOff}>
          <h1 className="text-black">{prices.name}</h1>
          <div className="flex flex-col">
            <label htmlFor="number">Bought for:</label>
            <input
              ref={boughtForInput}
              type="number"
              defaultValue={tradeDisplaydata.boughtFor || 0}
              onKeyDown={(ev: React.KeyboardEvent<HTMLElement>) => {
                if (ev.key == "Enter") {
                  updateTradeData();
                }
              }}
            />
            <label htmlFor="count">Count:</label>
            <input
              ref={countInput}
              type="number"
              defaultValue={tradeDisplaydata.count || 0}
              onKeyDown={(ev: React.KeyboardEvent<HTMLElement>) => {
                if (ev.key == "Enter") {
                  updateTradeData();
                }
              }}
            />
            <label htmlFor="number">Bought at:</label>
            <input
              ref={boughtAtInput}
              type="number"
              defaultValue={tradeDisplaydata.boughtAt || 0}
              onKeyDown={(ev: React.KeyboardEvent<HTMLElement>) => {
                if (ev.key == "Enter") {
                  updateTradeData();
                }
              }}
            />

            <label htmlFor="number">Sell at:</label>
            <input
              ref={sellAtInput}
              type="number"
              defaultValue={tradeDisplaydata.sellAt || 0}
              onKeyDown={(ev: React.KeyboardEvent<HTMLElement>) => {
                if (ev.key == "Enter") {
                  updateTradeData();
                }
              }}
            />
          </div>
        </div>
      </td>
      <td>{tradeDisplaydata.boughtFor || 0}</td>
      <td>{tradeDisplaydata.count || 0}</td>
      <td>{tradeDisplaydata.boughtAt || 0}</td>
      <td>{tradeDisplaydata.sellAt || 0}</td>

      {prices.values
        ?.split(";")
        .slice(0, predictionDays)
        .map((value: string, index) => (
          <td key={index}>
            {value}
            <span
              className={
                Number(percentages[index]?.replace("%", "")) >= 0
                  ? `text-green-600`
                  : `text-red-600`
              }
            >
              ({prices.percentages?.split(";")[index]})
            </span>
          </td>
        ))}
    </>
  );
};

interface CoinDataProps {
  prices: coinCodexPrediction;
  tradeData: coinTradeData | undefined;
  predictionDays: number;
}
interface Iprops {
  ethData: coinCodexPrediction;
}

export async function getServerSideProps() {
  return { props: { ethData: (await upsertDbAndReturn("ETH"))?.coinData } };
}
