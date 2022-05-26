#!/bin/sh

# Boltz Docker regtest
boltzDir=$(pwd)
boltzDataDir="$boltzDir/docker/regtest/data"

cookieDir="$boltzDataDir/core/cookies"

alias bitcoin-cli-sim='bitcoin-cli --regtest --rpccookiefile=$cookieDir/.bitcoin-cookie'
alias litecoin-cli-sim='litecoin-cli --regtest --rpccookiefile=$cookieDir/.litecoin-cookie'

lndCert="$boltzDataDir/lnd/certificates/tls.cert"
lndMacaroon="$boltzDataDir/lnd/macaroons/admin.macaroon"

alias lnclibtc='lncli --rpcserver=127.0.0.1:10009 --tlscertpath=$lndCert --macaroonpath=$lndMacaroon'
alias lnclibtc2='lncli --rpcserver=127.0.0.1:10011 --tlscertpath=$lndCert --macaroonpath=$lndMacaroon'

alias lncliltc='lncli --rpcserver=127.0.0.1:11009 --tlscertpath=$lndCert --macaroonpath=$lndMacaroon'
alias lncliltc2='lncli --rpcserver=127.0.0.1:11010 --tlscertpath=$lndCert --macaroonpath=$lndMacaroon'

# Add the Boltz executables to the path
export PATH="$boltzDir/bin:$PATH"
