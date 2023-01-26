#!/bin/bash

DEFAULT_WALLET_NAME="default"
export DEFAULT_WALLET_NAME

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
  elementsd

  # Wait for the nodes to start
  waitForNode bitcoin-cli
  waitForNode elements-cli

  echo "Started nodes"
}

function startLnds () {
  echo "Starting LNDs"

  # Start the LNDs
  nohup lnd --lnddir=/root/.lnd-btc --listen=0.0.0.0:9735 --rpclisten=0.0.0.0:10009 --restlisten=0.0.0.0:8080 > /dev/null 2>&1 & num="0"
  nohup lnd --lnddir=/root/.lnd-btc2 --listen=127.0.0.1:9736 --rpclisten=0.0.0.0:10011 --restlisten=0.0.0.0:8081 > /dev/null 2>&1 & num="0"
  nohup lnd --lnddir=/root/.lnd-btc-shard --listen=127.0.0.1:9737 --rpclisten=0.0.0.0:10012 --restlisten=0.0.0.0:8082 --protocol.zero-conf > /dev/null 2>&1 & num="0"

  # Wait for the LNDs to start
  waitForLnd "lncli --network=regtest --lnddir=/root/.lnd-btc --rpcserver=127.0.0.1:10009"
  waitForLnd "lncli --network=regtest --lnddir=/root/.lnd-btc2 --rpcserver=127.0.0.1:10011"
  waitForLnd "lncli --network=regtest --lnddir=/root/.lnd-btc-shard --rpcserver=127.0.0.1:10012"

  echo "Started LNDs"
}

function stopNodes () {
  killall bitcoind
  killall elementsd
}

function stopLnds () {
  killall lnd
}
