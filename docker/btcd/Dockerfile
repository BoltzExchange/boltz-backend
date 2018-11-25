FROM golang:1.11.1-alpine as builder

# Install git and make
RUN apk update && apk upgrade && apk add --no-cache git

# Install the latest version of btcd and it's dependencies
RUN go get github.com/btcsuite/btcd/...

# Start again with a new image to reduce the size
FROM alpine:3.8 as final

# Expose testnet ports (server, rpc)
EXPOSE 18333 18334

# Expose simnet ports (server, rpc)
EXPOSE 18555 18556

# Expose regtest ports (server, rpc)
EXPOSE 18444 18334

# Copy the binaries from the builder image
COPY --from=builder /go/bin/btcd /bin/
COPY --from=builder /go/bin/btcctl /bin/

# Copy the rpc certificates from the data directory into the image 
COPY data/certs /certs

# Copy the btcctl file from the data directory into the image
COPY data/configs/ctl.conf /root/.btcctl/btcctl.conf

ENTRYPOINT ["btcd", "--txindex", "--rpcuser=user", "--rpcpass=user", "--rpccert=/certs/rpc.cert", "--rpckey=/certs/rpc.key", "--rpclisten=0.0.0.0"]
