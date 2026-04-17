FROM node:25-alpine

WORKDIR /usr/src/app

COPY . .

RUN npm install

CMD npm run start:dev