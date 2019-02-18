FROM golang:1.11.5-alpine as builder

# Install git
RUN apk update && apk upgrade && apk add --no-cache git make

# Install LND
RUN git clone https://github.com/ExchangeUnion/lnd.git $GOPATH/src/github.com/lightningnetwork/lnd

WORKDIR $GOPATH/src/github.com/lightningnetwork/lnd
RUN git checkout resolver+simnet-ltcd && make dep && make install

# Start again with a new image to reduce the size
FROM alpine:3.9 as final

# Expose LND ports (server, gRPC)
EXPOSE 9735 10009

# Copy the binaries and entrypoint from the builder image.
COPY --from=builder /go/bin/lnd /bin/
COPY --from=builder /go/bin/lncli /bin/

ENTRYPOINT ["lnd"]
