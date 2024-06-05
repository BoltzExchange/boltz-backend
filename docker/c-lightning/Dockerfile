ARG UBUNTU_VERSION

ARG BITCOIN_VERSION

FROM boltz/bitcoin-core:${BITCOIN_VERSION} AS bitcoin-core

FROM ubuntu:${UBUNTU_VERSION} AS builder

ARG VERSION

RUN apt-get update && apt-get -y upgrade
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y \
  jq \
  git \
  cargo \
  gettext \
  libtool \
  python3 \
  rustfmt \
  autoconf \
  automake \
  net-tools \
  libgmp-dev \
  zlib1g-dev \
  python3-pip \
  libsodium-dev \
  libsqlite3-dev \
  build-essential \
  protobuf-compiler \
  python-is-python3

RUN pip3 install --upgrade --break-system-packages pip
RUN pip3 install --break-system-packages mako

RUN git clone https://github.com/ElementsProject/lightning.git
WORKDIR /lightning

RUN git checkout v${VERSION}
RUN git submodule init && git submodule update

RUN ./configure
RUN make install -j$(nproc)

RUN strip --strip-all /usr/local/bin/lightningd
RUN strip --strip-all /usr/local/bin/lightning-cli

# Start again with a new image to reduce the size
FROM ubuntu:${UBUNTU_VERSION}

RUN apt-get update && \
  apt-get -y upgrade && \
  apt-get -y install \
  python3 \
  sqlite3 \
  libsodium23 \
  libevent-dev \
  python-is-python3 && \
  rm -rf /var/lib/apt/lists/*

# Copy binaries
COPY --from=builder /usr/local/bin/lightningd /bin/
COPY --from=builder /usr/local/bin/lightning-cli /bin/
COPY --from=builder /usr/local/libexec /usr/libexec

COPY --from=bitcoin-core /bin/bitcoin-cli /bin/

ENTRYPOINT ["lightningd"]
