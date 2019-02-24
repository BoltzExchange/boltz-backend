# Build Litecoin Core
FROM alpine:3.9 as litecoin-core

COPY --from=boltz/berkeley-db /opt /opt

RUN apk update
RUN apk upgrade
RUN apk --no-cache add \
  file \
  gnupg \
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

RUN gpg --batch --keyserver keyserver.ubuntu.com --recv-keys "0xFE3348877809386C"

ENV LITECOIN_VERSION=0.17.1rc1
ENV LITECOIN_PREFIX=/opt/litecoin-${LITECOIN_VERSION}

RUN wget https://github.com/litecoin-project/litecoin/archive/v${LITECOIN_VERSION}.tar.gz

RUN tar -xzf *.tar.gz

WORKDIR /litecoin-${LITECOIN_VERSION}

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

RUN make -j4
RUN make install
RUN strip ${LITECOIN_PREFIX}/bin/litecoin-cli
RUN strip ${LITECOIN_PREFIX}/bin/litecoin-tx
RUN strip ${LITECOIN_PREFIX}/bin/litecoind
RUN strip ${LITECOIN_PREFIX}/lib/libbitcoinconsensus.a
RUN strip ${LITECOIN_PREFIX}/lib/libbitcoinconsensus.so.0.0.0

# Assemble the final image
FROM alpine:3.9

RUN apk update
RUN apk upgrade
RUN apk --no-cache add \
  boost \
  libzmq \
  libevent \
  libressl \
  boost-program_options

ENV LITECOIN_VERSION=0.17.1rc1

COPY --from=litecoin-core /opt/litecoin-${LITECOIN_VERSION}/bin /bin

EXPOSE 19332 19333 19444 19443

ENTRYPOINT ["litecoind", "--help"]
