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



