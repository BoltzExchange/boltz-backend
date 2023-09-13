---
description: >-
  Deploying Boltz backend has to be done with great care since it will have full
  control over the Lightning Node it is connected to. With great power comes
  great responsibility.
---

# 🚢 Deployment of Boltz Backend

Prerequisites:

* The latest [node.js lts and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) installed. We recommend using [nvm](https://github.com/nvm-sh/nvm#install--update-script) to manage npm installs: `nvm install --lts`
* [rsync](https://github.com/WayneD/rsync) (needed to compile the `TypeScript` code)

Boltz Backend requires a synced Bitcoin Core Instance to connect to the Bitcoin mainchain. Similarly, Elements Core to connect to the Liquid sidechain etc. Bitcoin Core must:

* Have the transaction index enabled: `txindex=1`
* Enable ZeroMQ streams for raw blocks and raw transactions: (`zmqpubrawblock=tcp://<host>:<port>` and `zmqpubrawtx=tcp://<host>:<port>`)

Boltz requires a [LND](https://github.com/LightningNetwork/lnd) node running on Bitcoin to be present. As of writing, [CLN](https://github.com/ElementsProject/lightning/) support is still under development. No special configuration is needed, all official release binaries from the LND repository are compatible with Boltz.

## Config Sample

```toml
configpath = "/home/boltz/.boltz/boltz.conf"
dbpath = "/home/boltz/.boltz/boltz.db"
logpath = "/home/boltz/.boltz/boltz.log"
datadir = "/home/boltz/.boltz"

# This mnemonic is not for the wallet that holds the onchain coins
# but the claim and refund keys are derived from it
mnemonicpath = "/home/boltz/.boltz/seed.dat"

# Possible values are: error, warning, info, verbose, debug, silly
loglevel = "debug"

# This value configures the type of the lockup address of normal Submarine Swaps:
#   - false: P2SH nested P2WSH
#   - true: P2WSH
swapwitnessaddress = false

# Enables the prepay minerfee Reverse Submarine Swap procotol
# If this value is "true", an invoice for the miner fee has to be paid
# before hold invoice of the Revese Swap
prepayminerfee = false

# This is the REST API that should be exposed to the public
# It does not support HTTPS but only plaintext HTTP. A reverse
# proxy should be setup with a web server like Nginx
[api]
host = "127.0.0.1"
port = 9_001

# And this the gRPC API that is used by the boltz-cli executable
[grpc]
host = "127.0.0.1"
port = 9_000
certpath = "/home/boltz/.boltz/tls.cert"
keypath = "/home/boltz/.boltz/tls.key"

# The interval in seconds at which new rates for pairs that
# do not have a hardcoded rate should be updates
[rates]
interval = 1

# Boltz Backend allows for backing up LND channel backups and
# the database to a Google Cloud Storage Bucket
[backup]
email = ""
privatekeypath = ""
bucketname = ""
# Cron interval at which a new backup should be uploaded. The default value is daily
interval = "0 0 * * *"

# Boltz backend supports sending messages to Discord after successful and failed
# Swaps and if the wallet or channel balance is below a configurable threshold 
[notification]
token = ""
channel = ""
prefix = ""
# Interval in minutes at which the wallet and channel balances should be checked 
interval = 1
# Some Discord commands (like withdraw) require a TOTP token
# This is the path to the secret of that TOTP token
otpsecretpath = "/home/boltz/.boltz/otpSecret.dat"

# The array "pairs" configures the trading pairs that Boltz should support
# A pair can have the following options:
# - "base" (required): base currency
# - "quote" (required): quote currency
# - "timeoutDelta": after how many minutes a Swap of that pair should timeout
# - "rate": the rate for a pair can be hardcoded (only sensible for same currency pairs);  
#           if the rate is not hardcoded the mean value from these exchanges will be used:
#             - Binance
#             - Bitfinex 
#             - Coinbase Pro
#             - Kraken
#             - Poloniex
# - "fee": percentage of the swapped amount that should be charged as fee
# - "swapInFee" (optional): same as "fee" but for swaps from onchain to lightning; defaults to "fee" if not set 
[[pairs]]
base = "BTC"
quote = "BTC"
rate = 1
timeoutDelta = 400

maxSwapAmount = 10_000_000
minSwapAmount = 10_000

# Alternatively, the timeouts of swaps of a pair can be set like this
#  [pairs.timeoutDelta]
#  reverse = 1440
#  swapMinimal = 1440
#  swapMaximal = 2880
[[pairs]]
base = "L-BTC"
quote = "BTC"
rate = 1
fee = 0.5
swapInFee = 0.2
timeoutDelta = 300

maxSwapAmount = 1_000_000_000
minSwapAmount = 100_000

# The array "currencies" configures the chain and LND clients for the "pairs"
# Not configuring the LND client is possible but will cause that chain not to support Lightning
# The values are pretty self explainatory apart from: "minWalletBalance" and "minChannelBalance" which trigger
# a Discord notification
[[currencies]]
symbol = "BTC"
network = "bitcoinTestnet"
minWalletBalance = 10_000_000
minChannelBalance = 10_000_000
maxZeroConfAmount = 10_000_000

  [currencies.chain]
  host = "127.0.0.1"
  port = 18_332

  # The requests to Bitcoin Core like clients can be authenticated with cookie files or user/password
  # If both are configured, cookie files are preferred
  cookie = ""

  user = "bitcoin"
  password = "bitcoin"

  # Optional API endpoint of a MempoolSpace instance running on the chain of the configured client
  mempoolSpace = "https://mempool.space/api"

  # The ZMQ endpoints for a chain can be configured here
  # If they are not set, those endpoints are fetched via the "getzmqnotifications" RPC method of the node
  zmqpubrawtx = "tcp://0.0.0.0:29000"
  zmqpubrawblock = "tcp://0.0.0.0:29001"
  
  # hashblock is not required and should only be used as fallback in case rawblock is not available 
  # zmqpubhashblock = ""

  [currencies.lnd]
  host = "127.0.0.1"
  port = 10_009
  certpath = "/home/boltz/.lnd/bitcoin/tls.cert"
  macaroonpath = "/home/boltz/.lnd/bitcoin/admin.macaroon"
  maxPaymentFeeRatio = 0.03
```
