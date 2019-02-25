FROM alpine:3.9

# Install dependencies
RUN apk --no-cache add \
  jq \
  boost \
  libzmq \
  libevent \
  libressl \
  boost-program_options

# Copy Bitcoin and Litecoin Core executables
COPY --from=boltz/bitcoin-core:latest /bin/bitcoind /bin/
COPY --from=boltz/bitcoin-core:latest /bin/bitcoin-cli /bin/

COPY --from=boltz/litecoin-core:latest /bin/litecoind /bin/
COPY --from=boltz/litecoin-core:latest /bin/litecoin-cli /bin/

# Copy the LND executables
COPY --from=boltz/lnd:latest /bin/lnd /bin/
COPY --from=boltz/lnd:latest /bin/lncli /bin/

# Copy configuration files for Bitcoin Core, Litecoin Core and the LNDs
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

# Configure ZMQ for Bitcoin and Litecoin Core
RUN echo "zmqpubrawtx=tcp://0.0.0.0:29000" >> /root/.bitcoin/bitcoin.conf
RUN echo "zmqpubrawblock=tcp://0.0.0.0:29001" >> /root/.bitcoin/bitcoin.conf
RUN echo "zmqpubhashblock=tcp://0.0.0.0:29002" >> /root/.bitcoin/bitcoin.conf

RUN echo "zmqpubrawtx=tcp://0.0.0.0:30000" >> /root/.litecoin/litecoin.conf
RUN echo "zmqpubrawblock=tcp://0.0.0.0:30001" >> /root/.litecoin/litecoin.conf
RUN echo "zmqpubhashblock=tcp://0.0.0.0:30002" >> /root/.litecoin/litecoin.conf

# Copy start scripts
COPY regtest/scripts /bin/

# Run the setup script
RUN "setup.sh"

# Expose RPC ports of Bitcoin and Litecoin Core
EXPOSE 18443 19443

# Expose ZMQ ports of Bitcoin and Litecoin Core
EXPOSE 29000 29001 30000 30001

# Expose gRPC ports of the LNDs
EXPOSE 10009 10010 11009 11009

# Expose REST API ports of the LNDs
EXPOSE 8080 8081

ENTRYPOINT ["entrypoint.sh"] 
