ARG UBUNTU_VERSION

# Build Litecoin Core
FROM ubuntu:${UBUNTU_VERSION} as litecoin-core

ARG VERSION

RUN apt-get update && apt-get -y upgrade
RUN DEBIAN_FRONTEND=noninteractive apt-get -y install \
  wget \
  libtool \
  python3 \
  automake \
  libdb-dev \
  pkg-config \
  libssl-dev \
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

ENV LITECOIN_PREFIX=/opt/litecoin-${VERSION}

RUN wget https://github.com/litecoin-project/litecoin/archive/v${VERSION}.tar.gz

RUN tar -xzf *.tar.gz

WORKDIR /litecoin-${VERSION}

RUN ./autogen.sh
RUN ./configure \
    --prefix=${LITECOIN_PREFIX} \
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

RUN strip --strip-all ${LITECOIN_PREFIX}/bin/litecoind
RUN strip --strip-all ${LITECOIN_PREFIX}/bin/litecoin-tx
RUN strip --strip-all ${LITECOIN_PREFIX}/bin/litecoin-cli
RUN strip --strip-all ${LITECOIN_PREFIX}/bin/litecoin-wallet

# Assemble the final image
FROM ubuntu:${UBUNTU_VERSION}

ARG VERSION

RUN apt-get update && apt-get -y upgrade
RUN apt-get -y install \
  openssl \
  libdb-dev \
  libdb++-dev \
  libzmq3-dev \
  libevent-dev \
  libboost-chrono-dev \
  libboost-system-dev \
  libboost-thread-dev \
  libboost-filesystem-dev

COPY --from=litecoin-core /opt/litecoin-${VERSION}/bin /bin

EXPOSE 19332 19333 19444 19443

ENTRYPOINT ["litecoind"]
