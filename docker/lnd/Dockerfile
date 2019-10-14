ARG UBUNTU_VERSION
ARG GOLANG_VERSION

FROM golang:${GOLANG_VERSION} as builder

ARG VERSION

RUN apt-get update && apt-get -y upgrade
RUN apt-get -y install git make gcc libc-dev

RUN git clone https://github.com/lightningnetwork/lnd.git $GOPATH/src/github.com/lightningnetwork/lnd

WORKDIR $GOPATH/src/github.com/lightningnetwork/lnd

RUN git checkout v${VERSION}
RUN make install

# Start again with a new image to reduce the size
FROM ubuntu:${UBUNTU_VERSION}

# Expose LND ports (server, gRPC)
EXPOSE 9735 10009

# Copy the binaries and entrypoint from the builder image.
COPY --from=builder /go/bin/lnd /bin/
COPY --from=builder /go/bin/lncli /bin/

ENTRYPOINT ["lnd"]
