#!/bin/bash

docker build -t boltz/btcd -f btcd/Dockerfile .
docker build -t boltz/ltcd -f ltcd/Dockerfile .

docker build -t boltz/lnd -f lnd/Dockerfile .
