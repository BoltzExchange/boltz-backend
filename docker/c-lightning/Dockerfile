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
  libpq-dev \
  net-tools \
  libgmp-dev \
  zlib1g-dev \
  python3-pip \
  libsodium-dev \
  libsqlite3-dev \
  build-essential \
  protobuf-compiler \
  python-is-python3

RUN pip3 install --upgrade pip
RUN pip3 install mako

RUN git clone https://github.com/ElementsProject/lightning.git
WORKDIR /lightning

RUN git checkout v${VERSION}
RUN git submodule init && git submodule update

RUN git remote add fork https://github.com/michael1011/lightning.git && git fetch fork
RUN git config user.name buildkit && \
    git config user.email root@buildkitsandbox && \
    git cherry-pick b302d3b4a0230cc7774bc3a9c80784d96e54af42

RUN ./configure
RUN make install

RUN strip --strip-all /usr/local/bin/lightningd
RUN strip --strip-all /usr/local/bin/lightning-cli

# Start again with a new image to reduce the size
FROM ubuntu:${UBUNTU_VERSION}

RUN apt-get update && \
  apt-get -y upgrade && \
  apt-get -y install \
  python3 \
  sqlite3 \
  libpq-dev \
  libsodium23 \
  python3-pip \
  libevent-dev \
  python-is-python3 && \
  rm -rf /var/lib/apt/lists/*

# Copy binaries
COPY --from=builder /usr/local/bin/lightningd /bin/
COPY --from=builder /usr/local/bin/lightning-cli /bin/
COPY --from=builder /usr/local/libexec /usr/libexec

COPY --from=bitcoin-core /bin/bitcoin-cli /bin/

RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y python3-json5 python3-flask python3-gunicorn && \
    apt-get clean all && rm -rf /var/lib/apt/lists/*
RUN pip3 install --user flask-cors flask-restx pyln-client flask-socketio gevent gevent-websocket

ENTRYPOINT ["lightningd"]
