#!/bin/bash

source utils.sh

startNodes
bitcoin-cli loadwallet $DEFAULT_WALLET_NAME > /dev/null

startLnds

mkdir -p /cookies
cp /root/.bitcoin/regtest/.cookie /cookies/.bitcoin-cookie
cp /root/.litecoin/regtest/.cookie /cookies/.litecoin-cookie

chmod 777 /cookies/.*

while true; do
  sleep 1
done
