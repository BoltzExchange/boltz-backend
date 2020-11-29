#!/bin/bash

echo "Starting GETH"
nohup geth --datadir /gethData --dev > /dev/null 2>&1 & num="0"

echo "Waiting for startup"
sleep 15

echo "Killing GETH"
killall geth

echo "Waiting for shutdown"
sleep 15
