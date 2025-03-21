#!/bin/bash

source utils.sh

startNodes

bitcoin-cli loadwallet $DEFAULT_WALLET_NAME > /dev/null
elements-cli loadwallet $DEFAULT_WALLET_NAME > /dev/null
elements-cli rescanblockchain 0 > /dev/null

startClns
startLnds

mkdir -p /cookies
cp /root/.bitcoin/regtest/.cookie /cookies/.bitcoin-cookie
cp /root/.elements/liquidregtest/.cookie /cookies/.elements-cookie

chmod 777 /cookies/.*

while true; do
  sleep 1
done
