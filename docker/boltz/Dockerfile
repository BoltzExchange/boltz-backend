ARG VERSION

FROM node:lts-buster-slim as builder

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

RUN git clone --depth=1 https://github.com/BoltzExchange/boltz-backend.git
WORKDIR /boltz-backend

RUN npm install -g npm

# Remove dependency that is not needed for the build and unavailable on ARM64
RUN sed -i "/grpc-tools/d" package.json

RUN npm install
RUN npm run compile

FROM node:lts-buster-slim as final

COPY --from=builder /boltz-backend/ /boltz-backend

EXPOSE 9000 9001

ENTRYPOINT ["/boltz-backend/bin/boltzd"]
