## [2.4.2-beta](https://github.com/BoltzExchange/boltz-backend/compare/v2.4.1...v2.4.2-beta) (2020-10-09)


### Bug Fixes

* update to LND v0.11.1 ([acff8e7](https://github.com/BoltzExchange/boltz-backend/commit/acff8e73a7b7ced7aec89c5148565fd0c53be46b))



## [2.4.1-beta](https://github.com/BoltzExchange/boltz-backend/compare/v2.4.0...v2.4.1-beta) (2020-09-22)


### Features

* add 10 percent buffer to CLTV expiry for cross chain Reverse Swaps ([97d7ee3](https://github.com/BoltzExchange/boltz-backend/commit/97d7ee3d66420ee7ee20eec5581f1fd3b1854fae))



# [2.4.0](https://github.com/BoltzExchange/boltz-backend/compare/v2.3.0...v2.4.0) (2020-08-18)


### Bug Fixes

* relax invoice check in auto Channel Creation mode ([caa4fc2](https://github.com/BoltzExchange/boltz-backend/commit/caa4fc213b75ec294beb96d3de452d00b8b2373c))


### Features

* add chain client and LND version checks ([25a0417](https://github.com/BoltzExchange/boltz-backend/commit/25a0417b230d01d18bec29988d8a4478ab86b757))
* send notifications when LND stream errors ([#217](https://github.com/BoltzExchange/boltz-backend/issues/217)) ([f7ba741](https://github.com/BoltzExchange/boltz-backend/commit/f7ba7413353da3aed87b340fedec58b453de94ce))
* try to connect by public key before opening channel ([6a32a72](https://github.com/BoltzExchange/boltz-backend/commit/6a32a728a39c6322b2fd00465dcdab3949770578))



# [2.3.0](https://github.com/BoltzExchange/boltz-backend/compare/v2.1.0-beta...v2.3.0) (2020-07-05)


### Bug Fixes

* add scanned block height to GetInfo ([#183](https://github.com/BoltzExchange/boltz-backend/issues/183)) ([440cd5d](https://github.com/BoltzExchange/boltz-backend/commit/440cd5d3abb08c36b3fe94c9e5ed03ff29a5c0ad))
* broken link in docs ([fc23163](https://github.com/BoltzExchange/boltz-backend/commit/fc231639702c104e0f6109d7f2204d0888f87fcf))
* Channel Creation Discord messages ([f8925b3](https://github.com/BoltzExchange/boltz-backend/commit/f8925b3f7a3681b537a8833cfff2346ed48f7d2c))
* cross chain Channel Creations ([ee892d7](https://github.com/BoltzExchange/boltz-backend/commit/ee892d7872feb09389a5f916244c14e39af774d6))
* failed transactions included in pending swaps ([#184](https://github.com/BoltzExchange/boltz-backend/issues/184)) ([07f407b](https://github.com/BoltzExchange/boltz-backend/commit/07f407bafe40bb849863211ac555d3c34b471ce8))
* handle OP_RETURN outputs ([aea1683](https://github.com/BoltzExchange/boltz-backend/commit/aea1683183a7990617d8c100e17428bec96c34ff))
* invoice decoding library ([#180](https://github.com/BoltzExchange/boltz-backend/issues/180)) ([8a1dc47](https://github.com/BoltzExchange/boltz-backend/commit/8a1dc479a03b0aeb61aacf7b7feb2c95233f013c))
* invoice expiry check ([3624278](https://github.com/BoltzExchange/boltz-backend/commit/362427891ae401a22ae42be7c5228a9b5ce4a559))
* LND race conditions ([6f0aa8f](https://github.com/BoltzExchange/boltz-backend/commit/6f0aa8fdaacef604c9cbbaf8e1dd8c1f3df25167))
* minor fixes ([44f3144](https://github.com/BoltzExchange/boltz-backend/commit/44f314432485cc7740808c71f754034bfe4e988e))
* pay invoice if set after transaction was sent ([297e140](https://github.com/BoltzExchange/boltz-backend/commit/297e140a946d21fa4e13ad09b5ef45a6ccae16c2))
* peer online database query ([b1f7163](https://github.com/BoltzExchange/boltz-backend/commit/b1f7163710b9633b603238343301649c7650647e))
* README.md update ([#199](https://github.com/BoltzExchange/boltz-backend/issues/199)) ([bbadb98](https://github.com/BoltzExchange/boltz-backend/commit/bbadb988b6cc0652b4f885a22c843a3b977abb6d))
* recreating filters on restarts ([ad918e3](https://github.com/BoltzExchange/boltz-backend/commit/ad918e3fad5e10f9d0952caadd9785d4cd12623b))
* Swap rate calculations ([accf2c8](https://github.com/BoltzExchange/boltz-backend/commit/accf2c87a0bcf13e0b87c2a7af302382824f1845))
* sweeping Ether ([d43a7e1](https://github.com/BoltzExchange/boltz-backend/commit/d43a7e1d5cf349e0b959aceaac8ebd0e47d3c299))
* Travis build ([5e875ec](https://github.com/BoltzExchange/boltz-backend/commit/5e875ec84de4e92b2724d9bacc5221047e6ab0c7))
* unit tests ([7ec9f1d](https://github.com/BoltzExchange/boltz-backend/commit/7ec9f1d9f2fb0bf6d100d6021c7cd47adb8b1726))
* update proto for LND version 0.9.0-beta ([b1477c7](https://github.com/BoltzExchange/boltz-backend/commit/b1477c7f286de57e8f2e9674148a0abd7722b90c))


### Features

* abandon Swaps with expired invoices ([e11312a](https://github.com/BoltzExchange/boltz-backend/commit/e11312ae1e036ca70baf539fa863a53c05a3f3fc))
* add "channel.created" event ([#204](https://github.com/BoltzExchange/boltz-backend/issues/204)) ([5666abf](https://github.com/BoltzExchange/boltz-backend/commit/5666abf0ec990dc68a24396fb01163c3ed532805))
* add channel creation logic ([f22fab7](https://github.com/BoltzExchange/boltz-backend/commit/f22fab7945a4ae7e365e764c62146a22de87aa50))
* add database version schema ([#205](https://github.com/BoltzExchange/boltz-backend/issues/205)) ([257119a](https://github.com/BoltzExchange/boltz-backend/commit/257119a166d849e1419b58eab35a5b1fa7d90f2e))
* add endpoint to query lockup transaction of swap ([c81986e](https://github.com/BoltzExchange/boltz-backend/commit/c81986ef4ac979df528de9a14db140b8b0f17fc0))
* add endpoint to query nodes ([0fa346f](https://github.com/BoltzExchange/boltz-backend/commit/0fa346fc6e94ec83bababc78124fe91cfee001a5))
* add Ether and ERC20 wallet ([e8a2444](https://github.com/BoltzExchange/boltz-backend/commit/e8a2444d138ee0f39d72627751de775be6b90026))
* add prepay minerfee Reverse Swap protocol ([62a517a](https://github.com/BoltzExchange/boltz-backend/commit/62a517ab8eed8b06e51ad5e4763619a38bbf0991))
* custom Discord notifications for Channel Creations ([eea7081](https://github.com/BoltzExchange/boltz-backend/commit/eea70811bbe5660587fd51a7bbbbe3de36db5869))
* improve logging of failed requests ([8f5bfdb](https://github.com/BoltzExchange/boltz-backend/commit/8f5bfdbe9fe80b509fc69f078138d509e8f84d33))
* invoice and channel object sanity checks ([09809b9](https://github.com/BoltzExchange/boltz-backend/commit/09809b90d9dc30500c0c997032b05daec3a5eead))
* set CLTV expiry of hold invoices ([e8e2591](https://github.com/BoltzExchange/boltz-backend/commit/e8e25912e3a42399f6ce4bcc1b0558e73f63e9e4))
* special error handling broadcasting refund transactions ([b953797](https://github.com/BoltzExchange/boltz-backend/commit/b9537970f04267acae9d35da47b81c6a7a3aa35b))



# [2.1.0-beta](https://github.com/BoltzExchange/boltz-backend/compare/v2.0.0-beta...v2.1.0-beta) (2020-01-14)


### Bug Fixes

* address and invoice encoding in LND Litecoin ([62e0bbb](https://github.com/BoltzExchange/boltz-backend/commit/62e0bbb5a1637b6e2145132089731e368b55ee7a))
* always use free port for ZMQ tests ([8eb6984](https://github.com/BoltzExchange/boltz-backend/commit/8eb6984ac7d4ec846046dbad4748be430af32aa1))
* calculation of enforced limits of LTC/BTC pair ([e874595](https://github.com/BoltzExchange/boltz-backend/commit/e87459515701168257c8ad39009c9d5b0acbffb9))
* edge case of swap event handling ([68f9387](https://github.com/BoltzExchange/boltz-backend/commit/68f9387d9c1fff0e0d77c942ce904090a57b927f))
* error printing of chain client during initialization ([7fe33bd](https://github.com/BoltzExchange/boltz-backend/commit/7fe33bdeedf091320ee2db3ebfce3aa5eefa5254))
* invoice decoding on testnet ([bf21052](https://github.com/BoltzExchange/boltz-backend/commit/bf210522f525770773da23f3a6c854a5eb433d1e))
* loading status of pending reverse swaps ([9104819](https://github.com/BoltzExchange/boltz-backend/commit/91048191a24e9f060aa170af1baf07e121b52693))
* message of backup command ([#131](https://github.com/BoltzExchange/boltz-backend/issues/131)) ([b5f1676](https://github.com/BoltzExchange/boltz-backend/commit/b5f1676cd3aa2400920bbeb7451ca4cc2ad883ea))
* minor fee calculation fixes ([9075469](https://github.com/BoltzExchange/boltz-backend/commit/9075469d604db9b7e0cd454121edd82d1ff8eae0))
* minor improvements ([c3f19b4](https://github.com/BoltzExchange/boltz-backend/commit/c3f19b4c79c6961d1e719aeae3c8af4d23a2f9a2))
* multiple messages of disk usage checker ([1af2887](https://github.com/BoltzExchange/boltz-backend/commit/1af2887f2cf68935e6d626ff13eec60f6c7667ed))
* normal cross chain swaps ([7072765](https://github.com/BoltzExchange/boltz-backend/commit/7072765443b58112a9bbabc5ad51b2d96fd89b7b))
* not throwing exception if backup private key cannot be found ([ec84edc](https://github.com/BoltzExchange/boltz-backend/commit/ec84edcbc469ff9dfe91a028d9938004ce1b2e31))
* output type of NewAddress ([ca52f9c](https://github.com/BoltzExchange/boltz-backend/commit/ca52f9c61a6630d157e78dbc55d032e274c14246))
* Python linting warnings ([a346829](https://github.com/BoltzExchange/boltz-backend/commit/a346829e13ddc876ef9317b52c9efa29d5188e8a))
* race conditions in EventHandler ([9442a1e](https://github.com/BoltzExchange/boltz-backend/commit/9442a1e06d3609405b18ce50fb9bba03e65f4891))
* tests after renaming event to status ([335cac3](https://github.com/BoltzExchange/boltz-backend/commit/335cac3a90cd34eecb61d08608a4f3ba65c50c01))
* tests in different timezones ([af283ec](https://github.com/BoltzExchange/boltz-backend/commit/af283ece5156351b070be4f99538392ad5f2b3cc))
* update commands for new reverse swaps ([41460c0](https://github.com/BoltzExchange/boltz-backend/commit/41460c0120c2491703560d8d214c92097383b826))


### Features

* abort swaps after expiration ([#123](https://github.com/BoltzExchange/boltz-backend/issues/123)) ([5879a3b](https://github.com/BoltzExchange/boltz-backend/commit/5879a3b0e5d2fcc1f3785cf34477fec8fe1ee47c))
* accept 0-conf for non RBF swap outputs ([#118](https://github.com/BoltzExchange/boltz-backend/issues/118)) ([66066ee](https://github.com/BoltzExchange/boltz-backend/commit/66066ee7f960a88453058561b5e5e7418c0a4d80))
* accept invoices with upper case letters ([#158](https://github.com/BoltzExchange/boltz-backend/issues/158)) ([d2f08d4](https://github.com/BoltzExchange/boltz-backend/commit/d2f08d45b79eafc16f5c778b687b11f590c2dde4))
* add 0-conf limits to getPairs endpoint ([769b79f](https://github.com/BoltzExchange/boltz-backend/commit/769b79f1e521ac7f6b9d7804e5e92c5de704ae56))
* add Dogecoin Core and Zcash Docker images ([9bec35d](https://github.com/BoltzExchange/boltz-backend/commit/9bec35da3d72a1ba885e03664e12be9f3841eb39))
* add ETA to TransactionMempool events ([3a3a29d](https://github.com/BoltzExchange/boltz-backend/commit/3a3a29df443172f6c32ce6038445e4211351cb7b))
* add list of images to builder script ([9a091f9](https://github.com/BoltzExchange/boltz-backend/commit/9a091f9272b04dc5b0c41a614d4e6821a840cdc7))
* add lockedfunds Discord command ([b034f25](https://github.com/BoltzExchange/boltz-backend/commit/b034f25ef81e40662404c9d91ea488c0ad1dacad))
* add memo to invoice of reverse swaps ([556513f](https://github.com/BoltzExchange/boltz-backend/commit/556513ffd4957a130da481fad1c6420ab42c2400))
* add notification when disk is getting full ([#146](https://github.com/BoltzExchange/boltz-backend/issues/146)) ([47843ba](https://github.com/BoltzExchange/boltz-backend/commit/47843ba1c9aec0b481b128cc84b974e141feae34))
* add pendingswaps Discord command ([f192ea2](https://github.com/BoltzExchange/boltz-backend/commit/f192ea2260fb4488038d79243c8860b9c9e4500f))
* add script to fund Boltz wallet ([#141](https://github.com/BoltzExchange/boltz-backend/issues/141)) ([c0ff5ca](https://github.com/BoltzExchange/boltz-backend/commit/c0ff5cafb691b6336114230869d45c86f1fedb5f))
* add script to stream Server-Sent events ([14c72bd](https://github.com/BoltzExchange/boltz-backend/commit/14c72bd289d4ee7dd4161c28d560eb781257fef7))
* add support for Dogecoin ([2c9e9d6](https://github.com/BoltzExchange/boltz-backend/commit/2c9e9d689b3dbc64d922a61b06534a1e3a0c28ce))
* add timeoutBlockHeight to response of createReverseSwap ([14b8314](https://github.com/BoltzExchange/boltz-backend/commit/14b831473b200abb0b446f247aacbed120e65702))
* add timeouts of hold reverse swaps ([f4aae82](https://github.com/BoltzExchange/boltz-backend/commit/f4aae827a2bf347a05bd6659ecf9999898b27f4c))
* add tool to analyze failed swaps ([#157](https://github.com/BoltzExchange/boltz-backend/issues/157)) ([9138f3b](https://github.com/BoltzExchange/boltz-backend/commit/9138f3b24c853ec3c8178d52ef919e5df9b5ebcf))
* add usage of single commands to Discord help ([63c6e8c](https://github.com/BoltzExchange/boltz-backend/commit/63c6e8ca1a18ece9d76340b10d064e526ce7989f))
* add version API endpoint ([277d2c7](https://github.com/BoltzExchange/boltz-backend/commit/277d2c7d4595ca56ede18019eccd50bbfda31460))
* add withdraw Discord command ([#142](https://github.com/BoltzExchange/boltz-backend/issues/142)) ([6fdc4d4](https://github.com/BoltzExchange/boltz-backend/commit/6fdc4d4bd9f34459561b8fc6f5427306b0bd0fb7))
* build LND docker image with all available tags ([d3ddba0](https://github.com/BoltzExchange/boltz-backend/commit/d3ddba0cc9324823944be4c053cc4bfc17a8d107))
* cancel invoices of expired reverse swaps ([e6aef4f](https://github.com/BoltzExchange/boltz-backend/commit/e6aef4f8789fc2307d26425ba0ba9d431e5093b9))
* default status for swaps ([531fd39](https://github.com/BoltzExchange/boltz-backend/commit/531fd39920ccc749af0f3cc10e2ec756dced6b65))
* improve Docker image build process ([1c5c627](https://github.com/BoltzExchange/boltz-backend/commit/1c5c6271b33a202ac1fc7cd0b56b44b2efe1d75d))
* make timeouts configurable on a per chain basis ([#153](https://github.com/BoltzExchange/boltz-backend/issues/153)) ([14f7b80](https://github.com/BoltzExchange/boltz-backend/commit/14f7b8037218b50c5110eb5d76239450824549a2))
* raw transaction in events of reverse swaps ([46b8d25](https://github.com/BoltzExchange/boltz-backend/commit/46b8d25437497f74ad39dd44ecced3d84fd04ce0))
* remove Boltz wallet ([6946bf3](https://github.com/BoltzExchange/boltz-backend/commit/6946bf34b7bf746b73b7ab98a32253b7b6f8ef72))
* reverse swaps with hold invoices ([6936fc2](https://github.com/BoltzExchange/boltz-backend/commit/6936fc203b5fcb1cabbb28853f0b94eed71c0bb0))
* reword invoice memo ([#178](https://github.com/BoltzExchange/boltz-backend/issues/178)) ([fe7ca9d](https://github.com/BoltzExchange/boltz-backend/commit/fe7ca9d539aec581d0e35c3cd4cfbf9d75fc9f0c))
* show git commit hash in version ([#151](https://github.com/BoltzExchange/boltz-backend/issues/151)) ([f84a2f7](https://github.com/BoltzExchange/boltz-backend/commit/f84a2f7c303e5d5a17c2f5db666a1da60cfb9088))
* show onchainAmount in response of createreverseswap ([#161](https://github.com/BoltzExchange/boltz-backend/issues/161)) ([f1c784a](https://github.com/BoltzExchange/boltz-backend/commit/f1c784a7d1111c7f7d6ffe85d746753f5bde2427))
* use new reverse swap script ([82d8860](https://github.com/BoltzExchange/boltz-backend/commit/82d8860b86c8da9fc0cbb6e5f76d6a577f5f03f2))



# [1.0.0-beta.2](https://github.com/BoltzExchange/boltz-backend/compare/v1.0.0-beta...v1.0.0-beta.2) (2019-05-15)


### Features

* detection of chain reorganizations ([#115](https://github.com/BoltzExchange/boltz-backend/issues/115)) ([2d6a40f](https://github.com/BoltzExchange/boltz-backend/commit/2d6a40f0374b7c60bef5c1aaeb0a096317712333))
* more verbose events for accounting in the middleware ([#120](https://github.com/BoltzExchange/boltz-backend/issues/120)) ([8c1e64d](https://github.com/BoltzExchange/boltz-backend/commit/8c1e64d5b3a359c2f7513962047a8ddc7125015d))



# [1.0.0-beta](https://github.com/BoltzExchange/boltz-backend/compare/v0.0.2...v1.0.0-beta) (2019-04-29)


### Bug Fixes

* catch LND errors when paying invoices ([#94](https://github.com/BoltzExchange/boltz-backend/issues/94)) ([4b402a6](https://github.com/BoltzExchange/boltz-backend/commit/4b402a60bd7db703be3455108c36dcdf8b596694))
* claim swap after one confirmation ([#26](https://github.com/BoltzExchange/boltz-backend/issues/26)) ([bee35ea](https://github.com/BoltzExchange/boltz-backend/commit/bee35eac72e4669705fa1c40fa1b58f3b70f3b4e))
* config file parsing ([#90](https://github.com/BoltzExchange/boltz-backend/issues/90)) ([d82f518](https://github.com/BoltzExchange/boltz-backend/commit/d82f5187b2f0a4071201ee17fd3c9d70b1ece04c))
* correct timeout block height in map ([#89](https://github.com/BoltzExchange/boltz-backend/issues/89)) ([f6a2579](https://github.com/BoltzExchange/boltz-backend/commit/f6a2579072ab2adbeab0d612be5a30ce20e1719e))
* could not find route for private channels ([#112](https://github.com/BoltzExchange/boltz-backend/issues/112)) ([1eeb4ee](https://github.com/BoltzExchange/boltz-backend/commit/1eeb4ee715ee8248553c7478c3ba80ae3bf1c684))
* emit invoice.paid event only if request succeeded ([#70](https://github.com/BoltzExchange/boltz-backend/issues/70)) ([5b41412](https://github.com/BoltzExchange/boltz-backend/commit/5b41412b15c7bd3cf34ecc72b87e7b50755ff754))
* error message of broadcasting refund transactions ([#80](https://github.com/BoltzExchange/boltz-backend/issues/80)) ([1e1cbf7](https://github.com/BoltzExchange/boltz-backend/commit/1e1cbf78fdda72b9ce944e0f316213beeb4df55e))
* fee calculation ([#111](https://github.com/BoltzExchange/boltz-backend/issues/111)) ([575b4a5](https://github.com/BoltzExchange/boltz-backend/commit/575b4a5d47f1532977de6535ebc2e3188e2367a5))
* fee calculation of reverse swaps ([#101](https://github.com/BoltzExchange/boltz-backend/issues/101)) ([aced8f5](https://github.com/BoltzExchange/boltz-backend/commit/aced8f58d3ff9bfb59c04f91714b1f97664b86a6))
* improve logging of reverse swaps ([#66](https://github.com/BoltzExchange/boltz-backend/issues/66)) ([cd700c5](https://github.com/BoltzExchange/boltz-backend/commit/cd700c5a2eecfa29d54fc96cbd67d35380f6e0fe))
* outputs to wallet table relation ([aa36b76](https://github.com/BoltzExchange/boltz-backend/commit/aa36b768ed2ab044d2cdbf8a7bc167d982c898a4))
* rate of reverse swaps ([#64](https://github.com/BoltzExchange/boltz-backend/issues/64)) ([c5466e6](https://github.com/BoltzExchange/boltz-backend/commit/c5466e6a1be593d7fed4f663195233bc431abd50))
* remove last usages of Networks.ts file ([#30](https://github.com/BoltzExchange/boltz-backend/issues/30)) ([ba02a69](https://github.com/BoltzExchange/boltz-backend/commit/ba02a6946efd580bef7000433cffb27f1b36eba7))
* route hint list length check ([#113](https://github.com/BoltzExchange/boltz-backend/issues/113)) ([345d584](https://github.com/BoltzExchange/boltz-backend/commit/345d584cd0aca9aca82bd29bfa0e6a8875c34065))
* sending transaction on Litecoin ([358dc25](https://github.com/BoltzExchange/boltz-backend/commit/358dc252ad10b92663be13f2540e9257ee9d9981))
* set max fee to 100 sat per vbyte ([#82](https://github.com/BoltzExchange/boltz-backend/issues/82)) ([14a8b7d](https://github.com/BoltzExchange/boltz-backend/commit/14a8b7d1425582badcc46c4619e4319c78a5151e))


### Features

* add additional field for fee of swap ([#84](https://github.com/BoltzExchange/boltz-backend/issues/84)) ([768f539](https://github.com/BoltzExchange/boltz-backend/commit/768f539a3ade23b4fd4da3749631ed715784cd48))
* add BTCD fee estimator ([525e75f](https://github.com/BoltzExchange/boltz-backend/commit/525e75f56bc7fe8dba7601e58ea0e75540c0a2fd))
* add channel balance to GetBalanceResponse ([#71](https://github.com/BoltzExchange/boltz-backend/issues/71)) ([c1af188](https://github.com/BoltzExchange/boltz-backend/commit/c1af188bfee2148e2bddc5fe940029a3839955dd))
* add error to status of connected nodes ([#78](https://github.com/BoltzExchange/boltz-backend/issues/78)) ([fe4499d](https://github.com/BoltzExchange/boltz-backend/commit/fe4499de02ba5ba39fd5c13ec1a0e1cf2aba8569))
* add event for not payable invoices ([98bfa5c](https://github.com/BoltzExchange/boltz-backend/commit/98bfa5c585ec731cc40f3535fcb33dc0854c821d))
* add fallback for pubrawblock ZMQ filter ([dd30930](https://github.com/BoltzExchange/boltz-backend/commit/dd30930e6cbc9c341b6711000dde4e47a2fa3d5a))
* add gRPC method to estimate fee ([985cb10](https://github.com/BoltzExchange/boltz-backend/commit/985cb105b8e9a202495115dfd43b20efbe042e28))
* add gRPC method to send coins ([0cb6f51](https://github.com/BoltzExchange/boltz-backend/commit/0cb6f51720d961c7fc68a998f20df8cd59136eba))
* add gRPC stream for refunds of reverse swaps ([e795c64](https://github.com/BoltzExchange/boltz-backend/commit/e795c64e037fdca669ac2d18d71b0a2d7fcd0615))
* add gRPC stream for static channel backups ([6dc545b](https://github.com/BoltzExchange/boltz-backend/commit/6dc545be85825d7f66ae71dfa45c1ec81a03cc35))
* add inbound balance to getbalance ([#97](https://github.com/BoltzExchange/boltz-backend/issues/97)) ([55401c1](https://github.com/BoltzExchange/boltz-backend/commit/55401c1acf5c5cca32234053ca4514d7faab0a41))
* add inquirer as optional input for boltz-cli ([#24](https://github.com/BoltzExchange/boltz-backend/issues/24)) ([8a61628](https://github.com/BoltzExchange/boltz-backend/commit/8a616280da65851b3a04b9696e2db449ed4cfb5c))
* add lock to wallet to avoid double spending ([49232e8](https://github.com/BoltzExchange/boltz-backend/commit/49232e89f17906f89dad1fc557c784939684e3f9))
* automatically refund failed swaps ([#73](https://github.com/BoltzExchange/boltz-backend/issues/73)) ([a7291a8](https://github.com/BoltzExchange/boltz-backend/commit/a7291a89f5119e7a88a909932bca84c63b7892fa))
* check whether invoice can be routed before creating swap ([be1600b](https://github.com/BoltzExchange/boltz-backend/commit/be1600b3d39f452cc32c982a0109d8ef997634a1))
* detect multiple UTXOs per output ([c1d8b09](https://github.com/BoltzExchange/boltz-backend/commit/c1d8b094824690fe08e07364b524d75ae131b2a2))
* emit event when invoice not settled ([#60](https://github.com/BoltzExchange/boltz-backend/issues/60)) ([69c5d99](https://github.com/BoltzExchange/boltz-backend/commit/69c5d999dd135d23e99f07bc70c1df53fb61a1f5))
* expose LND REST API on simnet image ([86bc8d1](https://github.com/BoltzExchange/boltz-backend/commit/86bc8d1da046edc197fb7a055f5a9cd0435a5ca1))
* mark transactions as spent ([635b9b6](https://github.com/BoltzExchange/boltz-backend/commit/635b9b65775dad5b610cb08ffcd66a4dfd3a81dc))
* reconnect to lnd if streaming calls are disconnected [#48](https://github.com/BoltzExchange/boltz-backend/issues/48) ([#59](https://github.com/BoltzExchange/boltz-backend/issues/59)) ([7e524f5](https://github.com/BoltzExchange/boltz-backend/commit/7e524f537f24e8cb90b73cecb10d84338ed36c6f))
* send all funds of wallet ([#108](https://github.com/BoltzExchange/boltz-backend/issues/108)) ([63bcf46](https://github.com/BoltzExchange/boltz-backend/commit/63bcf460bbe50dd260d5b3c3b25dfd00c1f5a0cf))
* switch from BTCD to Bitcoin Core ([f9efe7a](https://github.com/BoltzExchange/boltz-backend/commit/f9efe7af1ad6894b6ad89eeb608a46ea25cc8990))
* **docker:** add prepared simnet environment ([726f6f5](https://github.com/BoltzExchange/boltz-backend/commit/726f6f5c9dc7a2463b4ebeccbc6a3c6034de81e4))
* **grpc:** add events to SubscribeTransactions ([49809bb](https://github.com/BoltzExchange/boltz-backend/commit/49809bb6fe99a1fe59ffc56792f9ffa44c9ae656))
* **grpc:** add preimage to invoice settled events ([#65](https://github.com/BoltzExchange/boltz-backend/issues/65)) ([3abca51](https://github.com/BoltzExchange/boltz-backend/commit/3abca515ebde699e7a8f9cfbee890bf870f2ea85))
* **grpc:** add timeout height to swap commands ([#57](https://github.com/BoltzExchange/boltz-backend/issues/57)) ([61c7d44](https://github.com/BoltzExchange/boltz-backend/commit/61c7d44d16be1c5163bf9833a881941396c8bca5))
* **grpc:** improve CreateReverseSwap response ([134d43b](https://github.com/BoltzExchange/boltz-backend/commit/134d43b5fe12620198ce8283e52f6ba7693ba142))
* **grpc:** subscribe to confirmed transactions ([e029823](https://github.com/BoltzExchange/boltz-backend/commit/e02982385226a9de0f6f22173cb19775a5342d56))
* **grpc:** subscribe to paid invoices ([9290e38](https://github.com/BoltzExchange/boltz-backend/commit/9290e386af6adf4db98b8338bc12fe9c1b5b5664))
* **wallet:** check unconfirmed UTXOs on startup ([7aeb034](https://github.com/BoltzExchange/boltz-backend/commit/7aeb034b80c80c9ee15c9d4a763a7c82adc14085))


### Performance Improvements

* more efficient handling of gRPC subscriptions ([402c764](https://github.com/BoltzExchange/boltz-backend/commit/402c764a88f759264ab6f65d5507fbb63fee5c2a))



## [0.0.2](https://github.com/BoltzExchange/boltz-backend/compare/v0.0.1...v0.0.2) (2018-12-03)


### Bug Fixes

* database error on startup ([#5](https://github.com/BoltzExchange/boltz-backend/issues/5)) ([2113989](https://github.com/BoltzExchange/boltz-backend/commit/2113989276df56d30924d87e122cb47cf620d138))
* export detectSwap method ([#22](https://github.com/BoltzExchange/boltz-backend/issues/22)) ([6b4f211](https://github.com/BoltzExchange/boltz-backend/commit/6b4f2110f31afb65dccf5bf5f1e25fd81aaab319))


### Features

* **grpc:** add broadcasting of transactions ([#6](https://github.com/BoltzExchange/boltz-backend/issues/6)) ([5950bad](https://github.com/BoltzExchange/boltz-backend/commit/5950bad1e9948ef11f9aa25f7debafb58b1f44ce))
* **grpc:** add retrieving transaction from its hash ([#20](https://github.com/BoltzExchange/boltz-backend/issues/20)) ([cb5d54c](https://github.com/BoltzExchange/boltz-backend/commit/cb5d54c47c2dcfd2de14117319944e27d14c4b01))
* **grpc:** add timeout to createswap ([#21](https://github.com/BoltzExchange/boltz-backend/issues/21)) ([bf4e1d9](https://github.com/BoltzExchange/boltz-backend/commit/bf4e1d92f24e74a5485fb26a2177d85c84d6637c))
* fee estimation for claim and refund transactions ([#4](https://github.com/BoltzExchange/boltz-backend/issues/4)) ([75afad8](https://github.com/BoltzExchange/boltz-backend/commit/75afad840d801eb087f2a6229f5b3f8d87e5232a))



## 0.0.1 (2018-11-26)



