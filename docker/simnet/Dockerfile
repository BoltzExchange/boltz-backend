# This image contains a SegWit activated BTCD and LTCD simnet environment
# with two LNDs on each chain that have a channel to eachother
FROM alpine:3.8

# Install jq to parse JSON
RUN apk update && apk upgrade && apk add --no-cache jq

# Copy the BTCD executables
COPY --from=boltz/btcd:latest /bin/btcd /bin/
COPY --from=boltz/btcd:latest /bin/btcctl /bin/

# Copy the LTCD executables
COPY --from=boltz/ltcd:latest /bin/ltcd /bin/
COPY --from=boltz/ltcd:latest /bin/ltcctl /bin/

# Copy the LND executables
COPY --from=boltz/lnd:latest /bin/lnd /bin/
COPY --from=boltz/lnd:latest /bin/lncli /bin/

# Copy configuration files for BTCD and LTCD
COPY simnet/data/configs/btcd.conf /root/.btcd/
COPY simnet/data/configs/btcctl.conf /root/.btcd/

COPY simnet/data/configs/btcd.conf /root/.ltcd/ltcd.conf
COPY simnet/data/configs/btcctl.conf /root/.ltcd/ltcctl.conf

COPY simnet/data/configs/lnd.conf /root/.lnd-btc/
COPY simnet/data/configs/lnd.conf /root/.lnd-ltc/

COPY simnet/data/configs/lnd.conf /root/.lnd-btc2/
COPY simnet/data/configs/lnd.conf /root/.lnd-ltc2/

# Copy certificates for BTCD, LTCD and two LNDs
COPY simnet/data/certs/btcd /root/.btcd/
COPY simnet/data/certs/btcd /root/.ltcd/

COPY simnet/data/certs/lnd /root/.lnd-btc/
COPY simnet/data/certs/lnd /root/.lnd-ltc/

COPY simnet/data/certs/lnd /root/.lnd-btc2/
COPY simnet/data/certs/lnd /root/.lnd-ltc2/

# Copy macaroons for the LNDs
COPY simnet/data/macaroons/ /root/.lnd-btc/data/chain/bitcoin/simnet/
COPY simnet/data/macaroons/ /root/.lnd-ltc/data/chain/litecoin/simnet/

COPY simnet/data/macaroons/ /root/.lnd-btc2/data/chain/bitcoin/simnet/
COPY simnet/data/macaroons/ /root/.lnd-ltc2/data/chain/litecoin/simnet/

# Copy setup and start scripts
COPY simnet/scripts/ /usr/bin/

# Expose RPC ports of BTCD and LTCD
EXPOSE 18556 19556

# Expose gRPC ports of the LNDs
EXPOSE 10009 10010 11009 11010

# Start the BTCD, LTCD and LND nodes
RUN setup.sh

ENTRYPOINT ["entrypoint.sh"] 
