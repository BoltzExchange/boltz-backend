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

function waitForCln () {
  while true; do
    cln_height=$($1 getinfo 2> /dev/null | jq .blockheight)
    core_height=$(bitcoin-cli getblockchaininfo | jq .blocks)

    if [ "$cln_height" == "$core_height" ]; then
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
  nohup lnd --lnddir=/root/.lnd-btc --listen=0.0.0.0:9735 --rpclisten=0.0.0.0:10009 --restlisten=0.0.0.0:8080 --bitcoin.active --bitcoin.regtest --bitcoin.node=bitcoind --bitcoind.rpchost=127.0.0.1:18443 > /dev/null 2>&1 & num="0"
  nohup lnd --lnddir=/root/.lnd-btc2 --listen=127.0.0.1:9736 --rpclisten=0.0.0.0:10011 --restlisten=0.0.0.0:8081 --bitcoin.active --bitcoin.regtest --bitcoin.node=bitcoind --bitcoind.rpchost=127.0.0.1:18443 > /dev/null 2>&1 & num="0"

  # Wait for the LNDs to start
  waitForLnd "lncli --lnddir=/root/.lnd-btc --rpcserver=127.0.0.1:10009 --network=regtest"
  waitForLnd "lncli --lnddir=/root/.lnd-btc2 --rpcserver=127.0.0.1:10011 --network=regtest"

  echo "Started LNDs"
}

function startClns () {
  echo "Starting CLNs"

  nohup lightningd > /dev/null 2>&1 & num="0"
  nohup lightningd --regtest --lightning-dir /root/.lightning2 --bind-addr 127.0.0.1:9738 --grpc-port 9295 --developer --dev-fast-gossip --dev-fast-reconnect --dev-bitcoind-poll=5 > /dev/null 2>&1 & num="0"

  waitForCln "lightning-cli"
  waitForCln "lightning-cli --regtest --lightning-dir /root/.lightning2"

  echo "Started CLNs"
}

function startEsplora () {
  echo "Starting Esplora"

  nohup electrs-bitcoin --network regtest --http-addr 0.0.0.0:3000 --jsonrpc-import --daemon-rpc-addr 127.0.0.1:18443 --cookie esplora:8VHqtTLrj2a4fVfcU89KcoQabZT0rVlg29aOeoTH_5o > /dev/null 2>&1 & num="0"

  echo "Started Esplora"
}

function startAsp () {
  echo "Starting ASP"

  export ARKD_DATADIR=/root/.arkd
  export ARKD_WALLET_DATADIR=/root/.arkd/wallet
  export ARKD_NETWORK=regtest
  export ARKD_DB_TYPE=sqlite
  export ARKD_LIVE_STORE_TYPE=inmemory
  export ARKD_EVENT_DB_TYPE=badger
  export ARKD_TX_BUILDER_TYPE=covenantless
  export ARKD_ROUND_INTERVAL=10
  export ARKD_MIN_RELAY_FEE=200
  export ARKD_NO_TLS=true
  export ARKD_NO_MACAROONS=true
  export ARKD_ALLOW_ZERO_FEES=true
  export ARKD_WALLET_ADDR=127.0.0.1:6060
  export ARKD_ALLOW_CSV_BLOCK_TYPE=true

  export ARKD_WALLET_NETWORK=regtest
  export ARKD_WALLET_BITCOIND_RPC_HOST=127.0.0.1:18443
  export ARKD_WALLET_BITCOIND_RPC_USER=asp
  export ARKD_WALLET_BITCOIND_RPC_PASS=HqaIq2XiXq8ClbtDyv_uKELWr6Vn511-FlgHIkOTWAQ

  mkdir -p /root/.arkd
  nohup arkd-wallet > /root/.arkd/wallet-logs.txt 2>&1 & num="0"
  sleep 5
  nohup arkd > /root/.arkd/logs.txt 2>&1 & num="0"

  echo "Started ASP"
}

function startFulmine () {
  echo "Starting Fulmine"

  export FULMINE_NO_MACAROONS=true
  nohup fulmine > /root/.arkd/fulmine-logs.txt 2>&1 & num="0"

  echo "Started Fulmine"
}

function stopNodes () {
  killall bitcoind
  killall elementsd
}

function stopLnds () {
  lncli --lnddir=/root/.lnd-btc --rpcserver=127.0.0.1:10009 --network=regtest stop
  lncli --lnddir=/root/.lnd-btc2 --rpcserver=127.0.0.1:10011 --network=regtest stop
}

function stopCln () {
  lightning-cli stop
}
