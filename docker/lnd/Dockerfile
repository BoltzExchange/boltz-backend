FROM golang:1.12.7-alpine as builder

# Install git
RUN apk update && apk upgrade
RUN apk add --no-cache git make gcc libc-dev

# Install LND
RUN git clone https://github.com/lightningnetwork/lnd.git $GOPATH/src/github.com/lightningnetwork/lnd

WORKDIR $GOPATH/src/github.com/lightningnetwork/lnd
RUN git checkout v0.7.0-beta
RUN make install

# Start again with a new image to reduce the size
FROM alpine:3.10.1 as final

# Expose LND ports (server, gRPC)
EXPOSE 9735 10009

# Copy the binaries and entrypoint from the builder image.
COPY --from=builder /go/bin/lnd /bin/
COPY --from=builder /go/bin/lncli /bin/

ENTRYPOINT ["lnd"]
