#!/bin/bash

docker run \
  -d \
  --name regtest \
  --volume "${PWD}"/docker/regtest/data/core/cookies:/cookies/ \
  --volume "${PWD}"/docker/regtest/data/cln/certs:/root/.lightning/regtest/certs \
  --volume "${PWD}"/docker/regtest/data/cln/hold:/root/.lightning/regtest/hold \
  --volume "${PWD}"/tools:/tools \
  -p 10735:10735 \
  -p 9736:9735 \
  -p 9291:9291 \
  -p 9292:9292 \
  -p 18443:18443 \
  -p 18444:18444 \
  -p 19443:19443 \
  -p 18332:18332 \
  -p 18232:18232 \
  -p 29000:29000 \
  -p 29001:29001 \
  -p 29002:29002 \
  -p 30000:30000 \
  -p 30001:30001 \
  -p 30002:30002 \
  -p 40000:40000 \
  -p 40001:40001 \
  -p 40002:40002 \
  -p 50000:50000 \
  -p 50001:50001 \
  -p 50002:50002 \
  -p 10009:10009 \
  -p 10011:10011 \
  -p 11009:11009 \
  -p 11010:11010 \
  -p 8081:8081 \
  -p 18884:18884 \
  -p 31000:31000 \
  -p 31001:31001 \
  -p 31002:31002 \
  boltz/regtest:4.1.0

docker exec regtest bash -c "cp /root/.lightning/regtest/*.pem /root/.lightning/regtest/certs"
docker exec regtest chmod -R 777 /root/.lightning/regtest/certs
