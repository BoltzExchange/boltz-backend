#!/bin/sh

function waitForNode () {
  while true; do
    if $1 getblockchaininfo 2>&1 | grep blocks > /dev/null 2>&1; then
      break	
    fi
    sleep 1
  done  
}
