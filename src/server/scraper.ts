/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prefer-const */

import * as puppeteer from "puppeteer";


const nameSelector ="body > app-root > app-root > div > div > div > div > div > app-buy-coin > div.coin-info-box > div.coin-info-box-header.d-flex.align-items-center > div.coin-name > div.ticker > span";
const dateSelector  = (day:number) => `body > app-root > app-root > div > div > div > div > app-coin-price-prediction > section:nth-child(9) > app-forecast > div > table > tbody > tr:nth-child(${day}) > td:nth-child(1)`
const valueSelector = (day:number) => `body > app-root > app-root > div > div > div > div > app-coin-price-prediction > section:nth-child(9) > app-forecast > div > table > tbody > tr:nth-child(${day}) > td:nth-child(2)`
const percentageSelector = (day:number) => `body > app-root > app-root > div > div > div > div > app-coin-price-prediction > section:nth-child(9) > app-forecast > div > table > tbody > tr:nth-child(${day}) > td:nth-child(3)`


export const scrape = async (url: string): Promise<Map<string, string>> => {
  return new Promise<Map<string, string>>(async (resolve, reject) => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page: puppeteer.Page = await browser.newPage();
    await page.goto(url);
    let map = new Map<string, string>();
    try {
        const name = await  getDataFromElement(nameSelector,page)
        if(name){
            map.set("name", name);
        }
        for(let i= 1; i < 8; i++){
            const day   = await  getDataFromElement(dateSelector(i),page)
            const value = await  getDataFromElement(valueSelector(i),page)
            const percentage = await  getDataFromElement(percentageSelector(i),page)
            if(day && value){
                map.set(`d${i}`, day);
                map.set(`v${i}`, value);
                map.set(`p${i}`, value);             
            }
        }
      await browser.close();
      if (map.size > 7) {
        resolve(map);
      } else {
        reject();
      }
    } catch (error) {
      reject();
    }
  });
};

const getDataFromElement = async(selector:string,page:puppeteer.Page) =>{
    const element:puppeteer.ElementHandle<Element> | null =
        await page.waitForSelector(selector);
      let value: string | undefined | null = await page.evaluate(
        (el:Element | null) => el?.textContent,
        element
      );
      return value
}
