# 🐳 Backend Development

This document describes how to set up a Docker regtest environment for Boltz
Backend development.

## Getting Started

- The latest
  [Node.js LTS and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
  installed. We recommend using
  [nvm](https://github.com/nvm-sh/nvm#install--update-script) to manage npm
  installs: `nvm install --lts`
- [Docker](https://docs.docker.com/engine/install/) or
  [Orbstack](https://orbstack.dev/) for Apple Silicon Macs

The regtest environment of the Boltz Backend is based on
[boltz/regtest](https://hub.docker.com/r/boltz/regtest). To start the images run
`npm run docker:start` and to stop them again use `npm run docker:stop` to stop
and remove the containers.

To use the nodes in the container with the Boltz Backend, use a configuration
file in `~/.boltz/boltz.conf` similar to this one:

```toml
[postgres]
host = "127.0.0.1"
port = 5432
database = "boltz"
username = "boltz"
password = "boltz"

[nodeSwitch]
clnAmountThreshold = 1_000_000

[swap]
deferredClaimSymbols = ["BTC", "L-BTC"]

[[pairs]]
base = "BTC"
quote = "BTC"
rate = 1
fee = 0.4
swapInFee = 0.2

invoiceExpiry = 361

maxSwapAmount = 4_294_967
minSwapAmount = 50_000

    [pairs.timeoutDelta]
    chain = 1440
    reverse = 1440
    swapMinimal = 1440
    swapMaximal = 2880
    swapTaproot = 10080

[[pairs]]
base = "RBTC"
quote = "BTC"
rate = 1
fee = 0.5

maxSwapAmount = 4_294_967
minSwapAmount = 50_000

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
    chain = 1440
    reverse = 1440
    swapMinimal = 1400
    swapMaximal = 2880
    swapTaproot = 10080

[[currencies]]
symbol = "BTC"
network = "bitcoinRegtest"
minWalletBalance = 10_000_000
minLocalBalance = 10_000_000
minRemoteBalance = 10_000_000
maxSwapAmount = 4_294_967
minSwapAmount = 50_000
maxZeroConfAmount = 0
preferredWallet = "core"

    [currencies.chain]
    host = "127.0.0.1"
    port = 18_443
    user = "boltz"
    password = "anoVB0m1KvX0SmpPxvaLVADg0UQVLQTEx3jCD3qtuRI"

    [currencies.lnd]
    host = "127.0.0.1"
    port = 10_009
    certpath = "docker/regtest/data/lnd/certificates/tls.cert"
    macaroonpath = "docker/regtest/data/lnd/macaroons/admin.macaroon"

    [currencies.cln]
    host = "127.0.0.1"
    port = 9291
    rootCertPath = "docker/regtest/data/cln/certs/ca.pem"
    privateKeyPath = "docker/regtest/data/cln/certs/client-key.pem"
    certChainPath = "docker/regtest/data/cln/certs/client.pem"

        [currencies.cln.hold]
        host = "127.0.0.1"
        port = 9292
        rootCertPath = "docker/regtest/data/cln/hold/ca.pem"
        privateKeyPath = "docker/regtest/data/cln/hold/client-key.pem"
        certChainPath = "docker/regtest/data/cln/hold/client.pem"

        [currencies.cln.mpay]
        host = "127.0.0.1"
        port = 9293
        rootCertPath = "docker/regtest/data/cln/mpay/ca.pem"
        privateKeyPath = "docker/regtest/data/cln/mpay/client-key.pem"
        certChainPath = "docker/regtest/data/cln/mpay/client.pem"

[liquid]
symbol = "L-BTC"
network = "liquidRegtest"

maxSwapAmount = 4_294_967
minSwapAmount = 10_000

minWalletBalance = 100_000_000

    [liquid.chain]
    host = "127.0.0.1"
    port = 18884
    user = "boltz"
    password = "anoVB0m1KvX0SmpPxvaLVADg0UQVLQTEx3jCD3qtuRI"

[rsk]
providerEndpoint = "http://127.0.0.1:8545"

    [[rsk.contracts]]
    etherSwap = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    erc20Swap = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"

    [[rsk.tokens]]
    symbol = "RBTC"

    maxSwapAmount = 4_294_96700
    minSwapAmount = 10000

    minWalletBalance = 100_000_000

    [[rsk.tokens]]
    symbol = "USDT"
    decimals = 18
    contractAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"

    maxSwapAmount = 4_294_96700000
    minSwapAmount = 10000

    minWalletBalance = 400_000_000_000
    maxWalletBalance = 500_000_000_000

[sidecar]
    [sidecar.grpc]
    host = "127.0.0.1"
    port = 9003

    [sidecar.ws]
    host = "127.0.0.1"
    port = 9004

    [sidecar.api]
    host = "127.0.0.1"
    port = 9005
```

We recommend adding aliases to control executables of Boltz and nodes to your
`.bashrc`:

```bash
# Boltz Docker regtest
boltzDir="<path to the cloned repository>"
boltzDataDir="$boltzDir/docker/regtest/data"

alias bitcoin-cli-sim='bitcoin-cli --regtest --rpcport=18443 -rpcuser=boltz -rpcpassword=anoVB0m1KvX0SmpPxvaLVADg0UQVLQTEx3jCD3qtuRI'
alias elements-cli-sim='elements-cli --regtest --rpcport=18884 -rpcuser=boltz -rpcpassword=anoVB0m1KvX0SmpPxvaLVADg0UQVLQTEx3jCD3qtuRI'

lndCert="$boltzDataDir/lnd/certificates/tls.cert"
lndMacaroon="$boltzDataDir/lnd/macaroons/admin.macaroon"

alias lnclibtc='lncli --rpcserver=127.0.0.1:10009 --tlscertpath=$lndCert --macaroonpath=$lndMacaroon'
alias lnclibtc2='lncli --rpcserver=127.0.0.1:10011 --tlscertpath=$lndCert --macaroonpath=$lndMacaroon'

alias lncliltc='lncli --rpcserver=127.0.0.1:11009 --tlscertpath=$lndCert --macaroonpath=$lndMacaroon'
alias lncliltc2='lncli --rpcserver=127.0.0.1:11010 --tlscertpath=$lndCert --macaroonpath=$lndMacaroon'

alias lightning-cli-sim='docker exec -it regtest lightning-cli'

# Add the Boltz executables to the path
export PATH="$boltzDir/bin:$PATH"
```

## boltz-cli

The `boltz-cli` tool allows you to interact with a running backend over gRPC. It can be useful for backend development and to perform maintenance tasks. It is available on the `bin` folder after compiling the backend.

Commands:

```bash
boltz-cli <command>

  boltz-cli addreferral <id> <feeShare>     adds a new referral ID to the
  [routingNode]                             database
  boltz-cli allowrefund <id>                skips the safety checks and allows
                                            cooperative refunds for a swap
  boltz-cli txfee <symbol> <transactionId>  calculate the fee of a transaction
  boltz-cli checktx <symbol> <id>           checks a transaction on the
                                            blockchain
  boltz-cli claim <network> <preimage>      claims reverse submarine or chain to
  <privateKey> <redeemScript>               chain swaps
  <rawTransaction> <destinationAddress>
  [feePerVbyte] [blindingKey]
  boltz-cli clnthreshold <type>             sets the CLN threshold for a swap
  <threshold>                               type
  boltz-cli claim-cooperative <network>     claims a Taproot Reverse Submarine
  <preimage> <privateKey> <swapId>          Swap cooperatively
  <swapTree> <destinationAddress>
  [feePerVbyte] [blindingKey]
  boltz-cli claim-cooperative-chain         claims a Taproot Chain Swap
  <swapId> <network> <preimage>             cooperatively
  <claimKeys> <claimTree> <refundKeys>
  <refundTree> <destinationAddress>
  [feePerVbyte] [blindingKey]
  boltz-cli refund-cooperative <network>    refunds a Taproot Submarine Swap
  <privateKey> <swapId> <swapTree>          cooperatively
  <destinationAddress> [feePerVbyte]
  [blindingKey] [rawTransaction]
  boltz-cli deriveblindingkeys <address>    derives a the blinding keypair of an
                                            address
  boltz-cli derivekeys <symbol> <index>     derives a keypair from the index of
                                            an HD wallet
  boltz-cli dev-clearswapupdatecache [id]   clears the swap update cache
  boltz-cli dev-createpartial               creates a partial Musig2 signature
  <ourPrivateKey> <theirPublicKey>
  <theirPubNonce> <hash> [tweak]
  [isLiquid]
  boltz-cli dev-disablecooperative          disable cooperative signatures for
  [disabled]                                swaps
  boltz-cli dev-heapdump [path]             dumps the heap of the daemon into a
                                            file
  boltz-cli dev-setcustomtimeout <blocks>   sets custom timeout blocks for
                                            regtest testing
  boltz-cli dev-disablecooperative          disable cooperative signatures for
  [disabled]                                swaps
  boltz-cli getaddress <symbol> <label>     gets an address of a specified
                                            wallet
  boltz-cli getbalance                      gets the balance of all wallets
  boltz-cli getinfo                         gets information about the Boltz
                                            instance and the nodes it is
                                            connected to
  boltz-cli getlabel <id>                   get the label for a transaction
  boltz-cli pendingevmtransactions          get pending EVM transactions
  boltz-cli getreferrals [id]               gets referrals from the database
  boltz-cli hash <value>                    parses a hex value and hashes it
  boltz-cli listswaps [status] [limit]      lists swaps
  boltz-cli newkeys                         generates a new keypair
  boltz-cli newpreimage                     generates a new preimage and its
                                            hash
  boltz-cli pendingsweeps                   lists the swap ids that have pending
                                            sweeps
  boltz-cli queryreferrals <key> <secret>   queries referrals with API key and
                                            secret
  boltz-cli refund <network> <privateKey>   refunds submarine or chain to chain
  <timeoutBlockHeight> <redeemScript>       swaps
  <rawTransaction> <destinationAddress>
  [feePerVbyte] [blindingKey]
  boltz-cli rescan <symbol> <startHeight>   rescans the chain of a symbol
  [includeMempool]
  boltz-cli sendcoins <symbol> <address>    sends coins to a specified address
  <amount> <label> [fee] [send_all]
  boltz-cli setloglevel <level>             changes the log level
  boltz-cli setreferral <id> [config]       updates the config of a referral
  [amend]
  boltz-cli setswapstatus <id> <status>     changes swap status in the database
  boltz-cli stop                            stops the backend
  boltz-cli sweepswaps [symbol]             sweeps all deferred swap claims
  boltz-cli unblindoutputs [id] [hex]       unblinds the outputs of a
                                            transaction
  boltz-cli updatetimeout <reverse>         updates the timeout block delta of a
  <swap_min> <swap_max> <swap_taproot>      pair
  <chain_swap>

Options:
      --help              Show help                                    [boolean]
      --version           Show version number                          [boolean]
  -h, --rpc.host          gRPC service host      [string] [default: "127.0.0.1"]
  -p, --rpc.port          gRPC service port             [number] [default: 9000]
  -d, --rpc.disable-ssl   Disable SSL authentication for the gRPC
                                                      [boolean] [default: false]
      --rpc.certificates  gRPC SSL certificates folder
                             [string] [default: "/home/kio/.boltz/certificates"]
  -e, --api.endpoint      Boltz API endpoint
                                [string] [default: "https://api.boltz.exchange"]
```