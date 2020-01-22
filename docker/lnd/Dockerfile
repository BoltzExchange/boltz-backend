ARG UBUNTU_VERSION
ARG GOLANG_VERSION

FROM golang:${GOLANG_VERSION} as builder

ARG VERSION

RUN apt-get update && apt-get -y upgrade
RUN apt-get -y install git make gcc libc-dev patch

RUN git clone https://github.com/lightningnetwork/lnd.git $GOPATH/src/github.com/lightningnetwork/lnd

WORKDIR $GOPATH/src/github.com/lightningnetwork/lnd

RUN git checkout v${VERSION}

# Apply patches for Litecoin LND
RUN go mod vendor

COPY lnd/patches /patches

RUN cd vendor/github.com/ltcsuite/ltcd && patch -p1 < /patches/ltcd.patch
RUN cd vendor/github.com/btcsuite/btcutil && patch -p1 < /patches/btcutil.patch

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
