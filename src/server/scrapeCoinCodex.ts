/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prefer-const */

import * as puppeteer from "puppeteer";

const nameSelector =
  "body > app-root > app-root > div > div > div > div > div > app-buy-coin > div.coin-info-box > div.coin-info-box-header.d-flex.align-items-center > div.coin-name > div.ticker > span";
const dateSelector = (day: number) =>
  `body > app-root > app-root > div > div > div > div > app-coin-price-prediction > section:nth-child(9) > app-forecast > div > table > tbody > tr:nth-child(${day}) > td:nth-child(1)`;
const valueSelector = (day: number) =>
  `body > app-root > app-root > div > div > div > div > app-coin-price-prediction > section:nth-child(9) > app-forecast > div > table > tbody > tr:nth-child(${day}) > td:nth-child(2)`;
const percentageSelector = (day: number) =>
  `body > app-root > app-root > div > div > div > div > app-coin-price-prediction > section:nth-child(9) > app-forecast > div > table > tbody > tr:nth-child(${day}) > td:nth-child(3)`;
export const scrapeCoinCodexPRedictions = async (
  url: string
): Promise<Map<string, string>> => {
  return new Promise<Map<string, string>>(async (resolve, reject) => {
     try {
    const browser = await puppeteer.launch({ executablePath: process.env.browserPath,headless: "new",
    args: [
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--disable-setuid-sandbox",
        "--no-sandbox",
    ] });
    const page: puppeteer.Page = await browser.newPage();
    await page.goto(url);
    let map = new Map<string, string>();
   
      const name = await getDataFromElement(nameSelector, page);
      if (name) {
        map.set("name", name);
      }
      const days: string[] = [];
      const values: string[] = [];
      const percentages: string[] = [];

      for (let i = 1; i < 8; i++) {
        const day = await getDataFromElement(dateSelector(i), page);
        const value = await getDataFromElement(valueSelector(i), page);
        const percentage = await getDataFromElement(
          percentageSelector(i),
          page
        );
        if (day && value && percentage) {
          days.push(day);
          values.push(value);
          percentages.push(percentage);
        }
        map.set("days", days.join(";"));
        map.set("values", values.join(";"));
        map.set("percentages", percentages.join(";"));
      }
      //console.table(map);
      await browser.close();
      if (map.size > 0) {
        resolve(map);
      } else {
        reject();
      }
    } catch (error) {
      console.log("Couldnt scrape")
      reject();
    }
  });
};

const getDataFromElement = async (selector: string, page: puppeteer.Page) => {
  const element: puppeteer.ElementHandle<Element> | null =
    await page.waitForSelector(selector);
  let value: string | undefined | null = await page.evaluate(
    (el: Element | null) => el?.textContent,
    element
  );
  return value;
};
