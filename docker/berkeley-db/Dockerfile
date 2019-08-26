ARG ALPINE_VERSION

# Build BerkeleyDB
FROM alpine:${ALPINE_VERSION} as berkeley-db

ARG VERSION

RUN apk update && apk upgrade
RUN apk --no-cache add \
  autoconf \
  automake \
  libressl \
  build-base

ENV BERKELEYDB_VERSION=db-${VERSION}.NC
ENV BERKELEYDB_PREFIX=/opt/${BERKELEYDB_VERSION}

RUN wget https://download.oracle.com/berkeley-db/${BERKELEYDB_VERSION}.tar.gz
RUN tar -xzf *.tar.gz
RUN sed s/__atomic_compare_exchange/__atomic_compare_exchange_db/g -i ${BERKELEYDB_VERSION}/dbinc/atomic.h
RUN mkdir -p ${BERKELEYDB_PREFIX}

WORKDIR /${BERKELEYDB_VERSION}/build_unix

RUN ../dist/configure --enable-cxx --disable-shared --with-pic --prefix=${BERKELEYDB_PREFIX}
RUN make -j$(nproc)
RUN make install

# Assemble the final image
FROM alpine:${ALPINE_VERSION}

COPY --from=berkeley-db /opt /opt
