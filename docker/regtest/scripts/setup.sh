#!/bin/bash

source utils.sh

function waitForLndToSync () {
  while true; do
    if $1 getinfo 2>&1 | grep synced_to_chain.*true > /dev/null 2>&1; then
      break
    fi
    sleep 1
  done

  sleep 5
}

function waitForArkdToSync () {
  echo "Waiting for ASP to sync"

  while true; do
    balance=$(arkd wallet balance 2>&1)
    if ! echo "$balance" | grep "still syncing" > /dev/null 2>&1; then
      break
    fi
    sleep 1
  done

  echo "ASP synced"
}

function openChannel () {
  nodeAddress=$($1 getnewaddress)
  lndAddress=$($2 newaddress p2wkh | jq -r '.address')

  $1 sendtoaddress ${lndAddress} 10 > /dev/null

  $1 generatetoaddress 1 ${nodeAddress} > /dev/null

  waitForLndToSync "$2"

  $2 connect $3@127.0.0.1:$4 > /dev/null 2> /dev/null

  if $5; then
    $2 openchannel --node_key $3 --local_amt 100000000 --push_amt 50000000 --private > /dev/null
  else
    $2 openchannel --node_key $3 --local_amt 100000000 --push_amt 50000000 > /dev/null
  fi

  $1 generatetoaddress 6 ${nodeAddress} > /dev/null

  while true; do
    numPendingChannels="$($2 getinfo | jq -r ".num_pending_channels")"

    if [[ ${numPendingChannels} == "0" ]]; then
      break
    fi
    sleep 1
  done
}

function waitForClnChannel () {
  bitcoin-cli generatetoaddress 6 $(bitcoin-cli getnewaddress) > /dev/null

  while true; do
    numPendingChannels="$($1 getinfo | jq -r .num_pending_channels)"

    if [[ ${numPendingChannels} == "0" ]]; then
      break
    fi
    sleep 1
  done

  # Give it some time to gossip
  sleep 25
}

echo "cd /tools && /root/.local/bin/poetry install" > /root/poetry-install.sh
chmod +x /root/poetry-install.sh

echo "cd /tools && /root/.local/bin/poetry run python3 plugins/hold/plugin.py" > /root/hold.sh
chmod +x /root/hold.sh

echo "cd /tools && /root/.local/bin/poetry run python3 plugins/mpay/mpay.py" > /root/mpay.sh
chmod +x /root/mpay.sh

startNodes

bitcoin-cli createwallet $DEFAULT_WALLET_NAME > /dev/null
elements-cli createwallet $DEFAULT_WALLET_NAME > /dev/null


# Mine 101 blocks so that the coinbase of the first block is spendable
bitcoinAddress=$(bitcoin-cli getnewaddress)
elementsAddress=$(elements-cli getnewaddress)

bitcoin-cli generatetoaddress 101 ${bitcoinAddress} > /dev/null
elements-cli generatetoaddress 101 ${elementsAddress} > /dev/null

elements-cli rescanblockchain > /dev/null

startClns
startLnds

startAsp
startFulmine
startEsplora

mkdir /root/.lightning/regtest/certs
mkdir /root/.lightning/regtest/hold

echo "Opening BTC channels"

openChannel bitcoin-cli \
  "lncli --lnddir=/root/.lnd-btc --rpcserver=127.0.0.1:10009 --network=regtest" \
  $(lncli --lnddir=/root/.lnd-btc --rpcserver=127.0.0.1:10011 --network=regtest getinfo | jq -r '.identity_pubkey') \
  9736 false
echo "Opened channel to LND"

openChannel bitcoin-cli \
  "lncli --lnddir=/root/.lnd-btc --rpcserver=127.0.0.1:10009 --network=regtest" \
  $(lightning-cli getinfo | jq -r .id) \
  9737 false

openChannel bitcoin-cli \
  "lncli --lnddir=/root/.lnd-btc --rpcserver=127.0.0.1:10009 --network=regtest" \
  $(lightning-cli getinfo | jq -r .id) \
  9737 true

openChannel bitcoin-cli \
  "lncli --lnddir=/root/.lnd-btc --rpcserver=127.0.0.1:10011 --network=regtest" \
  $(lightning-cli getinfo | jq -r .id) \
  9737 false

lightning-cli connect $(lightning-cli getinfo --regtest --lightning-dir /root/.lightning2 | jq -r .id)@127.0.0.1:9738 > /dev/null

openChannel bitcoin-cli \
  "lncli --lnddir=/root/.lnd-btc --rpcserver=127.0.0.1:10011 --network=regtest" \
  $(lightning-cli getinfo --regtest --lightning-dir /root/.lightning2 | jq -r .id) \
  9738 false

echo "Opened channels to CLN"

waitForClnChannel "lightning-cli"
waitForClnChannel "lightning-cli --regtest --lightning-dir /root/.lightning2"

# ASP setup
echo "Funding ASP"

arkd wallet create --password ark > /dev/null
waitForArkdToSync

bitcoin-cli sendtoaddress $(arkd wallet address) 25 > /dev/null
bitcoin-cli generatetoaddress 1 $(bitcoin-cli getnewaddress) > /dev/null

arkd wallet unlock --password ark > /dev/null

# Fulmine setup
echo "Funding Fulmine"

curl -s -X POST http://localhost:7001/api/v1/wallet/create \
  -H "Content-Type: application/json" \
  -d '{"private_key": "693b0b993e69953c35838e96c8c41430e0ae881c2faa1bc95e203cdaec5f3fdf", "password": "ark", "server_url": "http://localhost:7070"}' > /dev/null

curl -s -X POST http://localhost:7001/api/v1/wallet/unlock \
  -H "Content-Type: application/json" \
  -d '{"password": "ark"}' > /dev/null

fulmineAddress=$(curl -s -X GET http://localhost:7001/api/v1/address | jq -r .address)
fulmineAddress=${fulmineAddress#bitcoin:}
fulmineAddress=${fulmineAddress%%\?*}

bitcoin-cli sendtoaddress ${fulmineAddress} 1 > /dev/null
bitcoin-cli generatetoaddress 1 $(bitcoin-cli getnewaddress) > /dev/null

sleep 30

killall fulmine
killall arkd

stopCln
stopLnds
stopNodes

sleep 5
