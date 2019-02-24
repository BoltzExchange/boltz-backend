# Build BerkeleyDB
FROM alpine:3.9 as berkeleydb

RUN apk update
RUN apk upgrade
RUN apk --no-cache add \
  autoconf \
  automake \
  libressl \
  build-base

ENV BERKELEYDB_VERSION=db-4.8.30.NC
ENV BERKELEYDB_PREFIX=/opt/${BERKELEYDB_VERSION}

RUN wget https://download.oracle.com/berkeley-db/${BERKELEYDB_VERSION}.tar.gz
RUN tar -xzf *.tar.gz
RUN sed s/__atomic_compare_exchange/__atomic_compare_exchange_db/g -i ${BERKELEYDB_VERSION}/dbinc/atomic.h
RUN mkdir -p ${BERKELEYDB_PREFIX}

WORKDIR /${BERKELEYDB_VERSION}/build_unix

RUN ../dist/configure --enable-cxx --disable-shared --with-pic --prefix=${BERKELEYDB_PREFIX}
RUN make -j4
RUN make install
RUN rm -rf ${BERKELEYDB_PREFIX}/docs

# Build Bitcoin Core
FROM alpine:3.9 as bitcoin-core

COPY --from=berkeleydb /opt /opt

RUN apk update
RUN apk upgrade
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

ENV BITCOIN_VERSION=0.17.1
ENV BITCOIN_PREFIX=/opt/bitcoin-${BITCOIN_VERSION}

RUN wget https://bitcoin.org/bin/bitcoin-core-${BITCOIN_VERSION}/SHA256SUMS.asc
RUN wget https://bitcoin.org/bin/bitcoin-core-${BITCOIN_VERSION}/bitcoin-${BITCOIN_VERSION}.tar.gz

RUN gpg --verify SHA256SUMS.asc
RUN grep " bitcoin-${BITCOIN_VERSION}.tar.gz\$" SHA256SUMS.asc | sha256sum -c -
RUN tar -xzf *.tar.gz

WORKDIR /bitcoin-${BITCOIN_VERSION}

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

RUN make -j4
RUN make install
RUN strip ${BITCOIN_PREFIX}/bin/bitcoin-cli
RUN strip ${BITCOIN_PREFIX}/bin/bitcoin-tx
RUN strip ${BITCOIN_PREFIX}/bin/bitcoind

# Assemble the final image
FROM alpine:3.9

RUN apk update
RUN apk upgrade
RUN apk --no-cache add \
  boost \
  libzmq \
  libevent \
  libressl \
  boost-program_options

ENV BITCOIN_VERSION=0.17.1

COPY --from=bitcoin-core /opt/bitcoin-${BITCOIN_VERSION}/bin /bin

EXPOSE 18332 18333 18444 18443

ENTRYPOINT ["bitcoind"]
