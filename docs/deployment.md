---
description: >-
  Deploying Boltz backend has to be done with great care since it will have full
  control over the Lightning Node it is connected to. With great power comes
  great responsibility.
---

# 🚢 Backend Deployment

Prerequisites:

* The latest [Node.js LTS and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) installed. We recommend using [nvm](https://github.com/nvm-sh/nvm#install--update-script) to manage npm installs: `nvm install --lts`
* [rsync](https://github.com/WayneD/rsync) (needed to compile the `TypeScript` code)

Boltz Backend requires a synced Bitcoin Core Instance to connect to the Bitcoin mainchain. Similarly, Elements Core to connect to the Liquid sidechain etc. Bitcoin/Elements Core must:

* Have the transaction index enabled: `txindex=1`
* Enable ZeroMQ streams for raw blocks and raw transactions: (`zmqpubrawblock=tcp://<host>:<port>` and `zmqpubrawtx=tcp://<host>:<port>`)

Boltz requires a [LND](https://github.com/LightningNetwork/lnd) or [CLN](https://github.com/ElementsProject/lightning/) node running on Bitcoin to be present. For LND, no special configuration is needed, all [official release binaries](https://github.com/lightningnetwork/lnd/releases) are compatible.

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

# The backend needs a PostgreSQL database
[postgres]
host = "127.0.0.1"
port = 5432
database = "boltz"
username = "boltz"
password = "boltz"

# Logs can be sent to a Loki log aggregator
# lokiHost = "http://127.0.0.1:3100"
# lokiNetwork = "regtest"

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

# Configure CORS headers set by the backend
# "" to disable
cors = "*"

# The backend can expose a metrics endpoint about swap count, volume, etc
# [prometheus]
# host = "127.0.0.1"
# port = 9_092

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

# Boltz Backend allows for backing up LND SCBs and
# the database to a S3 API compatible storage
[backup]
# Cron interval at which a new backup should be uploaded. The default value is daily
interval = "0 0 * * *"

  [backup.simpleStorage]
  bucket = ""
  endpoint = ""
  port = 443
  useSSL = true
  accessKey = ""
  secretKey = ""

# Boltz backend supports sending messages to Mattermost after successful and
# failed Swaps and if the wallet or channel balance is below a configurable threshold
[notification]
mattermostUrl = ""
token = ""
channel = ""
# A string to prefix all messages with
prefix = "mainnet"
# Optionally, important alerts can be sent to a different channel
# channelAlerts = ""

prefix = ""
# Interval in minutes at which the wallet and channel balances should be checked
interval = 1

[swap]
# Chains on which claim transactions should be deferred
# Deferring means not broadcasting claim transactions immediately,
# but waiting for cooperative key path spend of the client
# or batching a script path spend
deferredClaimSymbols = ["BTC", "L-BTC"]

# Interval at which batched script path spends of deferred claim transactions should be done
batchClaimInterval = '*/15 * * * *'

# Tolerance in minutes before swap expiry for a claim transaction to be eligible for batching
expiryTolerance = 120

    # Cost of claim transaction * multiplier = minimial swap size
    [swap.minSwapSizeMultipliers]
    reverse = 7
    reverse = 6
    chain = 6


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

maxSwapAmount = 10_000_000
minSwapAmount = 10_000

# Whether the pair should be available in the legacy v1 API
# Defaults to false
isLegacy = true

# Expiry of the invoices generated for reverse swaps of this pair
# If not set, half of the expiry time of the reverse swap will be used
invoiceExpiry = 7200

    # Timeouts in minutes
    [pairs.timeoutDelta]
    reverse = 1440
    swapMinimal = 1440
    swapMaximal = 2880
    swapTaproot = 10080

[[pairs]]
base = "L-BTC"
quote = "BTC"
rate = 1
fee = 0.5
swapInFee = 0.2

maxSwapAmount = 1_000_000
minSwapAmount = 100_000

# Which swap types to enable for the pair, by default all are enabled
# Possible types:
# - submarine
# - reverse
# - chain
swapTypes = ["submarine", "reverse", "chain"]

    [pairs.chainSwap]
    # If not set, the "fee" will be used
    buyFee = 0.1
    sellFee = 0.15

    # Overrides min and max swap amounts for chain swaps of this pair
    minSwapAmount = 100_000
    maxSwapAmount = 10_000_000

    [pairs.timeoutDelta]
    chain = 1440
    reverse = 1440
    swapMinimal = 1440
    swapMaximal = 2880
    swapTaproot = 10080

[[pairs]]
base = "L-BTC"
quote = "BTC"
fee = 0.25
swapInFee = 0.1
rate = 1

maxSwapAmount = 4_294_967
minSwapAmount = 10_000

    [pairs.timeoutDelta]
    reverse = 1440
    swapMinimal = 1400
    swapMaximal = 2880
    swapTaproot = 10080

# The array "currencies" configures the chain and LND clients for the "pairs"
# Not configuring the LND client is possible but will cause that chain not to support Lightning
# The values are pretty self-explainatory apart from: "minWalletBalance" and "minChannelBalance" which trigger
# a Mattermost notification
[[currencies]]
symbol = "BTC"
network = "bitcoinTestnet"
minWalletBalance = 10_000_000
minChannelBalance = 10_000_000

# Maximal 0-conf amount *per swap*
maxZeroConfAmount = 100_000

# Maximal 0-conf amount for the currency
maxZeroConfRisk = 1_000_000

# Onchain wallet provider
# Options: "core" or "lnd"
# Defaults to "lnd"
# preferredWallet = "core"

# Can be set to alert about the balance of an unused wallet being more than a certain threshold
# maxUnusedWalletBalance = 100_000

# Public keys of Lightning nodes on the network of the currency
# to which we cannot route reliably
noRoute = ["02588a9f9835642d8ab1fb8018f2d9cd85b8fb353cc5375f0f7f59cad87a62133f"]

    [currencies.chain]
    host = "127.0.0.1"
    port = 18_332

    # The requests to Bitcoin Core like clients can be authenticated with cookie files or user/password
    # If both are configured, cookie files are preferred
    cookie = ""

    user = "bitcoin"
    password = "bitcoin"

    # When there is more than one wallet loaded, the name of the wallet that should be used needs to be specified
    # wallet = "boltz"

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

    # A CLN node can be connected via its gRPC interface
    [currencies.cln]
    host = "127.0.0.1"
    port = 9291
    rootCertPath = "/home/boltz/.lightning/testnet/ca.pem"
    privateKeyPath = "/home/boltz/.lightning/testnet/client-key.pem"
    certChainPath = "/home/boltz/.lightning/testnet/client.pem"

        # The Boltz hold invoice plugin is required: https://github.com/BoltzExchange/boltz-backend/tree/master/tools/plugins/hold
        [currencies.cln.hold]
        host = "127.0.0.1"
        port = 9292
        rootCertPath = "/home/boltz/.lightning/testnet/hold/ca.pem"
        privateKeyPath = "/home/boltz/.lightning/testnet/hold/client-key.pem"
        certChainPath = "/home/boltz/.lightning/testnet/hold/client.pem"

        # Optionally, mpay (https://github.com/BoltzExchange/boltz-backend/tree/master/tools/plugins/mpay) can be used to pay invoices
        [currencies.cln.mpay]
        host = "127.0.0.1"
        port = 9293
        rootCertPath = "/home/boltz/.lightning/testnet/mpay/ca.pem"
        privateKeyPath = "/home/boltz/.lightning/testnet/mpay/client-key.pem"
        certChainPath = "/home/boltz/.lightning/testnet/mpay/client.pem"

[liquid]
symbol = "L-BTC"
network = "liquidTestnet"

maxSwapAmount = 4_294_967
minSwapAmount = 10_000

minWalletBalance = 100_000_000

# Time to wait in milliseconds before accepting a lowball 0-conf transaction
# and checking "testmempoolaccept" on the public node
zeroConfWaitTime = 1_000

    # API endpoint to check for reliable 0-conf acceptance
    # Disables "zeroConfWaitTime"
    [liquid.zeroConfTool]
    endpoint = ""

    # Interval in milliseconds at which calls to the endpoint should be retried
    # interval = 100

    # How often calls to the endpoint should be retried before
    # giving up 0-conf for that transaction
    # maxRetries = 60

    [liquid.chain]
    host = "127.0.0.1"
    port = 18884
    cookie = "/home/boltz/.elements/liquidv1/.cookie"

    # When there is more than one wallet loaded, the name of the wallet that should be used needs to be specified
    # wallet = "boltz"
```

## Database migrations

To migrate from an SQLite database to PostgreSQL, use the following script with [pgloader](https://pgloader.io/):

```
load database
    from sqlite://<path>
    into pgsql://<user>:<password>>@<host>/<database>

with quote identifiers, data only, reset sequences

set work_mem to '16MB', maintenance_work_mem to '512 MB';
```
