ARG UBUNTU_VERSION

# Build Elements
FROM ubuntu:${UBUNTU_VERSION:-latest} AS elements

ARG VERSION

RUN apt-get update && apt-get -y upgrade
RUN DEBIAN_FRONTEND=noninteractive apt-get -y install \
  git \
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
  libsqlite3-dev \
  build-essential \
  libboost-test-dev \
  libboost-chrono-dev \
  libboost-system-dev \
  libboost-thread-dev \
  libboost-filesystem-dev

ENV ELEMENTS_PREFIX=/opt/elements-${VERSION}

WORKDIR /elements-${VERSION}

RUN git clone --branch elements-${VERSION} --depth 1 https://github.com/ElementsProject/elements.git .

RUN ./autogen.sh
RUN ./configure \
    --prefix=${ELEMENTS_PREFIX} \
    --enable-endomorphism \
    --mandir=/usr/share/man \
    --disable-ccache \
    --disable-tests \
    --disable-bench \
    --disable-fuzz \
    --disable-fuzz-binary \
    --without-gui \
    --with-daemon \
    --with-utils \
    --with-libs \
    --with-incompatible-bdb

RUN make -j$(nproc)
RUN make install

RUN strip --strip-all ${ELEMENTS_PREFIX}/bin/elementsd
RUN strip --strip-all ${ELEMENTS_PREFIX}/bin/elements-tx
RUN strip --strip-all ${ELEMENTS_PREFIX}/bin/elements-cli
RUN strip --strip-all ${ELEMENTS_PREFIX}/bin/elements-wallet

# Assemble the final image
FROM ubuntu:${UBUNTU_VERSION:-latest}

ARG VERSION

RUN apt-get update && \
  apt-get -y upgrade && \
  apt-get -y install \
  libdb-dev \
  libdb++-dev \
  libzmq3-dev \
  libevent-dev \
  libsqlite3-dev \
  libboost-chrono-dev \
  libboost-system-dev \
  libboost-thread-dev \
  libboost-filesystem-dev && \
  rm -rf /var/lib/apt/lists/*

COPY --from=elements /opt/elements-${VERSION}/bin /bin

ENTRYPOINT ["elementsd"]
