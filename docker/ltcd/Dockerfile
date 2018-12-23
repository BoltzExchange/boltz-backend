FROM golang:1.11.4-alpine as builder

# Install git and make
RUN apk update && apk upgrade && apk add --no-cache git

# Install the latest version of ltcd and it's dependencies
RUN go get github.com/ltcsuite/ltcd/...

# Start again with a new image to reduce the size
FROM alpine:3.8 as final

# Expose testnet ports (server, rpc)
EXPOSE 19335 19334

# Expose simnet ports (server, rpc)
EXPOSE 18555 18556

# Expose regtest ports (server, rpc)
EXPOSE 18444 19334

# Copy the binaries from the builder image
COPY --from=builder /go/bin/ltcd /bin/
COPY --from=builder /go/bin/ltcctl /bin/

# Copy the rpc certificates from the data directory into the image 
COPY data/certs /certs

# Copy the ltcctl file from the data directory into the image
COPY data/configs/ctl.conf /root/.ltcctl/ltcctl.conf

ENTRYPOINT ["ltcd", "--txindex", "--rpcuser=user", "--rpcpass=user", "--rpccert=/certs/rpc.cert", "--rpckey=/certs/rpc.key", "--rpclisten=0.0.0.0"]
