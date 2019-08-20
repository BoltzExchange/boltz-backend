ARG ALPINE_VERSION

ARG BERKELEY_VERSION

FROM boltz/berkeley-db:${BERKELEY_VERSION} AS berkeley-db

# Build Bitcoin Core
FROM alpine:${ALPINE_VERSION} as bitcoin-core

ARG VERSION

COPY --from=berkeley-db /opt /opt

RUN apk update && apk upgrade
RUN apk --no-cache add \
  file \
  gnupg \
  libtool \
  chrpath \
  automake \
  libressl \
  autoconf \
  boost-dev \
  build-base \
  zeromq-dev \
  libevent-dev \
  libressl-dev \
  protobuf-dev \
  linux-headers

RUN gpg --batch --keyserver keyserver.ubuntu.com --recv-keys "90C8019E36C2E964"

ENV BITCOIN_PREFIX=/opt/bitcoin-${VERSION}

RUN wget https://bitcoin.org/bin/bitcoin-core-${VERSION}/SHA256SUMS.asc
RUN wget https://bitcoin.org/bin/bitcoin-core-${VERSION}/bitcoin-${VERSION}.tar.gz

RUN gpg --verify SHA256SUMS.asc
RUN grep "bitcoin-${VERSION}.tar.gz\$" SHA256SUMS.asc | sha256sum -c -
RUN tar -xzf *.tar.gz

WORKDIR /bitcoin-${VERSION}

RUN sed -i '/AC_PREREQ/a\AR_FLAGS=cr' src/univalue/configure.ac
RUN sed -i '/AX_PROG_CC_FOR_BUILD/a\AR_FLAGS=cr' src/secp256k1/configure.ac
RUN sed -i s:sys/fcntl.h:fcntl.h: src/compat.h

RUN ./autogen.sh
RUN ./configure LDFLAGS=-L`ls -d /opt/db*`/lib/ CPPFLAGS=-I`ls -d /opt/db*`/include/ \
    --prefix=${BITCOIN_PREFIX} \
    --mandir=/usr/share/man \
    --disable-ccache \
    --disable-tests \
    --disable-bench \
    --without-gui \
    --with-daemon \
    --with-utils \
    --with-libs

RUN make -j$(nproc)
RUN make install

RUN strip ${BITCOIN_PREFIX}/bin/bitcoind
RUN strip ${BITCOIN_PREFIX}/bin/bitcoin-tx
RUN strip ${BITCOIN_PREFIX}/bin/bitcoin-cli
RUN strip ${BITCOIN_PREFIX}/bin/bitcoin-wallet

# Assemble the final image
FROM alpine:${ALPINE_VERSION}

ARG VERSION

RUN apk update && apk upgrade
RUN apk --no-cache add \
  boost \
  libzmq \
  libevent \
  libressl \
  boost-program_options

COPY --from=bitcoin-core /opt/bitcoin-${VERSION}/bin /bin

EXPOSE 18332 18333 18444 18443

ENTRYPOINT ["bitcoind"]
