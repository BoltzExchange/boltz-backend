# Changelog

All notable changes to this project will be documented in this file.

## [3.4.0] - 2024-01-23

### Bug Fixes

- Forbid reverse swaps with same preimage hash
- Race condition when setting invoices of swaps (#432)
- Exclude most expensive route in mpay
- Deduplicate already paid mpay invoices
- Mpay tests in CI
- Route hint delay on retries
- Order of mpay route stats
- Gas price BigInt conversion error in FeeProvider
- Locked funds prometheus metric with PostgreSQL
- Make Anvil miner faster
- Stats of first month of year
- Python plugin certificate creation test
- Tests broken by Taproot swaps
- Allow modded versions of CLN
- CLN node URIs
- Handling of invoices with msat precision (#454)
- Wrong status event for eligible swap refund
- Remove "l" from swap id generator (#457)
- Reset LND mission control on interval (#461)
- Include RSK in API v2 pairs
- Do not overwrite failure reason when expiring swap
- API v2 swap routes

### Documentation

- Misc updates (#429)
- Fix P2SH nested P2WSH hashing
- Swagger specs for API V2 endpoints
- Redeem script clarification (#463)

### Features

- PostgreSQL as database (#425)
- Mpay plugin prototype
- Try direct channels first in mpay
- Mpay list command
- Reset path memory in mpay
- Refactor route fee calculations
- GRPC for mpay
- SQLite mpay database
- Getswaptransaction for Ethereum chains
- Swap node config (#442)
- Mpay route cache (#447)
- Add nodes API v2 (#451)
- Taproot submarine swaps
- Cooperative Taproot submarine swap refunds
- Taproot reverse swaps
- Uncooperative Taproot swap spend cli
- BIP-21 in invoice memo of reverse swaps (#458)
- PostgreSQL database backups (#462)
- API v2 pairs
- Chain endpoints in API v2
- API v2 get submarine swap transaction
- API v2 swap status
- Mpay to pay invoices

### GITBOOK-74

- Change request with no subject merged in GitBook

### Miscellaneous Tasks

- Update changelog for v3.3.0
- Update license for v3.3.0 release (#426)
- Minor readme update (#428)
- API landing page favicon (#430)
- Update Python dependencies
- Put MIT license on CLN plugins
- Update to LND v0.17.1-beta
- Update dependencies
- Bump LND version to v0.17.2-beta
- Bump cryptography from 41.0.5 to 41.0.6 in /tools (#438)
- Update dependencies
- Bump max supported CLN version
- Update Docker images (#444)
- Bump CLN version to v23.11.1
- Bump CLN version to v23.11.2
- Prettier import sorting
- Bump follow-redirects from 1.15.2 to 1.15.4 (#456)
- Bump GETH Docker image version
- Generate mpay TypeScript protos

### Refactor

- Cleanup Python project structure
- Use external SQLAlchemy sessions
- Include exclude check in get_routes
- Stats queries for PostgreSQL

### Revert

- RSK in API v2

### Testing

- Add rudimentary tests for mpay
- Add Taproot related tests
- MusigSigner integration test

## [3.3.0] - 2023-10-30

### Bug Fixes

- Custom integration test runner for CI
- Higher invoice CLTV offset for Reverse Swaps
- Connect nodes for hold invoice test
- Skipped hold invoice plugin tests
- Too short CLTV expiry hold plugin test
- Python plugin integration tests on CI
- CLN to LND short channel id conversion
- Various CLN bugs (#378)
- CLN pay status gRPC
- Duplicate CLN pay calls
- Startup without LND
- Route querying for CLN
- Nested arrays in routing hints endpoint
- Use correct lightning node to query route CLTV estimations
- Check for paid invoices in paystatus
- Check for temporary errors before pending
- Improve detection of pending CLN payments
- Filter configs with no min wallet balance for notifications
- Reconnect to CLN subscription error on interval
- Retry SQLITE_BUSY error
- Detect open invoice with only cancelled HTLCs
- Minor prometheus metric typo
- Payment error handling (#417)
- Handling of pending HTLCs for expired invoices (#419)
- Minor adjustments for RSK compatibility
- CI Docker build workflow
- Commit version in Docker image build
- Default metrics to 0
- Logging of InjectedProvider

### Documentation

- Minor wording adjustment (#415)
- Uncomment EVM RSK sections (#416)
- Add API Onion address (#423)
- RSK related rewording (#424)

### Features

- Increase routing offset based on amount (#372)
- GRPC command to unblind outputs of a transaction (#373)
- CLN hld invoice plugin
- CLN SCB backup plugin
- MPP support for CLN hold invoice plugin
- GRPC for hold invoice plugin
- Improve hold gRPC error handling
- Track hold invoice state via gRPC
- Hold gRPC steam to track all invoices
- Routing hints in hold invoice plugin (#375)
- CLN integration in backend
- Save creation date of hold invoices
- GRPC SSL for hold invoice plugin
- Support for multiple wallets/nodes in gRPC
- Upload SCB backup on plugin startup
- Switch between LND and CLN based on referral (#379)
- GetRoute in hold plugin for specifying max CLTV
- Apply CLTV exceptions to routing hints
- Query swapinfo by more columns (#399)
- Fallback for timeouts when creating invoices (#398)
- Separate notification channel for alerts (#400)
- Use satcomma to format notification amounts (#403)
- Max unused wallet balance alert (#405)
- Forbid swaps to our own lightning nodes
- Loki transport for logger (#410)
- Race all locking lightning client calls
- Log and send notification for client status changes
- Prometheus metrics
- RSK integration
- Configurable expiry of reverse swap invoices (#422)
- Save hold HTLC information in datastore
- Query listholdinvoices by invoice
- Prevent invoice overpayment in hold plugin
- Throw error when creating invoices with hash length != 32

### Miscellaneous Tasks

- Update changelog
- Speed up tests by disabling global type check
- Bump certifi from 2022.12.7 to 2023.7.22 in /tools (#368)
- Update NPM dependencies
- Harden regtest Docker image build
- Enable fast gossip for CLN in regtest image
- Fix shebang line in Python plugins
- Update geth Docker image to v1.12.2
- Bump version to v3.3.0
- Bump CLN to v23.08
- Update dependencies
- Update CLN Docker image
- Bump max CLN version
- Bump cryptography from 41.0.3 to 41.0.4 in /tools (#384)
- Update dependencies
- Remove docs build status
- Bump urllib3 from 2.0.4 to 2.0.6 in /tools (#392)
- Update LND to v0.17.0 (#397)
- Update git-commit-template.txt (#393)
- README Update (#389)
- Push Docker image on push to master
- Push Docker images with latest tag by default (#404)
- Remove unused mkdocs dependency
- Bump urllib3 from 2.0.6 to 2.0.7 in /tools (#409)
- Bump @babel/traverse from 7.22.8 to 7.23.2 (#411)
- Update to Bitcoin Core v25.1
- Update dependencies
- Dependency updates
- Update dependencies
- Fix .gitattributes
- Switch from black to ruff Python formatter
- Python format rule adjustments

### Refactor

- Use highest mempool.space fee estimation
- Use bolt11 Python library
- Update bolt11 library
- Move docs to gitbook
- Getstats command (#402)
- Infer BaseClient log name from service name

### Styling

- Fix ruff warnings

### Testing

- Integration test for hold invoice CLN plugin
- Fix broken tests
- Fix broken TimeoutDeltaProvider tests
- Add missing tests for RSK integration

### Refator

- Remove last hardcoded usages of LND client

## [3.2.1] - 2023-07-19

### Bug Fixes

- Use correct Logger for NodeInfo
- Remove tslint config
- Mine block before generating invoices in integration test

### Features

- Send latest Swap status on SSE connect
- Use queryRoutes to estimate timeout of swaps

### Miscellaneous Tasks

- Update CHANGELOG.md for v3.2.0
- Update LND to v0.16.4 (#362)
- Update ESLint TypeScript plugins
- Update backend version

## [3.2.0] - 2023-06-30

### Bug Fixes

- Stringify of BigInt
- Show output index of Swap transactions
- Handle cltv limit should be greater than errors
- Allow disabling currencies gracefully
- Mininmal amount calculations on interval
- Liquid testnet BIP21
- Liquid transaction sizes
- Allow lower limits on Liquid
- Do not throw when WebDAV backup fails
- Increase estimated size for Liquid claim transactions
- Broken tests
- Crash after LND restart with invoice GC
- Missing initEccLib call to bitcoinjs-lib
- Handle invoice settlement error
- Channel open after successful swap
- CoreWalletProvider integration test
- Handling replaced swap transactions
- Chain ID serialization
- Broken service test
- Lightning payment reliability (#358)
- Swap timeout for cross chain
- Buffer to reach routing hints

### Documentation

- Rm ltc sample from /getnodes (#321)
- Markdown style fixes
- Update according to changes in Liquid branch
- Update config sample

### Features

- LND v0.16.0-beta support (#316)
- Add boltz-cli command to hash hex values
- Backups to WebDav (#330)
- Liquid integration
- Liquid BIP21
- Configurable wallet backend
- Liquid 0.2 sat/vbyte floor
- Mempool.space API fallbacks
- Blinding key of swaps
- Use Taproot addresses by default in Bitcoin Core wallet
- Node stats enpoint
- Deriving blinding keys via gRPC
- API landing page

### Miscellaneous Tasks

- Update changelog
- Update GitHub CI Action (#312)
- Update Docker images
- Update sqlite3 to 5.1.5
- Update CLN Docker image to 23.02.2
- Improve miner_fee script
- Minor style fixes
- Update boltz Docker image
- Update LND to 0.16.1-beta (#324)
- Update LND to 0.16.2-beta (#328)
- Print version on startup
- Increasize liquid fees
- Bump boltz-core-liquid
- Hardcode Liquid tx fee to 0.11 sat/vbyte
- Update regtest container
- Run prettier on whole project
- Update Docker images
- Increase Mempool.space refresh interval
- Update Eclair Docker image
- Update dependencies
- Revert version to v3.2.0
- Bump CI Node.js version (#356)
- Update CLN Docker image to v23.05.2

### Refactor

- Dockerfile of backend for tagged image builds
- Fee estimation preparation log
- Update to Ethers v6
- Querying statistics
- Make database repositories static
- Disable RBF for lockup transactions
- Set limit of pairs in pair

## [3.1.5] - 2023-02-11

### Bug Fixes

- Race condition in fee calculation of ERC20s
- Improve Web3 provider initialization
- Failure reason detection of SendPaymentV2
- Query lockup vout in database migration to v2
- Race condition which caused claim transactions not being detected
- Balance alerts of Ethereum wallets (#224)
- Set payment fee limit (#230)
- Harden Discord login logic
- LND max message length
- Set start height of LND transaction list call
- Timestamp of log messages (#236)
- Handle pending lightning HTLCs
- Pad log timestamps
- Convert amounts of lockefunds command to whole coins
- Retry of channel creation invoice payment
- Error when routing policy is not defined
- Handle failed requests to GasNow
- Double channel opening when connecting to remote node
- Check routability for disabled channel creations
- Harden ZMQ connection logic
- Harden Reverse Swap lockup confirmation logic (#246)
- Invoice cancellation on fresh regtest environments
- Show method of failed Web3 provider requests (#248)
- Handle rejections (#249)
- GasNow WebSocket timeouts
- Stuck GasNow WebSocket
- Handle invoices already cancelled by LND
- Foreign key of channel creations
- Handle GasNow WebSocket errors
- Still allow LND v0.12
- Update dependencies
- Redundant check for confirmed lock transactions
- Increase invoice payment timeout
- More verbose backup upload failure logs (#260)
- Endless channel backup reconnection loop
- Add missing port to startRegtest.sh (#280)
- Reject AMP invoices for swaps (#289)
- Prepay minerfee race condition
- Missing -f parameter to docker build (#296)
- Max CLTV delta for lightning payments
- CLTV delta for cross chain swaps
- Cross chain CLTV delta for Ethereum
- Add check for minimal CLTV limit
- ARM64 boltz-backend Docker build
- Parsing of invalid Bitcoin addresses

### Documentation

- Update for v3.1.0
- Request authentication and querying referrals
- Add note that API is not accessible from browser (#295)
- Minor wording fix

### Features

- Improve balance check notifications
- Add timeout to requests to web3 provider
- Group stats by year
- Split long Discord message in multiple parts
- Show ids of swaps for which coins are locked (#233)
- Add provider for Bitcoin Core wallet (#235)
- Allow client to request private routing hints
- Allow clients to fetch routing hints
- Update to swap contracts v2
- Add Ethereum prepay miner fee
- Cancel pending HTLCs for expired prepay invoices
- Allow to specify onchain amount when creating Reverse Swaps
- Add user/password RPC authentication again
- Improve invoice cancellation logic
- Switch to GasNow WebSocket (#247)
- Add mempool.space based fee estimates
- Adjust minimal limits based on miner fees (#253)
- Add referral fee
- Send Ethereum type 2 transactions
- Add referral API keys and secrets
- Add HMAC API authentication
- Add API endpoint to query referrals
- API endpoint to query swap timeouts
- Allow configuring ZMQ endpoints
- Add elements to docker regtest (#269)
- Set max payment fee ratio for LND (#299)
- SwapIn fee (#305)
- Allow setting feePerVbyte and timeoutBlockHeight in CLI tooling

### Miscellaneous Tasks

- Update Zcash to v4.1.1
- Decrease LND payment timeout to 15 seconds
- Update GETH to v1.9.25
- Update LND to v0.12.0
- Update Docker images
- Run Github actions only against Node v14
- Update to LND v0.12.1
- Update Zcash to v4.3.0
- Update GETH to v1.10.0
- Update GETH to v1.10.1
- Update dependencies
- Update Python dependencies
- Update dependencies (#251)
- Update NPM dependencies
- Update NPM dependencies
- Fix build (#256)
- Update dependencies
- Update dependencies
- Switch to grpc-js
- Update dependencies
- Dependency updates
- Update GETH to v1.10.9
- Update LND to v0.13.3-beta (#263)
- Update dependencies
- Fix lint errors
- Update c-lightning image to v0.10.2
- Update to Node v16 (#267)
- Update dependencies
- Update Docker images
- Update dependencies
- Docker images for linux/arm64
- Allow specifying organisation in Docker build script
- Update Docker images
- Update to LND 0.14.2-beta (#274)
- Add docker image for boltz-backend (#285)
- Add security.md (#287)
- Docker image updates
- NPM dependency updates
- Minor wording fixes
- Add docker aliases script (#282)
- Update LND to v0.15.0
- Update protos for LND 0.15.0
- Bump max LND version 0.15.1
- Update Docker images
- Update Dockerfile for Boltz backend
- Update dependencies
- Update Docker images to LND 0.15.2-beta
- Show TX ID when it cannot be found
- Set max LND version to 0.15.3
- Update LND Docker image to v0.15.3
- Update LND to v0.15.4
- Update Docker images
- Update Docker images
- Update regtest Docker image
- Update vulnerable dependencies
- Update dependencies
- Add SQL scripts to query stats
- Update dependencies

### Refactor

- Remove all GasNow code
- Cache LND node URIs
- Switch from WebSocket to HTTP Web3 providers
- Remove native dependency for disk usage
- Use poetry for Python dependencies

### Testing

- Add case for gRPC messages longer than the default limit
- Fetch contract addresses dynamically
- Comment out Binance price oracle test
- Add case for decoding of invalid addresses

## [2.4.3] - 2020-11-19

### Bug Fixes

- Use miner fees shown in API

### Documentation

- Catch up with Ethereum branch
- Add pairHash documentation

### Features

- Make swap status updates more consistent
- Improve injected web3 provider
- Add CLI command to derive keys
- Return refund address for Ethereum Reverse Swaps
- Expose Ethereum network identifier in API
- Add tests for UtxoNursery
- Add CLI tool to migrate database
- Group volume by month in stats command
- Add support for Infura as eth provider
- Use SendPaymentV2 with up to 3 parts
- Query routes in a MPP compatible way
- Remove ambiguous id possibilities
- Implement pair hash check

### Miscellaneous Tasks

- Update Eclair to v0.4.2
- Update GETH to v1.9.23
- Run CI with Node v15
- Update Docker images
- Update GETH to v1.9.24
- Update changelog

### Testing

- Add unit tests for LightningNursery
- Add unit test for EthereumNursery
- Add ETH and USDT test cases to FeeProvider

## [2.4.2] - 2020-10-10

### Bug Fixes

- Update to LND v0.11.1

### Features

- Expose token contracts addresses in API
- Query Ethereum Swap values from lockup transcation
- Add fallback web3 provider
- Switch to Bitcoin and Litecoin Core cookie authentication

### Miscellaneous Tasks

- Fix publish script
- Update GETH to v1.9.22
- Update LND to v0.11.1-beta
- Switch from IERC20 to ERC20 ABI
- Bump version to v2.4.2

## [2.4.1] - 2020-09-22

### Bug Fixes

- Handle changed node locktime error
- Retry channel opening when remote node is syncing
- Set rate for unconfirmed Swap outputs
- Broken unit tests
- Channel Creation edge cases
- Use GasNow only on mainnet

### Features

- Add ethereum tooling
- Add Ether and ERC20 wallets
- Add Ether and ERC20 swaps
- Rescan chains on startup
- Ethereum Swap improvements
- Charge correct miner fee for USDT pairs
- Add database migration for schema version 2
- Add Channel Creation and Swap retry logic
- Set rate of Swaps created with preimage hash
- Events for failed lockup transactions in API
- Use GasNow for gas price predictions
- Improve sending from boltz-ethereum
- Add pending Ethereum transaction tracker
- Add 10 percent buffer to CLTV expiry for cross chain Reverse Swaps

### Miscellaneous Tasks

- Add c-lightning and eclair images
- Switch from Ganache to GETH
- Update dependencies
- Update dependencies
- Update dependencies
- Fund Ethereum wallets when starting Docker images
- Update zcash Docker image
- Update dependencies
- Update c-lightning to 0.9.1
- Update CHANGELOG.md

### Testing

- Update and fix integration tests

## [2.4.0] - 2020-08-18

### Bug Fixes

- Relax invoice check in auto Channel Creation mode

### Features

- Add chain client and LND version checks
- Try to connect by public key before opening channel
- Send notifications when LND stream errors (#217)

### Miscellaneous Tasks

- Switch to eslint
- Update to LND 0.10.3-beta
- Update vulnerable dependencies
- Bump max supported versions

## [2.3.0] - 2020-07-05

### Bug Fixes

- Invoice decoding library (#180)
- Update proto for LND version 0.9.0-beta
- Add scanned block height to GetInfo (#183)
- Sweeping Ether
- Travis build
- Failed transactions included in pending swaps (#184)
- Pay invoice if set after transaction was sent
- Broken link in docs
- Minor fixes
- LND race conditions
- README.md update (#199)
- Handle OP_RETURN outputs
- Unit tests
- Swap rate calculations
- Cross chain Channel Creations
- Peer online database query
- Recreating filters on restarts
- Invoice expiry check
- Channel Creation Discord messages

### Documentation

- Add channel creation docs
- Add docs for deployments
- Finish deployment docs
- Minor fixes and clarifications
- Add refund file standard
- Add scripting docs

### Features

- Add Ether and ERC20 wallet
- Set CLTV expiry of hold invoices
- Add endpoint to query lockup transaction of swap
- Special error handling broadcasting refund transactions
- Add endpoint to query nodes
- Add channel creation logic
- Improve logging of failed requests
- Invoice and channel object sanity checks
- Configurable address type for Submarine Swaps
- Add prepay minerfee Reverse Swap protocol
- Add "channel.created" event (#204)
- Add database version schema (#205)
- Custom Discord notifications for Channel Creations
- Abandon Swaps with expired invoices

### Miscellaneous Tasks

- Prepare release v2.1.0-beta (#179)
- Update LND to v0.9.0-beta
- Rename newaddress Discord command
- Update dependencies
- Add script to calculate miner fee of transactions
- Update discord.js client
- Update dependencies
- Update LND to v0.9.2-beta
- Update dependencies
- Update dependencies
- Update to LND 0.10
- Update dependencies
- Upgrade Bitcoin Core & Litecoin Core
- Update LND to 0.10.1-beta
- Switch to GitHub actions
- Update build badge in README
- Enable integration tests on GitHub actions
- Update dependencies
- Update Sequelize to v6 (#209)

### Refactor

- Swap flow to allow creation with preimage hash
- Retry logic
- Reveal both invoices in prepay minerfee protocol (#201)

### Testing

- Update test cases
- Add cases for SwapNursery
- Fix and add test cases
- Add tests for SwapManager

## [2.1.0-beta] - 2020-01-14

### Bug Fixes

- Error printing of chain client during initialization
- Multiple messages of disk usage checker
- Address and invoice encoding in LND Litecoin
- Loading status of pending reverse swaps
- Python linting warnings
- Update commands for new reverse swaps
- Normal cross chain swaps
- Edge case of swap event handling
- Invoice decoding on testnet

### Documentation

- Feedback changes (#139)
- Add aliases for executables in Docker image (#140)
- Add discord badge (#149)
- Add missing Discord link (#148)

### Features

- Add memo to invoice of reverse swaps
- Add script to fund Boltz wallet (#141)
- Add withdraw Discord command (#142)
- Add notification when disk is getting full (#146)
- Add usage of single commands to Discord help
- Show git commit hash in version (#151)
- Add pendingswaps Discord command
- Add lockedfunds Discord command
- Make timeouts configurable on a per chain basis (#153)
- Add tool to analyze failed swaps (#157)
- Accept invoices with upper case letters (#158)
- Show onchainAmount in response of createreverseswap (#161)
- Add Dogecoin Core and Zcash Docker images
- Add support for Dogecoin
- Remove Boltz wallet
- Build LND docker image with all available tags
- Add version API endpoint
- Reverse swaps with hold invoices
- Use new reverse swap script
- Add timeouts of hold reverse swaps
- Cancel invoices of expired reverse swaps
- Raw transaction in events of reverse swaps
- Default status for swaps
- Add ETA to TransactionMempool events
- Reword invoice memo (#178)

### Miscellaneous Tasks

- Update dependencies
- Switch from CircleCI to Travis (#144)
- Add Travis build badge
- Add Travis build on Windows
- Update dependencies
- Update dependencies and Docker images
- Update LND and regtest images to use LND 0.8.0-beta
- Update dependencies
- Disable CircleCI build (#168)
- Update Docker images
- Update NPM dependencies
- Update LND to 0.8.2-beta
- Exclude TypeScript build info from NPM package
- Bump amount of coins sent to LND wallet
- Update Discord messages for new reverse swaps
- Update dependencies

### Refactor

- Reformat swap messages (#143)
- Improve git commit hash script
- Readable swap Discord notifications
- Createswap API endpoint

### Testing

- Add and update unit tests
- Fix remaining failing tests

## [2.0.0-beta] - 2019-08-27

### Bug Fixes

- Output type of NewAddress
- Tests in different timezones
- Minor improvements
- Minor fee calculation fixes
- Not throwing exception if backup private key cannot be found
- Tests after renaming event to status
- Race conditions in EventHandler
- Message of backup command (#131)
- Calculation of enforced limits of LTC/BTC pair
- Always use free port for ZMQ tests

### Documentation

- Add readthedocs documentationn
- Refactoring docs
- Move Regtest Docker environment wiki page
- Document Server-Sent Events script

### Features

- Abort swaps after expiration (#123)
- Accept 0-conf for non RBF swap outputs (#118)
- Add 0-conf limits to getPairs endpoint
- Improve Docker image build process
- Add timeoutBlockHeight to response of createReverseSwap
- Add list of images to builder script
- Add script to stream Server-Sent events

### Miscellaneous Tasks

- Update images
- Update dependencies
- Update Bitcoin Core and LND images
- Update vulnerable dependencies
- Update vulnerable dependencies (#134)
- Release v2.0.0-beta
- Link Read the Docs in README

### Refactor

- Move all fee and rate calculations to middleware (#124)
- Move logic from middleware to backend
- Switch from TransactionBuilder to PSBT
- Rescanning of missed blocks

### Testing

- Add tests from middleware
- Add tests
- Add unit test for service and swap manager

### Rejactor

- Move test suite to jest

## [1.0.0-beta.2] - 2019-05-15

### Features

- Detection of chain reorganizations (#115)
- More verbose events for accounting in the middleware (#120)

### Miscellaneous Tasks

- Switch to CircleCI workflows (#116)
- Update Docker images (#119)
- Release v1.0.0-beta.2 (#121)

## [1.0.0-beta] - 2019-04-29

### Bug Fixes

- Claim swap after one confirmation (#26)
- Remove last usages of Networks.ts file (#30)
- Sending transaction on Litecoin
- Rate of reverse swaps (#64)
- Improve logging of reverse swaps (#66)
- Emit invoice.paid event only if request succeeded (#70)
- Outputs to wallet table relation
- Error message of broadcasting refund transactions (#80)
- Set max fee to 100 sat per vbyte (#82)
- Correct timeout block height in map (#89)
- Config file parsing (#90)
- Catch LND errors when paying invoices (#94)
- Fee calculation of reverse swaps (#101)
- Fee calculation (#111)
- Could not find route for private channels (#112)
- Route hint list length check (#113)

### Features

- Add inquirer as optional input for boltz-cli (#24)
- Subscribe to confirmed transactions
- Subscribe to paid invoices
- Add prepared simnet environment
- Check unconfirmed UTXOs on startup
- Detect multiple UTXOs per output
- Improve CreateReverseSwap response
- Add events to SubscribeTransactions
- Add preimage to invoice settled events (#65)
- Mark transactions as spent
- Add channel balance to GetBalanceResponse (#71)
- Add timeout height to swap commands (#57)
- Emit event when invoice not settled (#60)
- Automatically refund failed swaps (#73)
- Reconnect to lnd if streaming calls are disconnected #48 (#59)
- Expose LND REST API on simnet image
- Add error to status of connected nodes (#78)
- Add BTCD fee estimator
- Add gRPC method to estimate fee
- Add gRPC method to send coins
- Add gRPC stream for refunds of reverse swaps
- Add additional field for fee of swap (#84)
- Switch from BTCD to Bitcoin Core
- Add fallback for pubrawblock ZMQ filter
- Add lock to wallet to avoid double spending
- Add event for not payable invoices
- Add inbound balance to getbalance (#97)
- Check whether invoice can be routed before creating swap
- Send all funds of wallet (#108)
- Add gRPC stream for static channel backups

### Miscellaneous Tasks

- Use boltz-core library (#25)
- Add NPM badge (#27)
- Update Go versions in Docker images (#32)
- Minor style improvements
- Disallow unused variables
- Update boltz-core to version 0.0.5 (#56)
- Update dependencies
- Move TODOs to issues (#55)
- Cleanup of timeout naming scheme
- Remove unnecessary log statement (#74)
- Integrate CircleCI (#77)
- Update node version of CircleCI
- Move Berkeley DB build into own container (#87)
- Update boltz-core dependency to v0.0.6 (#91)
- Update dependencies
- Update LND protobuf to version 0.6-beta
- Update Go alpine version (#107)
- Release v1.0.0-beta (#114)

### Performance

- More efficient handling of gRPC subscriptions

### Refactor

- Remove concept of trading pairs (#28)
- Update integration for new image
- Remove generation of BIP21 payment requests (#39)
- Custom fee for sendToAddress method of wallet (#61)
- Parse currencies from config (#29)
- Update sequelize to v5 (#105)

### Testing

- Unit tests for chain and zmq clients (#98)

## [0.0.2] - 2018-12-03

### Bug Fixes

- Database error on startup (#5)
- Export detectSwap method (#22)

### Features

- Fee estimation for claim and refund transactions (#4)
- Add broadcasting of transactions (#6)
- Add retrieving transaction from its hash (#20)
- Add timeout to createswap (#21)

### Miscellaneous Tasks

- Bump version to 0.0.2 (#23)

## [0.0.1] - 2018-11-26

### Miscellaneous Tasks

- Add Travis badge to README.md
- Preparations for NPM package (#2)
- Export claim and refund transaction in NPM module (#3)

<!-- generated by git-cliff -->
