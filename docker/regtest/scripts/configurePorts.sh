#!/bin/bash

echo "zmqpubrawtx=tcp://0.0.0.0:29000" >> /root/.bitcoin/bitcoin.conf
echo "zmqpubrawblock=tcp://0.0.0.0:29001" >> /root/.bitcoin/bitcoin.conf
echo "zmqpubhashblock=tcp://0.0.0.0:29002" >> /root/.bitcoin/bitcoin.conf

echo "zmqpubrawtx=tcp://0.0.0.0:30000" >> /root/.litecoin/litecoin.conf
echo "zmqpubrawblock=tcp://0.0.0.0:30001" >> /root/.litecoin/litecoin.conf
echo "zmqpubhashblock=tcp://0.0.0.0:30002" >> /root/.litecoin/litecoin.conf

sed -i '$d' /root/.dogecoin/dogecoin.conf
sed -i '$d' /root/.dogecoin/dogecoin.conf

echo "port=18445" >> /root/.dogecoin/dogecoin.conf
echo "zmqpubrawtx=tcp://0.0.0.0:40000" >> /root/.dogecoin/dogecoin.conf
echo "zmqpubrawblock=tcp://0.0.0.0:40001" >> /root/.dogecoin/dogecoin.conf
echo "zmqpubhashblock=tcp://0.0.0.0:40002" >> /root/.dogecoin/dogecoin.conf

echo "zmqpubrawtx=tcp://0.0.0.0:50000" >> /root/.zcash/zcash.conf
echo "zmqpubrawblock=tcp://0.0.0.0:50001" >> /root/.zcash/zcash.conf
echo "zmqpubhashblock=tcp://0.0.0.0:50002" >> /root/.zcash/zcash.conf
