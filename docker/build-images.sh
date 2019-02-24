#!/bin/bash

docker build -t boltz/bitcoin-core -f bitcoin-core/Dockerfile .
docker build -t boltz/litecoin-core -f litecoin-core/Dockerfile .

docker build -t boltz/lnd -f lnd/Dockerfile .

docker build -t boltz/regtest -f regtest/Dockerfile .
