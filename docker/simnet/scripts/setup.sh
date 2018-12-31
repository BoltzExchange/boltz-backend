#!/bin/sh

function killNodes() {
  killall lnd

  killall btcd
  killall ltcd

  sleep 10
}

# Start the nodes
start.sh

# Get addresses to which the block rewards should be sent and configure BTCD and LTCD
echo "Setting mining addresses"

btcAddress="$(lncli --lnddir=/root/.lnd-btc --rpcserver=127.0.0.1:10009 --network=simnet newaddress p2wkh | jq -r '.address')"
echo "miningaddr=${btcAddress}" >> /root/.btcd/btcd.conf

ltcAddress="$(lncli --lnddir=/root/.lnd-ltc --rpcserver=127.0.0.1:11009 --chain=litecoin --network=simnet newaddress p2wkh | jq -r '.address')"
echo "miningaddr=${ltcAddress}" >> /root/.ltcd/ltcd.conf

# Restart the nodes
echo "Restarting nodes"

killNodes

start.sh

# Generate 433 on each chain to activate SegWit
echo "Mining 433 blocks to active SegWit"

btcctl --rpcserver=127.0.0.1:18556 generate 433 > /dev/null
ltcctl --rpcserver=127.0.0.1:19556 generate 433 > /dev/null

# Open channels between the BTC and LTC LNDs
echo "Opening channels"

# BTC channel
while true; do
	if lncli --lnddir=/root/.lnd-btc --rpcserver=127.0.0.1:10009 --network=simnet getinfo 2>&1 | grep synced_to_chain.*true  > /dev/null 2>&1; then
		break	
	fi
	sleep 1
done

lndBtc2PubKey="$(lncli --lnddir=/root/.lnd-btc --rpcserver=127.0.0.1:10010 --network=simnet getinfo | jq -r '.identity_pubkey')"

lncli --lnddir=/root/.lnd-btc --rpcserver=127.0.0.1:10009 --network=simnet connect ${lndBtc2PubKey}@127.0.0.1:9736 > /dev/null
lncli --lnddir=/root/.lnd-btc --rpcserver=127.0.0.1:10009 --network=simnet openchannel --node_key ${lndBtc2PubKey} --local_amt 4294967295 --push_amt 2147483647 > /dev/null

# LTC channel
while true; do
	if lncli --lnddir=/root/.lnd-ltc --rpcserver=127.0.0.1:11009 --chain=litecoin --network=simnet getinfo 2>&1 | grep synced_to_chain.*true  > /dev/null 2>&1; then
		break	
	fi
	sleep 1
done

lndLtc2PubKey="$(lncli --lnddir=/root/.lnd-ltc --rpcserver=127.0.0.1:11010 --chain=litecoin --network=simnet getinfo | jq -r '.identity_pubkey')"

lncli --lnddir=/root/.lnd-ltc --rpcserver=127.0.0.1:11009 --chain=litecoin --network=simnet connect ${lndLtc2PubKey}@127.0.0.1:10736 > /dev/null
lncli --lnddir=/root/.lnd-ltc --rpcserver=127.0.0.1:11009 --chain=litecoin --network=simnet openchannel --node_key ${lndLtc2PubKey} --local_amt 38654705655 --push_amt 19327352827 > /dev/null

# Mine 6 blocks on each chain and wait until the channels get active
btcctl --rpcserver=127.0.0.1:18556 generate 6 > /dev/null
ltcctl --rpcserver=127.0.0.1:19556 generate 6 > /dev/null

while true; do
  numActiveChannels="$(lncli --lnddir=/root/.lnd-btc --rpcserver=127.0.0.1:10009 --network=simnet getinfo | jq -r ".num_active_channels")"

	if [ ${numActiveChannels} == "1" ]; then
		break	
	fi
	sleep 1
done

while true; do
  numActiveChannels="$(lncli --lnddir=/root/.lnd-ltc --rpcserver=127.0.0.1:11009 --chain=litecoin --network=simnet getinfo | jq -r ".num_active_channels")"

	if [ ${numActiveChannels} == "1" ]; then
		break	
	fi
	sleep 1
done

killNodes
