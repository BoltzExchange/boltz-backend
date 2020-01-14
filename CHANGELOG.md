# [2.1.0-beta](https://github.com/BoltzExchange/boltz-backend/compare/v2.0.0-beta...v2.1.0-beta) (2020-01-14)


### Bug Fixes

* address and invoice encoding in LND Litecoin ([62e0bbb](https://github.com/BoltzExchange/boltz-backend/commit/62e0bbb5a1637b6e2145132089731e368b55ee7a))
* edge case of swap event handling ([68f9387](https://github.com/BoltzExchange/boltz-backend/commit/68f9387d9c1fff0e0d77c942ce904090a57b927f))
* error printing of chain client during initialization ([7fe33bd](https://github.com/BoltzExchange/boltz-backend/commit/7fe33bdeedf091320ee2db3ebfce3aa5eefa5254))
* invoice decoding on testnet ([bf21052](https://github.com/BoltzExchange/boltz-backend/commit/bf210522f525770773da23f3a6c854a5eb433d1e))
* loading status of pending reverse swaps ([9104819](https://github.com/BoltzExchange/boltz-backend/commit/91048191a24e9f060aa170af1baf07e121b52693))
* multiple messages of disk usage checker ([1af2887](https://github.com/BoltzExchange/boltz-backend/commit/1af2887f2cf68935e6d626ff13eec60f6c7667ed))
* normal cross chain swaps ([7072765](https://github.com/BoltzExchange/boltz-backend/commit/7072765443b58112a9bbabc5ad51b2d96fd89b7b))
* Python linting warnings ([a346829](https://github.com/BoltzExchange/boltz-backend/commit/a346829e13ddc876ef9317b52c9efa29d5188e8a))
* update commands for new reverse swaps ([41460c0](https://github.com/BoltzExchange/boltz-backend/commit/41460c0120c2491703560d8d214c92097383b826))


### Features

* accept invoices with upper case letters ([#158](https://github.com/BoltzExchange/boltz-backend/issues/158)) ([d2f08d4](https://github.com/BoltzExchange/boltz-backend/commit/d2f08d45b79eafc16f5c778b687b11f590c2dde4))
* add Dogecoin Core and Zcash Docker images ([9bec35d](https://github.com/BoltzExchange/boltz-backend/commit/9bec35da3d72a1ba885e03664e12be9f3841eb39))
* add ETA to TransactionMempool events ([3a3a29d](https://github.com/BoltzExchange/boltz-backend/commit/3a3a29df443172f6c32ce6038445e4211351cb7b))
* add lockedfunds Discord command ([b034f25](https://github.com/BoltzExchange/boltz-backend/commit/b034f25ef81e40662404c9d91ea488c0ad1dacad))
* add memo to invoice of reverse swaps ([556513f](https://github.com/BoltzExchange/boltz-backend/commit/556513ffd4957a130da481fad1c6420ab42c2400))
* add notification when disk is getting full ([#146](https://github.com/BoltzExchange/boltz-backend/issues/146)) ([47843ba](https://github.com/BoltzExchange/boltz-backend/commit/47843ba1c9aec0b481b128cc84b974e141feae34))
* add pendingswaps Discord command ([f192ea2](https://github.com/BoltzExchange/boltz-backend/commit/f192ea2260fb4488038d79243c8860b9c9e4500f))
* add script to fund Boltz wallet ([#141](https://github.com/BoltzExchange/boltz-backend/issues/141)) ([c0ff5ca](https://github.com/BoltzExchange/boltz-backend/commit/c0ff5cafb691b6336114230869d45c86f1fedb5f))
* add support for Dogecoin ([2c9e9d6](https://github.com/BoltzExchange/boltz-backend/commit/2c9e9d689b3dbc64d922a61b06534a1e3a0c28ce))
* add timeouts of hold reverse swaps ([f4aae82](https://github.com/BoltzExchange/boltz-backend/commit/f4aae827a2bf347a05bd6659ecf9999898b27f4c))
* add tool to analyze failed swaps ([#157](https://github.com/BoltzExchange/boltz-backend/issues/157)) ([9138f3b](https://github.com/BoltzExchange/boltz-backend/commit/9138f3b24c853ec3c8178d52ef919e5df9b5ebcf))
* add usage of single commands to Discord help ([63c6e8c](https://github.com/BoltzExchange/boltz-backend/commit/63c6e8ca1a18ece9d76340b10d064e526ce7989f))
* add version API endpoint ([277d2c7](https://github.com/BoltzExchange/boltz-backend/commit/277d2c7d4595ca56ede18019eccd50bbfda31460))
* add withdraw Discord command ([#142](https://github.com/BoltzExchange/boltz-backend/issues/142)) ([6fdc4d4](https://github.com/BoltzExchange/boltz-backend/commit/6fdc4d4bd9f34459561b8fc6f5427306b0bd0fb7))
* build LND docker image with all available tags ([d3ddba0](https://github.com/BoltzExchange/boltz-backend/commit/d3ddba0cc9324823944be4c053cc4bfc17a8d107))
* cancel invoices of expired reverse swaps ([e6aef4f](https://github.com/BoltzExchange/boltz-backend/commit/e6aef4f8789fc2307d26425ba0ba9d431e5093b9))
* default status for swaps ([531fd39](https://github.com/BoltzExchange/boltz-backend/commit/531fd39920ccc749af0f3cc10e2ec756dced6b65))
* make timeouts configurable on a per chain basis ([#153](https://github.com/BoltzExchange/boltz-backend/issues/153)) ([14f7b80](https://github.com/BoltzExchange/boltz-backend/commit/14f7b8037218b50c5110eb5d76239450824549a2))
* raw transaction in events of reverse swaps ([46b8d25](https://github.com/BoltzExchange/boltz-backend/commit/46b8d25437497f74ad39dd44ecced3d84fd04ce0))
* remove Boltz wallet ([6946bf3](https://github.com/BoltzExchange/boltz-backend/commit/6946bf34b7bf746b73b7ab98a32253b7b6f8ef72))
* reverse swaps with hold invoices ([6936fc2](https://github.com/BoltzExchange/boltz-backend/commit/6936fc203b5fcb1cabbb28853f0b94eed71c0bb0))
* reword invoice memo ([af55e31](https://github.com/BoltzExchange/boltz-backend/commit/af55e318128e513996d47b568901574b81493ebd))
* show git commit hash in version ([#151](https://github.com/BoltzExchange/boltz-backend/issues/151)) ([f84a2f7](https://github.com/BoltzExchange/boltz-backend/commit/f84a2f7c303e5d5a17c2f5db666a1da60cfb9088))
* show onchainAmount in response of createreverseswap ([#161](https://github.com/BoltzExchange/boltz-backend/issues/161)) ([f1c784a](https://github.com/BoltzExchange/boltz-backend/commit/f1c784a7d1111c7f7d6ffe85d746753f5bde2427))
* use new reverse swap script ([82d8860](https://github.com/BoltzExchange/boltz-backend/commit/82d8860b86c8da9fc0cbb6e5f76d6a577f5f03f2))



# [2.0.0-beta](https://github.com/BoltzExchange/boltz-backend/compare/v1.0.0-beta.2...v2.0.0-beta) (2019-08-27)


### Bug Fixes

* always use free port for ZMQ tests ([8eb6984](https://github.com/BoltzExchange/boltz-backend/commit/8eb6984))
* calculation of enforced limits of LTC/BTC pair ([e874595](https://github.com/BoltzExchange/boltz-backend/commit/e874595))
* message of backup command ([#131](https://github.com/BoltzExchange/boltz-backend/issues/131)) ([b5f1676](https://github.com/BoltzExchange/boltz-backend/commit/b5f1676))
* minor fee calculation fixes ([9075469](https://github.com/BoltzExchange/boltz-backend/commit/9075469))
* minor improvements ([c3f19b4](https://github.com/BoltzExchange/boltz-backend/commit/c3f19b4))
* not throwing exception if backup private key cannot be found ([ec84edc](https://github.com/BoltzExchange/boltz-backend/commit/ec84edc))
* output type of NewAddress ([ca52f9c](https://github.com/BoltzExchange/boltz-backend/commit/ca52f9c))
* race conditions in EventHandler ([9442a1e](https://github.com/BoltzExchange/boltz-backend/commit/9442a1e))
* tests after renaming event to status ([335cac3](https://github.com/BoltzExchange/boltz-backend/commit/335cac3))
* tests in different timezones ([af283ec](https://github.com/BoltzExchange/boltz-backend/commit/af283ec))


### Features

* abort swaps after expiration ([#123](https://github.com/BoltzExchange/boltz-backend/issues/123)) ([5879a3b](https://github.com/BoltzExchange/boltz-backend/commit/5879a3b))
* accept 0-conf for non RBF swap outputs ([#118](https://github.com/BoltzExchange/boltz-backend/issues/118)) ([66066ee](https://github.com/BoltzExchange/boltz-backend/commit/66066ee))
* add 0-conf limits to getPairs endpoint ([769b79f](https://github.com/BoltzExchange/boltz-backend/commit/769b79f))
* add list of images to builder script ([9a091f9](https://github.com/BoltzExchange/boltz-backend/commit/9a091f9))
* add script to stream Server-Sent events ([14c72bd](https://github.com/BoltzExchange/boltz-backend/commit/14c72bd))
* add timeoutBlockHeight to response of createReverseSwap ([14b8314](https://github.com/BoltzExchange/boltz-backend/commit/14b8314))
* improve Docker image build process ([1c5c627](https://github.com/BoltzExchange/boltz-backend/commit/1c5c627))



# [1.0.0-beta.2](https://github.com/BoltzExchange/boltz-backend/compare/v1.0.0-beta...v1.0.0-beta.2) (2019-05-14)


### Features

* detection of chain reorganizations ([#115](https://github.com/BoltzExchange/boltz-backend/issues/115)) ([2d6a40f](https://github.com/BoltzExchange/boltz-backend/commit/2d6a40f))
* more verbose events for accounting in the middleware ([#120](https://github.com/BoltzExchange/boltz-backend/issues/120)) ([8c1e64d](https://github.com/BoltzExchange/boltz-backend/commit/8c1e64d))



# [1.0.0-beta](https://github.com/BoltzExchange/boltz-backend/compare/v0.0.2...v1.0.0-beta) (2019-04-27)


### Bug Fixes

* catch LND errors when paying invoices ([#94](https://github.com/BoltzExchange/boltz-backend/issues/94)) ([4b402a6](https://github.com/BoltzExchange/boltz-backend/commit/4b402a6))
* claim swap after one confirmation ([#26](https://github.com/BoltzExchange/boltz-backend/issues/26)) ([bee35ea](https://github.com/BoltzExchange/boltz-backend/commit/bee35ea))
* config file parsing ([#90](https://github.com/BoltzExchange/boltz-backend/issues/90)) ([d82f518](https://github.com/BoltzExchange/boltz-backend/commit/d82f518))
* correct timeout block height in map ([#89](https://github.com/BoltzExchange/boltz-backend/issues/89)) ([f6a2579](https://github.com/BoltzExchange/boltz-backend/commit/f6a2579))
* could not find route for private channels ([#112](https://github.com/BoltzExchange/boltz-backend/issues/112)) ([1eeb4ee](https://github.com/BoltzExchange/boltz-backend/commit/1eeb4ee))
* emit invoice.paid event only if request succeeded ([#70](https://github.com/BoltzExchange/boltz-backend/issues/70)) ([5b41412](https://github.com/BoltzExchange/boltz-backend/commit/5b41412))
* error message of broadcasting refund transactions ([#80](https://github.com/BoltzExchange/boltz-backend/issues/80)) ([1e1cbf7](https://github.com/BoltzExchange/boltz-backend/commit/1e1cbf7))
* fee calculation ([#111](https://github.com/BoltzExchange/boltz-backend/issues/111)) ([575b4a5](https://github.com/BoltzExchange/boltz-backend/commit/575b4a5))
* fee calculation of reverse swaps ([#101](https://github.com/BoltzExchange/boltz-backend/issues/101)) ([aced8f5](https://github.com/BoltzExchange/boltz-backend/commit/aced8f5))
* improve logging of reverse swaps ([#66](https://github.com/BoltzExchange/boltz-backend/issues/66)) ([cd700c5](https://github.com/BoltzExchange/boltz-backend/commit/cd700c5))
* outputs to wallet table relation ([aa36b76](https://github.com/BoltzExchange/boltz-backend/commit/aa36b76))
* rate of reverse swaps ([#64](https://github.com/BoltzExchange/boltz-backend/issues/64)) ([c5466e6](https://github.com/BoltzExchange/boltz-backend/commit/c5466e6))
* remove last usages of Networks.ts file ([#30](https://github.com/BoltzExchange/boltz-backend/issues/30)) ([ba02a69](https://github.com/BoltzExchange/boltz-backend/commit/ba02a69))
* route hint list length check ([#113](https://github.com/BoltzExchange/boltz-backend/issues/113)) ([345d584](https://github.com/BoltzExchange/boltz-backend/commit/345d584))
* sending transaction on Litecoin ([358dc25](https://github.com/BoltzExchange/boltz-backend/commit/358dc25))
* set max fee to 100 sat per vbyte ([#82](https://github.com/BoltzExchange/boltz-backend/issues/82)) ([14a8b7d](https://github.com/BoltzExchange/boltz-backend/commit/14a8b7d))


### Features

* add additional field for fee of swap ([#84](https://github.com/BoltzExchange/boltz-backend/issues/84)) ([768f539](https://github.com/BoltzExchange/boltz-backend/commit/768f539))
* add BTCD fee estimator ([525e75f](https://github.com/BoltzExchange/boltz-backend/commit/525e75f))
* add channel balance to GetBalanceResponse ([#71](https://github.com/BoltzExchange/boltz-backend/issues/71)) ([c1af188](https://github.com/BoltzExchange/boltz-backend/commit/c1af188))
* add error to status of connected nodes ([#78](https://github.com/BoltzExchange/boltz-backend/issues/78)) ([fe4499d](https://github.com/BoltzExchange/boltz-backend/commit/fe4499d))
* add event for not payable invoices ([98bfa5c](https://github.com/BoltzExchange/boltz-backend/commit/98bfa5c))
* add fallback for pubrawblock ZMQ filter ([dd30930](https://github.com/BoltzExchange/boltz-backend/commit/dd30930))
* add gRPC method to estimate fee ([985cb10](https://github.com/BoltzExchange/boltz-backend/commit/985cb10))
* add gRPC method to send coins ([0cb6f51](https://github.com/BoltzExchange/boltz-backend/commit/0cb6f51))
* add gRPC stream for refunds of reverse swaps ([e795c64](https://github.com/BoltzExchange/boltz-backend/commit/e795c64))
* add gRPC stream for static channel backups ([6dc545b](https://github.com/BoltzExchange/boltz-backend/commit/6dc545b))
* add inbound balance to getbalance ([#97](https://github.com/BoltzExchange/boltz-backend/issues/97)) ([55401c1](https://github.com/BoltzExchange/boltz-backend/commit/55401c1))
* add inquirer as optional input for boltz-cli ([#24](https://github.com/BoltzExchange/boltz-backend/issues/24)) ([8a61628](https://github.com/BoltzExchange/boltz-backend/commit/8a61628))
* add lock to wallet to avoid double spending ([49232e8](https://github.com/BoltzExchange/boltz-backend/commit/49232e8))
* automatically refund failed swaps ([#73](https://github.com/BoltzExchange/boltz-backend/issues/73)) ([a7291a8](https://github.com/BoltzExchange/boltz-backend/commit/a7291a8))
* check whether invoice can be routed before creating swap ([be1600b](https://github.com/BoltzExchange/boltz-backend/commit/be1600b))
* detect multiple UTXOs per output ([c1d8b09](https://github.com/BoltzExchange/boltz-backend/commit/c1d8b09))
* emit event when invoice not settled ([#60](https://github.com/BoltzExchange/boltz-backend/issues/60)) ([69c5d99](https://github.com/BoltzExchange/boltz-backend/commit/69c5d99))
* expose LND REST API on simnet image ([86bc8d1](https://github.com/BoltzExchange/boltz-backend/commit/86bc8d1))
* mark transactions as spent ([635b9b6](https://github.com/BoltzExchange/boltz-backend/commit/635b9b6))
* **grpc:** add preimage to invoice settled events ([#65](https://github.com/BoltzExchange/boltz-backend/issues/65)) ([3abca51](https://github.com/BoltzExchange/boltz-backend/commit/3abca51))
* reconnect to lnd if streaming calls are disconnected [#48](https://github.com/BoltzExchange/boltz-backend/issues/48) ([#59](https://github.com/BoltzExchange/boltz-backend/issues/59)) ([7e524f5](https://github.com/BoltzExchange/boltz-backend/commit/7e524f5))
* **docker:** add prepared simnet environment ([726f6f5](https://github.com/BoltzExchange/boltz-backend/commit/726f6f5))
* send all funds of wallet ([#108](https://github.com/BoltzExchange/boltz-backend/issues/108)) ([63bcf46](https://github.com/BoltzExchange/boltz-backend/commit/63bcf46))
* switch from BTCD to Bitcoin Core ([f9efe7a](https://github.com/BoltzExchange/boltz-backend/commit/f9efe7a))
* **grpc:** add events to SubscribeTransactions ([49809bb](https://github.com/BoltzExchange/boltz-backend/commit/49809bb))
* **grpc:** add timeout height to swap commands ([#57](https://github.com/BoltzExchange/boltz-backend/issues/57)) ([61c7d44](https://github.com/BoltzExchange/boltz-backend/commit/61c7d44))
* **grpc:** improve CreateReverseSwap response ([134d43b](https://github.com/BoltzExchange/boltz-backend/commit/134d43b))
* **grpc:** subscribe to confirmed transactions ([e029823](https://github.com/BoltzExchange/boltz-backend/commit/e029823))
* **grpc:** subscribe to paid invoices ([9290e38](https://github.com/BoltzExchange/boltz-backend/commit/9290e38))
* **wallet:** check unconfirmed UTXOs on startup ([7aeb034](https://github.com/BoltzExchange/boltz-backend/commit/7aeb034))


### Performance Improvements

* more efficient handling of gRPC subscriptions ([402c764](https://github.com/BoltzExchange/boltz-backend/commit/402c764))



## [0.0.2](https://github.com/BoltzExchange/boltz-backend/compare/v0.0.1...v0.0.2) (2018-12-03)


### Bug Fixes

* database error on startup ([#5](https://github.com/BoltzExchange/boltz-backend/issues/5)) ([2113989](https://github.com/BoltzExchange/boltz-backend/commit/2113989))
* export detectSwap method ([#22](https://github.com/BoltzExchange/boltz-backend/issues/22)) ([6b4f211](https://github.com/BoltzExchange/boltz-backend/commit/6b4f211))


### Features

* fee estimation for claim and refund transactions ([#4](https://github.com/BoltzExchange/boltz-backend/issues/4)) ([75afad8](https://github.com/BoltzExchange/boltz-backend/commit/75afad8))
* **grpc:** add broadcasting of transactions ([#6](https://github.com/BoltzExchange/boltz-backend/issues/6)) ([5950bad](https://github.com/BoltzExchange/boltz-backend/commit/5950bad))
* **grpc:** add retrieving transaction from its hash ([#20](https://github.com/BoltzExchange/boltz-backend/issues/20)) ([cb5d54c](https://github.com/BoltzExchange/boltz-backend/commit/cb5d54c))
* **grpc:** add timeout to createswap ([#21](https://github.com/BoltzExchange/boltz-backend/issues/21)) ([bf4e1d9](https://github.com/BoltzExchange/boltz-backend/commit/bf4e1d9))



## 0.0.1 (2018-11-26)



