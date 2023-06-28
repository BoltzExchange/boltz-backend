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

  $2 connect $3@127.0.0.1:$4 > /dev/null
  $2 openchannel --node_key $3 --local_amt 100000000 --push_amt 50000000 > /dev/null

  $1 generatetoaddress 6 ${nodeAddress} > /dev/null

  while true; do
    numActiveChannels="$($2 getinfo | jq -r ".num_pending_channels")"

    if [[ ${numActiveChannels} == "0" ]]; then
      break
    fi
    sleep 1
  done
}

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

echo "Opening BTC channels"

openChannel bitcoin-cli \
  "lncli --lnddir=/root/.lnd-btc --rpcserver=127.0.0.1:10009 --network=regtest" \
  $(lncli --lnddir=/root/.lnd-btc --rpcserver=127.0.0.1:10011 --network=regtest getinfo | jq -r '.identity_pubkey') \
  9736
echo "Opened channel to LND"

openChannel bitcoin-cli \
  "lncli --lnddir=/root/.lnd-btc --rpcserver=127.0.0.1:10009 --network=regtest" \
  $(lightning-cli getinfo | jq -r .id) \
  9737
echo "Opened channel to CLN"

stopCln
stopLnds
stopNodes

sleep 5
