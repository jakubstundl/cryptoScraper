FROM node:slim

ENV browserPath="/usr/bin/chromium"
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
RUN apt update
RUN apt install chromium -y
RUN apt full-upgrade -y
EXPOSE 3000
COPY . .
RUN npm update
RUN npm install
RUN npm i mysql2
RUN npm run build
COPY dbInit.sh /
RUN chmod +x /dbInit.sh
ENTRYPOINT ["/dbInit.sh"]


