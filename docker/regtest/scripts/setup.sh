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
    numPendingChannels="$(lightning-cli getinfo | jq -r .num_pending_channels)"

    if [[ ${numPendingChannels} == "0" ]]; then
      break
    fi
    sleep 1
  done

  # Give it some time to gossip
  sleep 25
}

echo "/tools/.venv/bin/python3 /tools/hold/plugin.py" > /root/hold.sh
chmod +x /root/hold.sh

startNodes

bitcoin-cli createwallet $DEFAULT_WALLET_NAME > /dev/null
elements-cli createwallet $DEFAULT_WALLET_NAME > /dev/null


# Mine 101 blocks so that the coinbase of the first block is spendable
bitcoinAddress=$(bitcoin-cli getnewaddress)
elementsAddress=$(elements-cli getnewaddress)

bitcoin-cli generatetoaddress 101 ${bitcoinAddress} > /dev/null
elements-cli generatetoaddress 101 ${elementsAddress} > /dev/null

elements-cli rescanblockchain > /dev/null

startCln
startLnds

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

echo "Opened channels to CLN"

waitForClnChannel

stopCln
stopLnds
stopNodes

sleep 5
