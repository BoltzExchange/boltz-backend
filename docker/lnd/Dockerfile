FROM golang:1.12.4-alpine as builder

# Install git
RUN apk update && apk upgrade && apk add --no-cache git make gcc libc-dev

# Install LND
RUN git clone https://github.com/boltzexchange/lnd.git $GOPATH/src/github.com/boltzexchange/lnd

WORKDIR $GOPATH/src/github.com/boltzexchange/lnd
RUN git checkout litcoin-regtest
RUN make install

# Start again with a new image to reduce the size
FROM alpine:3.9 as final

# Expose LND ports (server, gRPC)
EXPOSE 9735 10009

# Copy the binaries and entrypoint from the builder image.
COPY --from=builder /go/bin/lnd /bin/
COPY --from=builder /go/bin/lncli /bin/

ENTRYPOINT ["lnd"]
