#!/bin/bash

function print () {
  echo -e "\n\e[32mBuilding $1\e[0m"
}

print "Berkeley DB"
docker build -t boltz/berkeley-db -f berkeley-db/Dockerfile .

print "Bitcoin Core"
docker build -t boltz/bitcoin-core -f bitcoin-core/Dockerfile .

print "Litecoin Core"
docker build -t boltz/litecoin-core -f litecoin-core/Dockerfile .

print "LND"
docker build -t boltz/lnd -f lnd/Dockerfile .

print "regtest image"
docker build -t boltz/regtest -f regtest/Dockerfile .
