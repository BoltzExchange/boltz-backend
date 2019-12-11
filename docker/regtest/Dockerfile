ARG UBUNTU_VERSION

ARG BITCOIN_VERSION
ARG LITECOIN_VERSION

ARG LND_VERSION

FROM boltz/bitcoin-core:${BITCOIN_VERSION} AS bitcoin-core
FROM boltz/litecoin-core:${LITECOIN_VERSION} AS litecoin-core

FROM boltz/lnd:${LND_VERSION} as lnd

FROM ubuntu:${UBUNTU_VERSION}

# Install dependencies
RUN apt-get update && apt-get -y upgrade
RUN apt-get -y install \
  jq \
  psmisc \
  openssl \
  libzmq3-dev \
  libevent-dev \
  libevent-dev \
  libboost-chrono-dev \
  libboost-system-dev \
  libboost-thread-dev \
  libboost-filesystem-dev \
  libboost-program-options-dev

# Copy node executables
COPY --from=bitcoin-core /bin/bitcoind /bin/
COPY --from=bitcoin-core /bin/bitcoin-cli /bin/

COPY --from=litecoin-core /bin/litecoind /bin/
COPY --from=litecoin-core /bin/litecoin-cli /bin/

# Copy the LND executables
COPY --from=lnd /bin/lnd /bin/
COPY --from=lnd /bin/lncli /bin/

# Copy configuration files
COPY regtest/data/core/config.conf /root/.bitcoin/bitcoin.conf
COPY regtest/data/core/config.conf /root/.litecoin/litecoin.conf

COPY regtest/data/lnd/lnd.conf /root/.lnd-btc/
COPY regtest/data/lnd/lnd.conf /root/.lnd-btc2/

COPY regtest/data/lnd/lnd.conf /root/.lnd-ltc/
COPY regtest/data/lnd/lnd.conf /root/.lnd-ltc2/

# Copy certificates for the LNDs
COPY regtest/data/lnd/certificates /root/.lnd-btc/
COPY regtest/data/lnd/certificates /root/.lnd-btc2/

COPY regtest/data/lnd/certificates /root/.lnd-ltc/
COPY regtest/data/lnd/certificates /root/.lnd-ltc2/

# Copy macaroons for the LNDs
COPY regtest/data/lnd/macaroons /root/.lnd-btc/data/chain/bitcoin/regtest/
COPY regtest/data/lnd/macaroons /root/.lnd-btc2/data/chain/bitcoin/regtest/

COPY regtest/data/lnd/macaroons /root/.lnd-ltc/data/chain/litecoin/regtest/
COPY regtest/data/lnd/macaroons /root/.lnd-ltc2/data/chain/litecoin/regtest/

# Copy start scripts
COPY regtest/scripts /bin/

# Configure RPC and ZMQ ports 
RUN bash configurePorts.sh

# Run the setup script
RUN bash setup.sh

# Expose RPC ports of the nodes
EXPOSE 18443 19443

# Expose ZMQ ports of the nodes
EXPOSE 29000 29001 29002 30000 30001 30002

# Expose gRPC ports of the LNDs
EXPOSE 10009 10011 11009 11010

# Expose REST API ports of the LNDs
EXPOSE 8080 8081

ENTRYPOINT ["entrypoint.sh"] 
