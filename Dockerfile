FROM node:slim
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
RUN apt update
RUN apt upgrade -y
RUN apt install chromium -y
EXPOSE 3000
COPY . .
RUN npm install
RUN npm update
RUN npm i mysql2
RUN npm run build
COPY dbInit.sh /
RUN chmod +x /dbInit.sh
ENTRYPOINT ["/dbInit.sh"]


