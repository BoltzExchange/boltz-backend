#!/bin/sh

bitcoind
litecoind

# Wait for Bitcoin and Litecoin Core to start
while true; do
	if bitcoin-cli getblockchaininfo 2>&1 | grep blocks > /dev/null 2>&1; then
		break	
	fi
	sleep 1
done

while true; do
	if litecoin-cli getblockchaininfo 2>&1 | grep blocks > /dev/null 2>&1; then
		break	
	fi
	sleep 1
done

echo "Starting LNDs"

# Start the LNDs
nohup lnd --lnddir=/root/.lnd-btc --listen=127.0.0.1:9735 --rpclisten=0.0.0.0:10009 --restlisten=0.0.0.0:8080 --bitcoin.active --bitcoin.regtest --bitcoin.node=bitcoind > /dev/null 2>&1 & num="0"
nohup lnd --lnddir=/root/.lnd-btc2 --listen=127.0.0.1:9736 --rpclisten=0.0.0.0:10010 --restlisten=0.0.0.0:8081 --bitcoin.active --bitcoin.regtest --bitcoin.node=bitcoind > /dev/null 2>&1 & num="0"

# Wait for the LNDs to start
while true; do
  if lncli --lnddir=/root/.lnd-btc --rpcserver=127.0.0.1:10009 --network=regtest getinfo 2>&1 | grep version > /dev/null 2>&1; then
    break
  fi
  sleep 1
done

while true; do
  if lncli --lnddir=/root/.lnd-btc2 --rpcserver=127.0.0.1:10010 --network=regtest getinfo 2>&1 | grep version > /dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "Started nodes"
