#!/bin/sh

echo "Starting BTCD and LTCD"

nohup btcd --rpclisten=0.0.0.0:18556 > /dev/null 2>&1 & num="0"
nohup ltcd --rpclisten=0.0.0.0:19556 > /dev/null 2>&1 & num="0"

# Wait for BTCD and LTCD to start
while true; do
	if btcctl --rpcserver=127.0.0.1:18556 getinfo 2>&1 | grep blocks > /dev/null 2>&1; then
		break	
	fi
	sleep 1
done

while true; do
	if ltcctl --rpcserver=127.0.0.1:19556 getinfo 2>&1 | grep blocks > /dev/null 2>&1; then
		break	
	fi
	sleep 1
done

echo "Starting LNDs"

# Start the BTCD LNDs
nohup lnd --lnddir=/root/.lnd-btc --listen=127.0.0.1:9735 --rpclisten=0.0.0.0:10009 --restlisten=0.0.0.0:8080 --bitcoin.active --bitcoin.simnet --btcd.rpchost 127.0.0.1:18556 --btcd.rpcuser user --btcd.rpcpass user > /dev/null 2>&1 & num="0"
nohup lnd --lnddir=/root/.lnd-btc2 --listen=127.0.0.1:9736 --rpclisten=0.0.0.0:10010 --restlisten=0.0.0.0:8081 --bitcoin.active --bitcoin.simnet --btcd.rpchost 127.0.0.1:18556 --btcd.rpcuser user --btcd.rpcpass user > /dev/null 2>&1 & num="0"

# Start the LTCD LNDs
nohup lnd --lnddir=/root/.lnd-ltc --listen=127.0.0.1:10735 --rpclisten=0.0.0.0:11009 --restlisten=0.0.0.0:9080 --litecoin.active --litecoin.simnet --ltcd.rpchost 127.0.0.1:19556 --ltcd.rpcuser user --ltcd.rpcpass user > /dev/null 2>&1 & num="0"
nohup lnd --lnddir=/root/.lnd-ltc2 --listen=127.0.0.1:10736 --rpclisten=0.0.0.0:11010 --restlisten=0.0.0.0:9081 --litecoin.active --litecoin.simnet --ltcd.rpchost 127.0.0.1:19556 --ltcd.rpcuser user --ltcd.rpcpass user > /dev/null 2>&1 & num="0"

# Wait for the LNDs to start
while true; do
  if lncli --lnddir=/root/.lnd-btc --rpcserver=127.0.0.1:10009 --network=simnet getinfo 2>&1 | grep version > /dev/null 2>&1; then
    break
  fi
  sleep 1
done

while true; do
  if lncli --lnddir=/root/.lnd-btc --rpcserver=127.0.0.1:10010 --network=simnet getinfo 2>&1 | grep version > /dev/null 2>&1; then
    break
  fi
  sleep 1
done

while true; do
  if lncli --lnddir=/root/.lnd-ltc --rpcserver=127.0.0.1:11009 --chain=litecoin --network=simnet getinfo 2>&1 | grep version > /dev/null 2>&1; then
    break
  fi
  sleep 1
done

while true; do
  if lncli --lnddir=/root/.lnd-ltc --rpcserver=127.0.0.1:11010 --chain=litecoin --network=simnet getinfo 2>&1 | grep version > /dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "Started nodes"
