ARG UBUNTU_VERSION
ARG BERKELEY_VERSION

FROM boltz/berkeley-db:${BERKELEY_VERSION} AS berkeley-db

# Build Bitcoin Core
FROM ubuntu:${UBUNTU_VERSION} AS bitcoin-core

ARG VERSION

COPY --from=berkeley-db /opt /opt

RUN apt-get update && apt-get -y upgrade
RUN DEBIAN_FRONTEND=noninteractive apt-get -y install \
  wget \
  libtool \
  python3 \
  automake \
  pkg-config \
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

RUN gpg --batch --keyserver keyserver.ubuntu.com --recv-keys "90C8019E36C2E964"

ENV BITCOIN_PREFIX=/opt/bitcoin-${VERSION}

RUN wget https://bitcoin.org/bin/bitcoin-core-${VERSION}/SHA256SUMS.asc
RUN wget https://bitcoin.org/bin/bitcoin-core-${VERSION}/bitcoin-${VERSION}.tar.gz

RUN gpg --verify SHA256SUMS.asc
RUN grep "bitcoin-${VERSION}.tar.gz\$" SHA256SUMS.asc | sha256sum -c -
RUN tar -xzf *.tar.gz

WORKDIR /bitcoin-${VERSION}

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
FROM ubuntu:${UBUNTU_VERSION}

ARG VERSION

RUN apt-get update && apt-get -y upgrade
RUN apt-get -y install \
  libzmq3-dev \
  libevent-dev \
  libboost-chrono-dev \
  libboost-system-dev \
  libboost-thread-dev \
  libboost-filesystem-dev

COPY --from=bitcoin-core /opt/bitcoin-${VERSION}/bin /bin

EXPOSE 18332 18333 18444 18443

ENTRYPOINT ["bitcoind"]
