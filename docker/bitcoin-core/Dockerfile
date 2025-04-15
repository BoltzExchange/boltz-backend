ARG UBUNTU_VERSION

# Build Bitcoin Core
FROM ubuntu:${UBUNTU_VERSION} AS bitcoin-core

ARG VERSION

RUN apt-get update && apt-get -y upgrade
RUN DEBIAN_FRONTEND=noninteractive apt-get -y install \
  wget \
  cmake \
  libtool \
  python3 \
  libdb-dev \
  pkg-config \
  libdb++-dev \
  libzmq3-dev \
  bsdmainutils \
  libevent-dev \
  autotools-dev \
  libsqlite3-dev \
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

RUN cmake -B build \
  -DCMAKE_INSTALL_PREFIX=${BITCOIN_PREFIX} \
  -DWITH_CCACHE=OFF \
  -DBUILD_TESTS=OFF \
  -DBUILD_BENCH=OFF \
  -DBUILD_FOR_FUZZING=OFF \
  -DBUILD_FUZZ_BINARY=OFF \
  -DBUILD_GUI=OFF \
  -DBUILD_DAEMON=ON \
  -DWITH_ZMQ=ON \
  -DWITH_BDB=ON \
  -DWARN_INCOMPATIBLE_BDB=ON

RUN cmake --build build -j$(nproc)
RUN cmake --install build

RUN strip --strip-all ${BITCOIN_PREFIX}/bin/bitcoind
RUN strip --strip-all ${BITCOIN_PREFIX}/bin/bitcoin-cli

# Assemble the final image
FROM ubuntu:${UBUNTU_VERSION}

ARG VERSION

RUN apt-get update && \
  apt-get -y upgrade && \
  apt-get -y install \
  libzmq3-dev \
  libdb-dev \
  libdb++-dev \
  libevent-dev \
  libsqlite3-dev \
  libboost-chrono-dev \
  libboost-system-dev \
  libboost-thread-dev \
  libboost-filesystem-dev && \
  rm -rf /var/lib/apt/lists/*

COPY --from=bitcoin-core /opt/bitcoin-${VERSION}/bin /bin

EXPOSE 18332 18333 18444 18443

ENTRYPOINT ["bitcoind"]
