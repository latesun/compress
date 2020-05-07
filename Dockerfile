FROM node:14-alpine
MAINTAINER Latesun latesun.lee@bindo.com

RUN mkdir -p /app/upload
COPY src /app/src
RUN apk update && apk add ca-certificates

EXPOSE 3000

WORKDIR /app

CMD ["node", "src/app.js"]
