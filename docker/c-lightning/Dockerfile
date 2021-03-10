ARG UBUNTU_VERSION

FROM ubuntu:${UBUNTU_VERSION} AS builder

ARG VERSION

RUN apt-get update && apt-get -y upgrade
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y \
  git \
  swig \
  gettext \
  libtool \
  python3 \
  autoconf \
  automake \
  net-tools \
  libgmp-dev \
  zlib1g-dev \
  python3-mako \
  libsodium-dev \
  libsqlite3-dev \
  build-essential \
  python-is-python3

RUN git clone https://github.com/ElementsProject/lightning.git
WORKDIR /lightning

RUN git checkout v${VERSION}

RUN ./configure
RUN make install

RUN strip --strip-all /usr/local/bin/*

# Start again with a new image to reduce the size
FROM ubuntu:${UBUNTU_VERSION}

RUN apt-get update && apt-get -y upgrade
RUN apt-get -y install sqlite3 libsodium23

# Copy the binaries and entrypoint from the builder image.
COPY --from=builder /usr/local/bin/lightning-cli /bin/
COPY --from=builder /usr/local/bin/lightningd /bin/
COPY --from=builder /usr/local/libexec /usr/libexec

ENTRYPOINT ["lightningd"]
