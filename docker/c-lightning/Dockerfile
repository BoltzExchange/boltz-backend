ARG UBUNTU_VERSION

ARG BITCOIN_VERSION

FROM boltz/bitcoin-core:${BITCOIN_VERSION} AS bitcoin-core

FROM ubuntu:${UBUNTU_VERSION} AS builder

ARG VERSION

RUN apt-get update && apt-get -y upgrade
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y \
  jq \
  git \
  gettext \
  libtool \
  python3 \
  autoconf \
  automake \
  libpq-dev \
  net-tools \
  libgmp-dev \
  zlib1g-dev \
  libsodium-dev \
  libsqlite3-dev \
  build-essential \
  protobuf-compiler \
  python-is-python3

RUN curl -sSf https://sh.rustup.rs -o rustup-install.sh && \
    bash rustup-install.sh --default-toolchain none --quiet -y && \
    rm rustup-install.sh && \
    /root/.cargo/bin/rustup install 1.85
ENV PATH="/root/.cargo/bin:$PATH"

RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin/:$PATH"

RUN git clone --depth 1 --branch v${VERSION} https://github.com/ElementsProject/lightning.git /lightning
WORKDIR /lightning

RUN git submodule init && git submodule update

RUN ./configure
RUN RUST_PROFILE=release uv run make install -j$(nproc)

# Start again with a new image to reduce the size
FROM ubuntu:${UBUNTU_VERSION}

RUN apt-get update && \
  apt-get -y upgrade && \
  apt-get -y install \
  sqlite3 \
  libpq-dev \
  libsodium23 \
  libevent-dev \
  ca-certificates && \
  rm -rf /var/lib/apt/lists/*

# Copy binaries
COPY --from=builder /usr/local/bin/lightningd /bin/
COPY --from=builder /usr/local/bin/lightning-cli /bin/
COPY --from=builder /usr/local/libexec /usr/libexec

COPY --from=bitcoin-core /bin/bitcoin-cli /bin/

ENTRYPOINT ["lightningd"]
