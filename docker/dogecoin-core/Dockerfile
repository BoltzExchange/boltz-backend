ARG UBUNTU_VERSION

# Build Dogecoin Core
FROM ubuntu:${UBUNTU_VERSION} as dogecoin-core

ARG VERSION

RUN apt-get update && apt-get -y upgrade
RUN DEBIAN_FRONTEND=noninteractive apt-get -y install \
  wget \
  libtool \
  python3 \
  automake \
  libdb5.3++ \
  pkg-config \
  libssl-dev \
  libzmq3-dev \
  bsdmainutils \
  libevent-dev \
  libdb5.3-dev \
  autotools-dev \
  libdb5.3++-dev \
  build-essential \
  libboost-test-dev \
  libboost-chrono-dev \
  libboost-system-dev \
  libboost-thread-dev \
  libboost-filesystem-dev \
  libboost-program-options-dev

ENV DOGECOIN_PREFIX=/opt/dogecoin-${VERSION}

RUN wget https://github.com/dogecoin/dogecoin/archive/v${VERSION}.tar.gz

RUN tar -xzf *.tar.gz

WORKDIR /dogecoin-${VERSION}

RUN ./autogen.sh
RUN ./configure \
    --prefix=${DOGECOIN_PREFIX} \
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

RUN strip --strip-all ${DOGECOIN_PREFIX}/bin/dogecoind
RUN strip --strip-all ${DOGECOIN_PREFIX}/bin/dogecoin-tx
RUN strip --strip-all ${DOGECOIN_PREFIX}/bin/dogecoin-cli

# Assemble the final image
FROM ubuntu:${UBUNTU_VERSION}

ARG VERSION

RUN apt-get update && apt-get -y upgrade
RUN apt-get -y install \
  openssl \
  libdb5.3++ \
  libzmq3-dev \
  libevent-dev \
  libboost-chrono-dev \
  libboost-system-dev \
  libboost-thread-dev \
  libboost-filesystem-dev \
  libboost-program-options-dev

COPY --from=dogecoin-core /opt/dogecoin-${VERSION}/bin /bin

EXPOSE 22555 44555 18332

ENTRYPOINT ["dogecoind"]
