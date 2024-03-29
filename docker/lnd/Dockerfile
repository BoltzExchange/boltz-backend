ARG UBUNTU_VERSION
ARG GOLANG_VERSION

FROM golang:${GOLANG_VERSION} AS builder

ARG VERSION

RUN apt-get update && apt-get -y upgrade
RUN apt-get -y install git make gcc libc-dev

RUN git clone https://github.com/lightningnetwork/lnd.git $GOPATH/src/github.com/lightningnetwork/lnd

WORKDIR $GOPATH/src/github.com/lightningnetwork/lnd

RUN git checkout v${VERSION}

RUN go mod vendor

RUN go build -mod vendor -v -trimpath -tags="autopilotrpc signrpc walletrpc chainrpc invoicesrpc routerrpc watchtowerrpc" github.com/lightningnetwork/lnd/cmd/lnd
RUN go build -mod vendor -v -trimpath -tags="autopilotrpc invoicesrpc walletrpc routerrpc watchtowerrpc" github.com/lightningnetwork/lnd/cmd/lncli

# Start again with a new image to reduce the size
FROM ubuntu:${UBUNTU_VERSION}

# Expose LND ports (server, gRPC)
EXPOSE 9735 10009

# Copy the binaries and entrypoint from the builder image.
COPY --from=builder /go/src/github.com/lightningnetwork/lnd/lnd /bin/
COPY --from=builder /go/src/github.com/lightningnetwork/lnd/lncli /bin/

ENTRYPOINT ["lnd"]
