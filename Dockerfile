FROM node:slim

ENV DATABASE_URL="mysql://root:password@database:3306/cryptoScraper"
ENV browserPath="/usr/bin/chromium"
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
RUN apt update
RUN apt install chromium -y
RUN apt upgrade -y
EXPOSE 3000
COPY . .
RUN npm install
RUN npm update
RUN npm i mysql2
RUN npm run build
COPY dbInit.sh /
RUN chmod +x /dbInit.sh
ENTRYPOINT ["/dbInit.sh"]


