#!/bin/bash

source utils.sh

startNodes

bitcoin-cli loadwallet $DEFAULT_WALLET_NAME > /dev/null
elements-cli loadwallet $DEFAULT_WALLET_NAME > /dev/null
elements-cli rescanblockchain 0 > /dev/null

startClns
startLnds

while true; do
  sleep 1
done
