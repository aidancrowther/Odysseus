FROM node:15.5.1-alpine3.10

WORKDIR /app

RUN npm install

CMD [ "npm", "start" ]