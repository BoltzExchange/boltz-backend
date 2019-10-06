ARG UBUNTU_VERSION
ARG BERKELEY_VERSION

FROM boltz/berkeley-db:${BERKELEY_VERSION} AS berkeley-db

# Build Dogecoin Core
FROM ubuntu:${UBUNTU_VERSION} as dogecoin-core

ARG VERSION

COPY --from=berkeley-db /opt /opt

RUN apt-get update && apt-get -y upgrade
RUN apt-get -y install \
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
  libboost-filesystem-dev \
  libboost-program-options-dev

ENV DOGECOIN_PREFIX=/opt/dogecoin-${VERSION}

RUN wget https://github.com/dogecoin/dogecoin/archive/v${VERSION}.tar.gz

RUN tar -xzf *.tar.gz

WORKDIR /dogecoin-${VERSION}

RUN ./autogen.sh
RUN ./configure LDFLAGS=-L`ls -d /opt/db*`/lib/ CPPFLAGS=-I`ls -d /opt/db*`/include/ \
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

RUN strip ${DOGECOIN_PREFIX}/bin/dogecoind
RUN strip ${DOGECOIN_PREFIX}/bin/dogecoin-tx
RUN strip ${DOGECOIN_PREFIX}/bin/dogecoin-cli

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
  libboost-filesystem-dev \
  libboost-program-options-dev

COPY --from=dogecoin-core /opt/dogecoin-${VERSION}/bin /bin

EXPOSE 22555 44555 18332

ENTRYPOINT ["dogecoind"]
