ARG NODE_VERSION

FROM node:${NODE_VERSION}

ARG VERSION

RUN apk update && apk upgrade
RUN apk add g++ make python

RUN npm install @nomiclabs/buidler@${VERSION}
RUN touch buidler.config.js

EXPOSE 8545

ENTRYPOINT /node_modules/.bin/buidler node --hostname 0.0.0.0
