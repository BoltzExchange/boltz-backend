ARG UBUNTU_VERSION

# Build Bitcoin Core
FROM ubuntu:${UBUNTU_VERSION} AS bitcoin-core

ARG VERSION

RUN apt-get update && apt-get -y upgrade
RUN DEBIAN_FRONTEND=noninteractive apt-get -y install \
  wget \
  libtool \
  python3 \
  automake \
  libdb-dev \
  pkg-config \
  libdb++-dev \
  libzmq3-dev \
  bsdmainutils \
  libevent-dev \
  autotools-dev \
  build-essential \
  libboost-test-dev \
  libboost-chrono-dev \
  libboost-system-dev \
  libboost-thread-dev \
  libboost-filesystem-dev

ENV BITCOIN_PREFIX=/opt/bitcoin-${VERSION}

RUN wget https://bitcoincore.org/bin/bitcoin-core-${VERSION}/SHA256SUMS
RUN wget https://bitcoincore.org/bin/bitcoin-core-${VERSION}/bitcoin-${VERSION}.tar.gz

RUN grep "bitcoin-${VERSION}.tar.gz\$" SHA256SUMS | sha256sum -c -
RUN tar -xzf *.tar.gz

WORKDIR /bitcoin-${VERSION}

RUN ./autogen.sh
RUN ./configure \
    --prefix=${BITCOIN_PREFIX} \
    --enable-endomorphism \
    --mandir=/usr/share/man \
    --disable-ccache \
    --disable-tests \
    --disable-bench \
    --without-gui \
    --with-daemon \
    --with-utils \
    --with-libs \
    --with-incompatible-bdb

RUN make -j$(nproc)
RUN make install

RUN strip --strip-all ${BITCOIN_PREFIX}/bin/bitcoind
RUN strip --strip-all ${BITCOIN_PREFIX}/bin/bitcoin-tx
RUN strip --strip-all ${BITCOIN_PREFIX}/bin/bitcoin-cli
RUN strip --strip-all ${BITCOIN_PREFIX}/bin/bitcoin-wallet

# Assemble the final image
FROM ubuntu:${UBUNTU_VERSION}

ARG VERSION

RUN apt-get update && apt-get -y upgrade
RUN apt-get -y install \
  libzmq3-dev \
  libdb-dev \
  libdb++-dev \
  libevent-dev \
  libboost-chrono-dev \
  libboost-system-dev \
  libboost-thread-dev \
  libboost-filesystem-dev

COPY --from=bitcoin-core /opt/bitcoin-${VERSION}/bin /bin

EXPOSE 18332 18333 18444 18443

ENTRYPOINT ["bitcoind"]
