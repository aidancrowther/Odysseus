FROM node:8.12.0-alpine

WORKDIR /app

COPY ./ ./

RUN npm install

EXPOSE 80/tcp

CMD [ "npm", "start" ]