ARG UBUNTU_VERSION
ARG BERKELEY_VERSION

FROM boltz/berkeley-db:${BERKELEY_VERSION} AS berkeley-db

# Build Litecoin Core
FROM ubuntu:${UBUNTU_VERSION} as litecoin-core

ARG VERSION

COPY --from=berkeley-db /opt /opt

RUN apt-get update && apt-get -y upgrade
RUN DEBIAN_FRONTEND=noninteractive apt-get -y install \
  wget \
  libtool \
  python3 \
  automake \
  pkg-config \
  libssl-dev \
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
RUN ./configure LDFLAGS=-L`ls -d /opt/db*`/lib/ CPPFLAGS=-I`ls -d /opt/db*`/include/ \
    --prefix=${LITECOIN_PREFIX} \
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
  libzmq3-dev \
  libevent-dev \
  libboost-chrono-dev \
  libboost-system-dev \
  libboost-thread-dev \
  libboost-filesystem-dev

COPY --from=litecoin-core /opt/litecoin-${VERSION}/bin /bin

EXPOSE 19332 19333 19444 19443

ENTRYPOINT ["litecoind"]
