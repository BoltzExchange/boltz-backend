#!/bin/sh
bitcoind

function waitForLnd() {
  while true; do
    if lncli --lnddir=/root/.lnd-btc --rpcserver=127.0.0.1:10009 --network=regtest getinfo 2>&1 | grep synced_to_chain.*true  > /dev/null 2>&1; then
      break	
    fi
    sleep 1
  done

  sleep 5
}

while true; do
	if bitcoin-cli getblockchaininfo 2>&1 | grep blocks > /dev/null 2>&1; then
		break	
	fi
	sleep 1
done

# Mine 101 blocks so that the coinbase of the first block is spendable
echo "Mining 101 blocks"
bitcoin-cli generate 101 > /dev/null

echo "Restarting nodes"

killall bitcoind
sleep 5

start.sh

echo "Opening channel"
waitForLnd

lndBtcAddres=$(lncli --lnddir=/root/.lnd-btc --rpcserver=127.0.0.1:10009 --network=regtest newaddress p2wkh | jq -r '.address')
bitcoin-cli sendtoaddress ${lndBtcAddres} 1.1 > /dev/null

bitcoin-cli generate 1 > /dev/null

lndBtc2PubKey=$(lncli --lnddir=/root/.lnd-btc --rpcserver=127.0.0.1:10010 --network=regtest getinfo | jq -r '.identity_pubkey')

waitForLnd

lncli --lnddir=/root/.lnd-btc --rpcserver=127.0.0.1:10009 --network=regtest connect ${lndBtc2PubKey}@127.0.0.1:9736 > /dev/null
lncli --lnddir=/root/.lnd-btc --rpcserver=127.0.0.1:10009 --network=regtest openchannel --node_key ${lndBtc2PubKey} --local_amt 16777214 --push_amt 8388607  > /dev/null

bitcoin-cli generate 6 > /dev/null

while true; do
  numActiveChannels="$(lncli --lnddir=/root/.lnd-btc --rpcserver=127.0.0.1:10010 --network=regtest getinfo | jq -r ".num_active_channels")"

	if [ ${numActiveChannels} == "1" ]; then
		break	
	fi
	sleep 1
done

killall lnd

killall bitcoind
killall litecoind

sleep 5
