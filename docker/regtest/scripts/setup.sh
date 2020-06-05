#!/bin/bash

source utils.sh

function waitForLndToSync () {
  while true; do
    if $1 getinfo 2>&1 | grep synced_to_chain.*true  > /dev/null 2>&1; then
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
  $2 openchannel --node_key ${lnd2Pubkey} --local_amt 16777214 --push_amt 8388607 > /dev/null

  $1 generatetoaddress 6 ${nodeAddress} > /dev/null

  while true; do
    numActiveChannels="$($2 getinfo | jq -r ".num_pending_channels")"

    if [[ ${numActiveChannels} == "1" ]]; then
      break	
    fi
    sleep 1
  done
}

startNodes

# Mine 101 blocks so that the coinbase of the first block is spendable
bitcoinAddress=$(bitcoin-cli getnewaddress)
litecoinAddress=$(litecoin-cli getnewaddress)

bitcoin-cli generatetoaddress 101 ${bitcoinAddress} > /dev/null
litecoin-cli generatetoaddress 101 ${litecoinAddress} > /dev/null

echo "Restarting nodes"

stopNodes

sleep 5

startNodes
startLnds

echo "Opening BTC channel"
openChannel bitcoin-cli \
  "lncli --lnddir=/root/.lnd-btc --rpcserver=127.0.0.1:10009 --network=regtest" \
  "lncli --lnddir=/root/.lnd-btc --rpcserver=127.0.0.1:10011 --network=regtest" \
  9736

echo "Opening LTC channel"
openChannel litecoin-cli \
  "lncli --lnddir=/root/.lnd-ltc --rpcserver=127.0.0.1:11009 --chain=litecoin --network=regtest" \
  "lncli --lnddir=/root/.lnd-ltc2 --rpcserver=127.0.0.1:11010 --chain=litecoin --network=regtest" \
  10736

stopLnds
stopNodes

sleep 5
