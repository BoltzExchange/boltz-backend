ARG UBUNTU_VERSION

# Build BerkeleyDB
FROM ubuntu:${UBUNTU_VERSION} as berkeley-db

ARG VERSION

RUN apt-get update && apt-get -y upgrade
RUN apt-get -y install \
  wget \
  openssl \
  autoconf \
  automake \
  build-essential

ENV BERKELEYDB_VERSION=db-${VERSION}.NC
ENV BERKELEYDB_PREFIX=/opt/${BERKELEYDB_VERSION}

RUN wget https://download.oracle.com/berkeley-db/${BERKELEYDB_VERSION}.tar.gz
RUN tar -xzf *.tar.gz

RUN if [ "${VERSION}" = "4.8.30" ]; then \
  sed s/__atomic_compare_exchange/__atomic_compare_exchange_db/g -i ${BERKELEYDB_VERSION}/dbinc/atomic.h ; else \
  sed s/__atomic_compare_exchange/__atomic_compare_exchange_db/g -i ${BERKELEYDB_VERSION}/src/dbinc/atomic.h ; fi

RUN mkdir -p ${BERKELEYDB_PREFIX}

WORKDIR /${BERKELEYDB_VERSION}/build_unix

RUN ../dist/configure --enable-cxx --disable-shared --with-pic --prefix=${BERKELEYDB_PREFIX}
RUN make -j$(nproc)
RUN make install

# Assemble the final image
FROM ubuntu:${UBUNTU_VERSION}

COPY --from=berkeley-db /opt /opt
