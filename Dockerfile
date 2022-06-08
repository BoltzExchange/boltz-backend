FROM node:lts-stretch-slim

RUN apt-get update && apt-get -y upgrade
RUN apt-get -y install git gcc g++ make libc-dev python python-dev
# RUN ln -s /usr/bin/python2 /usr/bin/python

RUN git clone https://github.com/BoltzExchange/boltz-backend.git
WORKDIR boltz-backend

RUN npm ci
RUN npm run compile

EXPOSE 9000 9001

ENTRYPOINT ["/boltz-backend/bin/boltzd"]
