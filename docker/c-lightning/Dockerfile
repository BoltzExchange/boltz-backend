ARG UBUNTU_VERSION

FROM ubuntu:${UBUNTU_VERSION} AS builder

ARG VERSION

RUN apt-get update && apt-get -y upgrade
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y \
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
  python-is-python3

RUN pip3 install --upgrade pip
RUN pip3 install --user poetry
RUN pip3 install mako mistune==0.8.4 mrkd

RUN git clone https://github.com/ElementsProject/lightning.git
WORKDIR /lightning

RUN git checkout v${VERSION}
RUN git submodule init && git submodule update

RUN ./configure
RUN make
RUN make install

RUN strip --strip-all /usr/local/bin/lightningd
RUN strip --strip-all /usr/local/bin/lightning-cli

# Start again with a new image to reduce the size
FROM ubuntu:${UBUNTU_VERSION}

RUN apt-get update && apt-get -y upgrade
RUN apt-get -y install sqlite3 libsodium23

# Copy the binaries and entrypoint from the builder image.
COPY --from=builder /usr/local/bin/lightningd /bin/
COPY --from=builder /usr/local/bin/lightning-cli /bin/
COPY --from=builder /usr/local/libexec /usr/libexec

ENTRYPOINT ["lightningd"]
