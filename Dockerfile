FROM node:8.12.0-alpine
RUN apk update && apk upgrade && apk add --no-cache bash git python make g++
WORKDIR /usr/src/app
COPY package*.json index.js ./
RUN npm install
RUN apk del bash git python make g++
CMD [ "npm", "start" ]
