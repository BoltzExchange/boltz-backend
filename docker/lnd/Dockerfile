FROM golang:1.11.1-alpine as builder

# Install git and make
RUN apk update && apk upgrade && apk add --no-cache git make

# Install LND
RUN git clone https://github.com/ExchangeUnion/lnd.git $GOPATH/src/github.com/lightningnetwork/lnd

WORKDIR $GOPATH/src/github.com/lightningnetwork/lnd
RUN git checkout resolver+simnet-ltcd && make dep && make install

# Start again with a new image to reduce the size
FROM alpine:3.8 as final

# Expose LND ports (server, gRPC)
EXPOSE 9735 10009

# Copy the binaries and entrypoint from the builder image.
COPY --from=builder /go/bin/lncli /bin/
COPY --from=builder /go/bin/lnd /bin/

# Copy the LND rpc certificates from the data directory 
COPY data/certs /certs

ENTRYPOINT ["lnd", "--noseedbackup", "--no-macaroons", "--debuglevel=debug", "--tlscertpath=/certs/lnd/tls.cert", "--tlskeypath=/certs/lnd/tls.key", "--rpclisten=0.0.0.0", "--listen=0.0.0.0:9735"]
