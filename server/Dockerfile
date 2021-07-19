FROM node:14.14.0-alpine

WORKDIR '/app'

COPY ./package.json ./

RUN npm install

COPY . .
#only change from dev is below command
CMD ["npm","run","start"]