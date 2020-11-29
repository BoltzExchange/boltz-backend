ARG UBUNTU_VERSION

# Build Zcash
FROM ubuntu:${UBUNTU_VERSION} as zcash

ARG VERSION

RUN apt-get update && apt-get upgrade -y
RUN DEBIAN_FRONTEND=noninteractive apt-get -y install \
  m4 \
  git \
  curl \
  wget \
  unzip \
  python3 \
  libtool \
  autoconf \
  automake \
  libtinfo5 \
  libc6-dev \
  pkg-config \
  zlib1g-dev \
  ncurses-dev \
  python3-zmq \
  bsdmainutils \
  g++-multilib \
  build-essential

RUN wget https://github.com/zcash/zcash/archive/v${VERSION}.tar.gz
RUN tar -xzf *.tar.gz

WORKDIR /zcash-${VERSION}

RUN ./zcutil/fetch-params.sh
RUN ./zcutil/build.sh -j$(nproc)

RUN mkdir bin

RUN strip src/zcashd
RUN strip src/zcash-tx
RUN strip src/zcash-cli

RUN cp src/zcashd bin
RUN cp src/zcash-tx bin
RUN cp src/zcash-cli bin

# Assemble the final image
FROM ubuntu:${UBUNTU_VERSION}

ARG VERSION

RUN apt-get update && apt-get upgrade -y
RUN apt-get -y install libgomp1

COPY --from=zcash /zcash-${VERSION}/bin /bin
COPY --from=zcash /root/.zcash-params/ /root/.zcash-params/

EXPOSE 8232 18232

ENTRYPOINT ["zcashd"]
