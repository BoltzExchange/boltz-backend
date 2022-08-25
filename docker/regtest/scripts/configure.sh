#!/bin/bash

mkdir /cookies

# Bitcoin Core
echo "zmqpubrawtx=tcp://0.0.0.0:29000" >> /root/.bitcoin/bitcoin.conf
echo "zmqpubrawblock=tcp://0.0.0.0:29001" >> /root/.bitcoin/bitcoin.conf
echo "zmqpubhashblock=tcp://0.0.0.0:29002" >> /root/.bitcoin/bitcoin.conf

# Elements Core
echo "zmqpubrawtx=tcp://0.0.0.0:31000" >> /root/.elements/elements.conf
echo "zmqpubrawblock=tcp://0.0.0.0:31001" >> /root/.elements/elements.conf
echo "zmqpubhashblock=tcp://0.0.0.0:31002" >> /root/.elements/elements.conf
