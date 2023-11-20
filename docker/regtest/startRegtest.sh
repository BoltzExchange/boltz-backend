#!/bin/bash

docker run \
  -d \
  --name regtest \
  --volume "${PWD}"/docker/regtest/data/core/cookies:/cookies/ \
  --volume "${PWD}"/docker/regtest/data/cln/certs:/root/.lightning/regtest/certs \
  --volume "${PWD}"/docker/regtest/data/cln/hold:/root/.lightning/regtest/hold \
  --volume "${PWD}"/docker/regtest/data/cln/mpay:/root/.lightning/regtest/mpay \
  --volume "${PWD}"/tools:/tools \
  --network host \
  boltz/regtest:4.2.2

docker exec regtest bash -c "cp /root/.lightning/regtest/*.pem /root/.lightning/regtest/certs"
docker exec regtest chmod -R 777 /root/.lightning/regtest/certs
