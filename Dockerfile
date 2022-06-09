FROM node:lts-stretch-slim as builder

RUN apt-get update && apt-get -y upgrade
RUN apt-get -y install git gcc g++ make libc-dev python python-dev

RUN git clone --depth=1 https://github.com/BoltzExchange/boltz-backend.git
WORKDIR boltz-backend

RUN npm ci
RUN npm run compile

FROM node:lts-stretch-slim as final

COPY --from=builder /boltz-backend /boltz-backend

EXPOSE 9000 9001

ENTRYPOINT ["/boltz-backend/bin/boltzd"]
