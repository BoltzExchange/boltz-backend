ARG UBUNTU_VERSION
ARG GOLANG_VERSION

FROM golang:${GOLANG_VERSION} AS builder

ARG VERSION

RUN apt-get update && apt-get -y upgrade
RUN apt-get -y install git make

RUN git clone https://github.com/ethereum/go-ethereum.git $GOPATH/src/github.com/ethereum/go-ethereum

WORKDIR $GOPATH/src/github.com/ethereum/go-ethereum

RUN git checkout v${VERSION}

RUN make geth

# Start again with a new image to reduce the size
FROM ubuntu:${UBUNTU_VERSION}

RUN apt-get update && apt-get -y upgrade
RUN apt-get -y install psmisc

# Expose the RPC and websocket port
EXPOSE 8545 8546

COPY --from=builder /go/src/github.com/ethereum/go-ethereum/build/bin/geth /bin/

COPY geth/setup.sh /setup.sh

# Start GETH in dev mode to save the genesis block and the first account
RUN bash setup.sh

ENTRYPOINT ["geth", "--datadir", "/gethData", "--dev", "--http", "--http.addr",  "0.0.0.0", "--http.corsdomain", "*", "--ws", "--ws.addr", "0.0.0.0", "--miner.gasprice", "10000000000"]
