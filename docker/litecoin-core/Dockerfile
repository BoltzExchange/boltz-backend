ARG ALPINE_VERSION

ARG BERKELEY_VERSION

FROM boltz/berkeley-db:${BERKELEY_VERSION} AS berkeley-db

# Build Litecoin Core
FROM alpine:${ALPINE_VERSION} as litecoin-core

ARG VERSION

COPY --from=berkeley-db /opt /opt

RUN apk update && apk upgrade
RUN apk --no-cache add \
  file \
  libtool \
  chrpath \
  automake \
  libressl \
  autoconf \
  boost-dev \
  build-base \
  zeromq-dev \
  libevent-dev \
  libressl-dev \
  protobuf-dev \
  linux-headers

ENV LITECOIN_PREFIX=/opt/litecoin-${VERSION}

RUN wget https://github.com/litecoin-project/litecoin/archive/v${VERSION}.tar.gz

RUN tar -xzf *.tar.gz

WORKDIR /litecoin-${VERSION}

RUN sed -i '/AC_PREREQ/a\AR_FLAGS=cr' src/univalue/configure.ac
RUN sed -i '/AX_PROG_CC_FOR_BUILD/a\AR_FLAGS=cr' src/secp256k1/configure.ac
RUN sed -i '/char\ scratchpad\[SCRYPT_SCRATCHPAD_SIZE\];/a\memset(scratchpad, 0, sizeof(scratchpad));' src/crypto/scrypt.cpp
RUN sed -i 's/char\ scratchpad\[SCRYPT_SCRATCHPAD_SIZE\];/static &/g' src/crypto/scrypt.cpp
RUN sed -i s:sys/fcntl.h:fcntl.h: src/compat.h

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

RUN strip ${LITECOIN_PREFIX}/bin/litecoind
RUN strip ${LITECOIN_PREFIX}/bin/litecoin-tx
RUN strip ${LITECOIN_PREFIX}/bin/litecoin-cli

# Assemble the final image
FROM alpine:${ALPINE_VERSION}

ARG VERSION

RUN apk update && apk upgrade
RUN apk --no-cache add \
  boost \
  libzmq \
  libevent \
  libressl \
  boost-program_options

COPY --from=litecoin-core /opt/litecoin-${VERSION}/bin /bin

EXPOSE 19332 19333 19444 19443

ENTRYPOINT ["litecoind"]
