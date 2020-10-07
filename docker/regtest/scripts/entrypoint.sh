#!/bin/bash

source utils.sh

startNodes
startLnds

mkdir -p /cookies
cp /root/.bitcoin/regtest/.cookie /cookies/.bitcoin-cookie
cp /root/.litecoin/regtest/.cookie /cookies/.litecoin-cookie

chmod 777 /cookies/.*

while true; do
  sleep 1
done
