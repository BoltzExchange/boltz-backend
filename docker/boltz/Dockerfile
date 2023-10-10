ARG VERSION
ARG NODE_VERSION

FROM node:${NODE_VERSION} AS builder

RUN apt-get update && apt-get -y upgrade
RUN apt-get -y install \
    gcc \
    git \
    g++ \
    make \
    rsync \
    python3 \
    libc-dev \
    libzmq3-dev \
    python3-dev

RUN git clone https://github.com/BoltzExchange/boltz-backend.git
WORKDIR /boltz-backend

RUN git checkout ${VERSION}
RUN npm install -g npm

RUN npm ci
RUN npm run compile

FROM node:${NODE_VERSION} AS final

COPY --from=builder /boltz-backend/bin /boltz-backend/bin
COPY --from=builder /boltz-backend/dist /boltz-backend/dist
COPY --from=builder /boltz-backend/node_modules /boltz-backend/node_modules

EXPOSE 9000 9001

ENTRYPOINT ["/boltz-backend/bin/boltzd"]
