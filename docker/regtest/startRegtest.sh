#!/bin/bash

docker run \
  -d \
  --name regtest \
  --volume "${PWD}"/docker/regtest/data/core/cookies:/cookies/ \
  --volume "${PWD}"/docker/regtest/data/cln/certs:/root/.lightning/regtest/certs \
  --volume "${PWD}"/docker/regtest/data/cln/hold:/root/.lightning/regtest/hold \
  --volume "${PWD}"/docker/regtest/data/cln/mpay:/root/.lightning/regtest/mpay \
  --volume "${PWD}"/tools:/tools \
  --volume "${PWD}"/docker/regtest/data/cln/plugins:/root/.lightning/plugins \
  -p 29000:29000 \
  -p 29001:29001 \
  -p 29002:29002 \
  -p 18445:18445 \
  -p 10009:10009 \
  -p 10011:10011 \
  -p 9291:9291 \
  -p 37040:37040 \
  -p 31000:31000 \
  -p 31001:31001 \
  -p 31002:31002 \
  -p 18884:18884 \
  -p 18443:18443 \
  -p 9736:9736 \
  -p 9737:9737 \
  -p 8080:8080 \
  -p 8081:8081 \
  -p 9735:9735 \
  -p 9293:9293 \
  -p 9292:9292 \
  boltz/regtest:4.8.2

docker exec regtest bash -c "cp /root/.lightning/regtest/*.pem /root/.lightning/regtest/certs"
docker exec regtest chmod -R 777 /root/.lightning/regtest/certs
docker exec regtest chmod -R 777 /root/.lightning/plugins

if [[ "$(uname)" == "Darwin" ]]; then
  wait_for_cookie_files() {
    local max_attempts=30
    local attempt=1
    local bitcoin_cookie_path="/root/.bitcoin/regtest/.cookie"
    local elements_cookie_path="/root/.elements/liquidregtest/.cookie"

    while [ $attempt -le $max_attempts ]; do
      if docker exec regtest test -f "$bitcoin_cookie_path" && docker exec regtest test -f "$elements_cookie_path"; then
        return 0
      fi

      sleep 1
      ((attempt++))
    done

    echo "Cookie file extraction failed"
    return 1
  }

  wait_for_cookie_files
  if [ $? -eq 0 ]; then
    docker exec regtest cat /root/.bitcoin/regtest/.cookie > "${PWD}/docker/regtest/data/core/cookies/.bitcoin-cookie"
    chmod 644 "${PWD}/docker/regtest/data/core/cookies/.bitcoin-cookie"

    docker exec regtest cat /root/.elements/liquidregtest/.cookie > "${PWD}/docker/regtest/data/core/cookies/.elements-cookie"
    chmod 644 "${PWD}/docker/regtest/data/core/cookies/.elements-cookie"
  fi
fi
