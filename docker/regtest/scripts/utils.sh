#!/bin/bash

function waitForNode () {
  while true; do
    if $1 getblockchaininfo 2>&1 | grep blocks > /dev/null 2>&1; then
      break	
    fi
    sleep 1
  done  
}

function waitForLnd () {
  while true; do
    if $1 getinfo 2>&1 | grep version > /dev/null 2>&1; then
      break
    fi
    sleep 1
  done
}

function startNodes ()  {
  echo "Starting nodes"

  bitcoind
  litecoind
  dogecoind
  zcashd >> /dev/null

  # Wait for the nodes to start
  waitForNode bitcoin-cli
  waitForNode litecoin-cli
  waitForNode dogecoin-cli
  waitForNode zcash-cli

  echo "Started nodes"
}

function startLnds () {
  echo "Starting LNDs"

  # Start the LNDs
  nohup lnd --lnddir=/root/.lnd-btc --listen=127.0.0.1:9735 --rpclisten=0.0.0.0:10009 --restlisten=0.0.0.0:8080 --bitcoin.active --bitcoin.regtest --bitcoin.node=bitcoind --bitcoind.rpchost=127.0.0.1:18443 > /dev/null 2>&1 & num="0"
  nohup lnd --lnddir=/root/.lnd-btc2 --listen=127.0.0.1:9736 --rpclisten=0.0.0.0:10010 --restlisten=0.0.0.0:8081 --bitcoin.active --bitcoin.regtest --bitcoin.node=bitcoind --bitcoind.rpchost=127.0.0.1:18443 > /dev/null 2>&1 & num="0"

  nohup lnd --lnddir=/root/.lnd-ltc --listen=127.0.0.1:10735 --rpclisten=0.0.0.0:11009 --restlisten=0.0.0.0:9080 --litecoin.active --litecoin.regtest --litecoin.node=litecoind --litecoind.rpchost=127.0.0.1:19443 > /dev/null 2>&1 & num="0"
  nohup lnd --lnddir=/root/.lnd-ltc2 --listen=127.0.0.1:10736 --rpclisten=0.0.0.0:11010 --restlisten=0.0.0.0:9081 --litecoin.active --litecoin.regtest --litecoin.node=litecoind --litecoind.rpchost=127.0.0.1:19443 > /dev/null 2>&1 & num="0"

  # Wait for the LNDs to start
  waitForLnd "lncli --lnddir=/root/.lnd-btc --rpcserver=127.0.0.1:10009 --network=regtest"
  waitForLnd "lncli --lnddir=/root/.lnd-btc2 --rpcserver=127.0.0.1:10010 --network=regtest"

  waitForLnd "lncli --lnddir=/root/.lnd-ltc --rpcserver=127.0.0.1:11009 --chain=litecoin --network=regtest"
  waitForLnd "lncli --lnddir=/root/.lnd-ltc2 --rpcserver=127.0.0.1:11010 --chain=litecoin --network=regtest"

  echo "Started LNDs"
}

function stopNodes () {
  killall bitcoind
  killall litecoind
  killall dogecoind
  killall zcashd
}

function stopLnds () {
  killall lnd
}
