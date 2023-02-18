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

  lnd2Pubkey=$($3 --network=regtest getinfo | jq -r '.identity_pubkey')

  waitForLndToSync "$2"

  $2 connect ${lnd2Pubkey}@127.0.0.1:$4 > /dev/null
  $2 openchannel --node_key ${lnd2Pubkey} --local_amt 100000000 --push_amt 50000000 --private > /dev/null

  $1 generatetoaddress 6 ${nodeAddress} > /dev/null

  while true; do
    numPendingChannels="$($2 getinfo | jq -r ".num_pending_channels")"

    if [[ ${numPendingChannels} == "0" ]]; then
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

echo "Restarting nodes"

stopNodes

sleep 5

startNodes
bitcoin-cli loadwallet $DEFAULT_WALLET_NAME > /dev/null
elements-cli loadwallet $DEFAULT_WALLET_NAME > /dev/null

startLnds

echo "Opening channels"
openChannel bitcoin-cli \
  "lncli --network=regtest --lnddir=/root/.lnd-btc --rpcserver=127.0.0.1:10009" \
  "lncli --network=regtest --lnddir=/root/.lnd-btc --rpcserver=127.0.0.1:10011" \
  9736
openChannel bitcoin-cli \
  "lncli --network=regtest --lnddir=/root/.lnd-btc --rpcserver=127.0.0.1:10009" \
  "lncli --network=regtest --lnddir=/root/.lnd-btc-shard --rpcserver=127.0.0.1:10012" \
  9737

stopLnds
stopNodes

sleep 5
