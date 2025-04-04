#!/bin/sh

# Boltz Docker regtest
boltzDir=$(pwd)
boltzDataDir="$boltzDir/docker/regtest/data"

cookieDir="$boltzDataDir/core/cookies"

alias bitcoin-cli-sim='bitcoin-cli --regtest --rpccookiefile=$cookieDir/.bitcoin-cookie'

lndCert="$boltzDataDir/lnd/certificates/tls.cert"
lndMacaroon="$boltzDataDir/lnd/macaroons/admin.macaroon"

alias lnclibtc='lncli --rpcserver=127.0.0.1:10009 --tlscertpath=$lndCert --macaroonpath=$lndMacaroon'
alias lnclibtc2='lncli --rpcserver=127.0.0.1:10012 --tlscertpath=$lndCert --macaroonpath=$lndMacaroon'

# Add the Boltz executables to the path
export PATH="$boltzDir/bin:$PATH"
