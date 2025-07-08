#!/bin/bash

source utils.sh

startNodes

bitcoin-cli loadwallet $DEFAULT_WALLET_NAME > /dev/null
elements-cli loadwallet $DEFAULT_WALLET_NAME > /dev/null
elements-cli rescanblockchain 0 > /dev/null

startClns
startLnds

startEsplora

mkdir -p /cookies
cp /root/.bitcoin/regtest/.cookie /cookies/.bitcoin-cookie
cp /root/.elements/liquidregtest/.cookie /cookies/.elements-cookie

chmod 777 /cookies/.*

startAsp
sleep 10
bitcoin-cli -generate 1 > /dev/null
sleep 10
arkd wallet unlock --password ark > /dev/null

bitcoin-cli -generate 1 > /dev/null

startFulmine
sleep 40
curl -s -X POST http://localhost:7001/api/v1/wallet/unlock \
  -H "Content-Type: application/json" \
  -d '{"password": "ark"}' > /dev/null

while true; do
  sleep 1
done

