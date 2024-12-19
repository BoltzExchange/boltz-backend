# Changelog

All notable changes to this project will be documented in this file. See [conventional commits](https://www.conventionalcommits.org/) for commit guidelines.

---
## [3.9.0](https://github.com/BoltzExchange/boltz-backend/compare/v3.8.1..v3.9.0) - 2024-12-19

### Bug Fixes

- skip transaction confirmed swap update when succeeded - ([9098457](https://github.com/BoltzExchange/boltz-backend/commit/90984579e3ceed1926cf04d79b21c2fb5d964bfe))
- valid use of required swagger properties - ([f766714](https://github.com/BoltzExchange/boltz-backend/commit/f7667149e032066cba57926ba4acc8156c7179f2))
- set failureReason to null when invoice is paid (#733) - ([a5bdb00](https://github.com/BoltzExchange/boltz-backend/commit/a5bdb0005f65545db914f42151d2419b614605dd))
- CLN routing hints (#736) - ([2adbe5e](https://github.com/BoltzExchange/boltz-backend/commit/2adbe5e5aa7bfef7c07117bdace63e0fba13c5e3))
- CLN invoice payment fee (#742) - ([51e03ca](https://github.com/BoltzExchange/boltz-backend/commit/51e03cab16fcd7747e65f6d55876a6070499800b))

### Documentation

- add library and referral section (#745) - ([30f34d0](https://github.com/BoltzExchange/boltz-backend/commit/30f34d0bee8449bbeff6961d6a983f6eb5ad88a5))
- minor rewording of library section description (#750) - ([8a03aa8](https://github.com/BoltzExchange/boltz-backend/commit/8a03aa89984b1f52082d46e0fca554c4b90364d9))

### Features

- unsubscribe from swap ids in WebSocket (#730) - ([d273c04](https://github.com/BoltzExchange/boltz-backend/commit/d273c04388478c0eab4c9cf61978a6fd8869d25f))
- transaction rebroadcaster (#732) - ([bdf43a6](https://github.com/BoltzExchange/boltz-backend/commit/bdf43a6494c3ed9c59c5815d3ffbc23401c362b5))
- gRPC stop command (#738) - ([2dc7b7d](https://github.com/BoltzExchange/boltz-backend/commit/2dc7b7df309ec044638f3f70bf158ea3b349e17e))
- batch sweep EVM currencies - ([3eb8acb](https://github.com/BoltzExchange/boltz-backend/commit/3eb8acbfc5973c21ffc491e0532847847e5d25bd))
- support multiple contract versions (#739) - ([4649072](https://github.com/BoltzExchange/boltz-backend/commit/4649072ab7445722f7153c8d453463fc7c0c577e))
- batch claim Chain Swaps (#741) - ([8978a59](https://github.com/BoltzExchange/boltz-backend/commit/8978a592d501afed31fc0999ffd6c877c6a02557))
- coop claim Chain Swaps that send on EVM (#743) - ([33f058c](https://github.com/BoltzExchange/boltz-backend/commit/33f058cb1fd805f867a9d9b6e8dc1167a1bd04b5))

### Miscellaneous Chores

- bump sidecar version to v3.8.1 - ([4c7063c](https://github.com/BoltzExchange/boltz-backend/commit/4c7063c218d974d1f0831baf284cf13e7612c011))
- minor dependency updates (#729) - ([3e41c1c](https://github.com/BoltzExchange/boltz-backend/commit/3e41c1c2160c1400ac9e95f6f13cca9c5d60d54b))
- bump swagger-ui version - ([ac9e1d0](https://github.com/BoltzExchange/boltz-backend/commit/ac9e1d0981ae850841a932d09961bf7f2f5933bc))
- update Docker images (#735) - ([135f55b](https://github.com/BoltzExchange/boltz-backend/commit/135f55b62b4c917ea488194c3c8ab0de0908723a))
- bump path-to-regexp and express (#737) - ([33f5bb4](https://github.com/BoltzExchange/boltz-backend/commit/33f5bb41d86dd5f28230d418843092324361e353))
- minor clippy fixes - ([63ceb68](https://github.com/BoltzExchange/boltz-backend/commit/63ceb68866c89a02e9637350af5d6d6a0057e8f6))
- bump CLN to v24.11 (#746) - ([99f44a7](https://github.com/BoltzExchange/boltz-backend/commit/99f44a728fd882fb9a60eb6c119b180bebce2f28))
- bump max sidecar connect attempts - ([2e5fe24](https://github.com/BoltzExchange/boltz-backend/commit/2e5fe2440b54d0b6c864a0db7a9ce0506d06d59f))
- minor dependency bumps - ([1629b7c](https://github.com/BoltzExchange/boltz-backend/commit/1629b7c9300ca7389ce20e3771ed27107b8bd8a3))
- harden refunds - ([58aa2dc](https://github.com/BoltzExchange/boltz-backend/commit/58aa2dce6cf9831dbe1befeae62f75870fe4d71e))
- bump LND to v0.18.4 (#748) - ([9d31d87](https://github.com/BoltzExchange/boltz-backend/commit/9d31d8793c2ba5fedc7517d862bf7c82a835fc48))
- discount EVM server claims - ([938becc](https://github.com/BoltzExchange/boltz-backend/commit/938becc5e9cf7fb22ae671595807d7221c0b1f79))
- bump version to v3.9.0 - ([ce97285](https://github.com/BoltzExchange/boltz-backend/commit/ce97285424c6c72c5382ff211944b2aa54bda483))
- bump version in Swagger spec - ([0daed0d](https://github.com/BoltzExchange/boltz-backend/commit/0daed0d9f2d74348f26d46d69fbf6d7616bfdc91))

---
## [3.8.1](https://github.com/BoltzExchange/boltz-backend/compare/v3.8.0..v3.8.1) - 2024-11-28

### Bug Fixes

- config parsing with defaults - ([c0886a9](https://github.com/BoltzExchange/boltz-backend/commit/c0886a95ddfa6b80c3a90b0fecc9619184fb7c7f))
- Core wallet unconfirmed classification - ([09c70c5](https://github.com/BoltzExchange/boltz-backend/commit/09c70c555655809392a04647aa5e8bff6abd4645))
- wording of limit exceeded error - ([be0786b](https://github.com/BoltzExchange/boltz-backend/commit/be0786ba77a2d0926c012e833d5dcc342c704f80))
- abandon failed Webhooks when status is not included (#717) - ([54223af](https://github.com/BoltzExchange/boltz-backend/commit/54223afb85ecef187dcda633325400dbddcc14e3))
- bolt12 invoice pay status (#722) - ([8dca13c](https://github.com/BoltzExchange/boltz-backend/commit/8dca13c3daa8891b9ceea6a17230aef85ca507fd))
- chunk batch claim transactions (#725) - ([c1372b9](https://github.com/BoltzExchange/boltz-backend/commit/c1372b93373d045cc85039d5ba75c9b811f36ab5))

### Documentation

- BOLT12 offer and BIP-353 fetching (#711) - ([cddd661](https://github.com/BoltzExchange/boltz-backend/commit/cddd661aa1cb1a5760e37d3749c6a176045fc90b))
- BOLT12 misc enhancements (#712) - ([1ab9de7](https://github.com/BoltzExchange/boltz-backend/commit/1ab9de795a692785a22654e86a5f797456d4e63d))
- EVM clarifications - ([fc0f47b](https://github.com/BoltzExchange/boltz-backend/commit/fc0f47b62fe74b5052e5145328f61c8d207c110d))
- remove "RSK Testnet Only" hint (#718) - ([0b24836](https://github.com/BoltzExchange/boltz-backend/commit/0b2483625ddb64223676ca35bb01584e8394020b))

### Features

- gzip compression for CLN SCB backups (#706) - ([42d1330](https://github.com/BoltzExchange/boltz-backend/commit/42d1330f25faf7605bf66c71cbc0c9346460a903))
- 0-conf Prometheus metrics (#713) - ([bb1a42f](https://github.com/BoltzExchange/boltz-backend/commit/bb1a42fc9adba2fcfc8c86d7cbedbfee7f8490a3))
- get status of pending CLN invoices on startup (#714) - ([776613d](https://github.com/BoltzExchange/boltz-backend/commit/776613dc1fbbe45ad8193d90e3b27cc73ee7f233))
- save preimage of Submarine Swaps in database - ([2357297](https://github.com/BoltzExchange/boltz-backend/commit/235729740e18bdff1a128773f1a1583ae5e6368e))
- preimage endpoint for Submarine Swaps - ([2638f0a](https://github.com/BoltzExchange/boltz-backend/commit/2638f0ae675e8a355ee5986c8abfe5e2df8ed3bd))
- Liquid 0-conf checks via API (#721) - ([69511de](https://github.com/BoltzExchange/boltz-backend/commit/69511de1c6a794a18582ca780cec3517fe984a10))
- un-route-able nodes config - ([43e5c48](https://github.com/BoltzExchange/boltz-backend/commit/43e5c483d3f1e5c15c5072f28763e2bf839ce3a9))
- allow cooperative refunds with pending payments - ([ea4c827](https://github.com/BoltzExchange/boltz-backend/commit/ea4c827f254f3af3ac64b1d94a599aa6308d6b0e))

### Miscellaneous Chores

- update changelog for v3.8.0 - ([6131ab9](https://github.com/BoltzExchange/boltz-backend/commit/6131ab92dfeb6c9497929725c737edc15fffec53))
- fix fee clalculation for BOLT12 invoices - ([2aa6820](https://github.com/BoltzExchange/boltz-backend/commit/2aa6820fc4db4314faaff35560300085ab292793))
- more verbose logging in ElementsWrapper - ([3408300](https://github.com/BoltzExchange/boltz-backend/commit/3408300e52e67831fb0e4c57ae25e256d2fc717a))
- relax sidecar production version check - ([26262e4](https://github.com/BoltzExchange/boltz-backend/commit/26262e43e2733b44e37ed26446a2e081020c4795))
- trace deprecations in Docker container - ([607331c](https://github.com/BoltzExchange/boltz-backend/commit/607331c2524116080be956950c1f13b4f83f6b07))
- minor logging improvements - ([3c9e311](https://github.com/BoltzExchange/boltz-backend/commit/3c9e3113015fa9f9060204af31c3ab0282d44542))
- bump cross-spawn from 7.0.3 to 7.0.6 (#726) - ([41979d9](https://github.com/BoltzExchange/boltz-backend/commit/41979d989622606809ff55acac7a86718a2f78d8))
- fix minor logging typo - ([c6b0f09](https://github.com/BoltzExchange/boltz-backend/commit/c6b0f097efc58204da9a577c4fd3a2200750db7f))
- bump version to v3.8.1 - ([46b591c](https://github.com/BoltzExchange/boltz-backend/commit/46b591ca83c9c28a9966ac5818f6fa3731404692))

---
## [3.8.0](https://github.com/BoltzExchange/boltz-backend/compare/v3.7.3..v3.8.0) - 2024-11-04

### Bug Fixes

- mattermost alert channel selection - ([14c9791](https://github.com/BoltzExchange/boltz-backend/commit/14c97918645ee1774ebffc643a9e813838b38e21))
- revert axum prometheus collector update - ([ba95034](https://github.com/BoltzExchange/boltz-backend/commit/ba95034017b3cd7f9b980a92a44b900881dad4d3))
- show lockup failure details only when status is lockup failed (#683) - ([6433170](https://github.com/BoltzExchange/boltz-backend/commit/643317054f48804ed6ba3618c8a8d05ff9b3331b))
- set rate for Taproot only pairs (#686) - ([ebb3a18](https://github.com/BoltzExchange/boltz-backend/commit/ebb3a18dab77a3954e28b129f4e0fb08d9f0a238))
- 0-conf disabled alerts triggering every block (#689) - ([3b7344c](https://github.com/BoltzExchange/boltz-backend/commit/3b7344c0880594a5ee6441d25ea06cafe52f3c6d))
- race condition sending chain swap lockup twice - ([cefe35b](https://github.com/BoltzExchange/boltz-backend/commit/cefe35b39c3c804790e0a76ab92b41aa94c29940))
- do not crash when leftover batch claim fails - ([94aa167](https://github.com/BoltzExchange/boltz-backend/commit/94aa167dc6d5f42fc566fd73cb9e2e3cc1d8ec0f))
- CLN bolt12 invoice and offer destination parsing (#697) - ([9661cf0](https://github.com/BoltzExchange/boltz-backend/commit/9661cf09107d1410f81b7088623686880553170e))

### Documentation

- add missing status property to Webhook docs (#647) - ([54ba6b7](https://github.com/BoltzExchange/boltz-backend/commit/54ba6b70c2a8ba46895dd3f3e6c3ae24c6306ef4))
- API v1 hint clarification (#681) - ([0351ee2](https://github.com/BoltzExchange/boltz-backend/commit/0351ee200521eaaf8183ba1132f19ad3c2bb128e))

### Features

- **(mpay)** add pagination to mpay-list (#650) - ([000fd5c](https://github.com/BoltzExchange/boltz-backend/commit/000fd5c390afded66f774deb4d3b3f3bbf9a829d))
- add profiling for Node.js (#649) - ([23f5315](https://github.com/BoltzExchange/boltz-backend/commit/23f531591eecf9b7078ffe81798c08ca8b928303))
- save full pending lockup transactions (#651) - ([28b2343](https://github.com/BoltzExchange/boltz-backend/commit/28b2343abbaa1c0002e621947b63228480e7e530))
- check 0-conf transaction is accepted by all nodes - ([fba735c](https://github.com/BoltzExchange/boltz-backend/commit/fba735c0e1f98be0fb80218d8f3d8610eb4bdbe9))
- pending sweeps CLI command (#655) - ([df32696](https://github.com/BoltzExchange/boltz-backend/commit/df32696fbb13aca6144e99a1c01bdfdd352742d6))
- get paystatus from mpay plugin - ([5bc07c7](https://github.com/BoltzExchange/boltz-backend/commit/5bc07c7cddef5ce80244373e9ada7874f430111d))
- add open SSE streams metric - ([7358989](https://github.com/BoltzExchange/boltz-backend/commit/735898975ea095c28fd1d2a6887b75e3adfa1d1b))
- renegotiation of over- and underpaid chain swaps (#657) - ([b93f0e8](https://github.com/BoltzExchange/boltz-backend/commit/b93f0e8a0ef61c47b2160600d588294c75ae9d58))
- chain swap creation with no amount (#659) - ([b4c4447](https://github.com/BoltzExchange/boltz-backend/commit/b4c44478d4074ba6df01651012505d420de2a65b))
- check balance before creating swap (#663) - ([ce479fd](https://github.com/BoltzExchange/boltz-backend/commit/ce479fd1eb148bc90822c552b5e87a076c016199))
- different seed for EVM based chains (#667) - ([c560000](https://github.com/BoltzExchange/boltz-backend/commit/c56000066a5606f1e88f23efb98623a79098f1e2))
- custom invoice expiry for reverse swaps (#669) - ([d61eb05](https://github.com/BoltzExchange/boltz-backend/commit/d61eb05b6a0acc9520e74501605cd71565edbbdf))
- bolt12 support in submarine swaps (#664) - ([e6d9318](https://github.com/BoltzExchange/boltz-backend/commit/e6d9318c0b2dafccbad8a941a43902bf86965dd1))
- alerts via webhook call (#675) - ([4c98b7f](https://github.com/BoltzExchange/boltz-backend/commit/4c98b7f88c63607ea2acb8992ed0c8cafdbac9e8))
- buffer fetching swap updates before backend connects - ([4d4ee00](https://github.com/BoltzExchange/boltz-backend/commit/4d4ee006ca039b061e45a7fa429c897b1b753ddd))
- allow configuring pairs as legacy - ([1dec7eb](https://github.com/BoltzExchange/boltz-backend/commit/1dec7eb8a634962d2babb0940b64518b2c8a4fb3))
- improve deferred claim sweep commands (#684) - ([3a98e1b](https://github.com/BoltzExchange/boltz-backend/commit/3a98e1b335159344a0ad824a671ec5d4c48691f4))
- max 0-conf risk tolerance (#690) - ([d270edf](https://github.com/BoltzExchange/boltz-backend/commit/d270edf028a3a32bc377b04eb9a06de68b1d33a4))
- mempool rescan - ([cd4f4fb](https://github.com/BoltzExchange/boltz-backend/commit/cd4f4fb0a3ebb18226e363c0e159a9c29e77e640))
- Discount CT support (#691) - ([95e0f98](https://github.com/BoltzExchange/boltz-backend/commit/95e0f98d18d1ac2b51a953ba186473a85124ec3b))
- gRPC to change log level (#693) - ([5c95151](https://github.com/BoltzExchange/boltz-backend/commit/5c9515187b687299c418514e6b1175d98f044381))
- check mempool acceptance of public node for 0-conf - ([41fb616](https://github.com/BoltzExchange/boltz-backend/commit/41fb6166cbaa780305a6f51b57a7cbea0cc93a71))
- mempool.space liveliness check (#699) - ([823e05c](https://github.com/BoltzExchange/boltz-backend/commit/823e05c315cb7eafb8a6a121135bc74a7893cc6c))
- nicer invoice network check error (#704) - ([5719736](https://github.com/BoltzExchange/boltz-backend/commit/5719736b63ba6944fec36f98745bffe82be979bd))
- retry failed LND SCB backups - ([f602da4](https://github.com/BoltzExchange/boltz-backend/commit/f602da4ffe6288f57fdb86e6503c0f93da05d9a6))

### Miscellaneous Chores

- add CHANGELOG for v3.7.3 - ([0b3f513](https://github.com/BoltzExchange/boltz-backend/commit/0b3f513c0a794084617c9676eda737ca9ac1875e))
- bump elliptic from 6.5.6 to 6.5.7 (#646) - ([d0a6847](https://github.com/BoltzExchange/boltz-backend/commit/d0a6847e704ab152cb052a63ad9c1fa036379559))
- update Rust dependencies - ([d6d333d](https://github.com/BoltzExchange/boltz-backend/commit/d6d333d2d34a68c0f6b21f3e82f25a1ecf3c14d8))
- include libpq-dev in CLN image - ([d2d1236](https://github.com/BoltzExchange/boltz-backend/commit/d2d123645445cc97a43b7a148a432fb3e0e3ad54))
- reduce verbosity of WebSocket logging - ([f6834f7](https://github.com/BoltzExchange/boltz-backend/commit/f6834f740904a3aceccfd3eddbd7e228e9ecc53b))
- compile release script - ([03f2cf5](https://github.com/BoltzExchange/boltz-backend/commit/03f2cf5882ac0b8be57812f156755ca7cfbd48ce))
- sidecar production env fixes - ([a5a3f4c](https://github.com/BoltzExchange/boltz-backend/commit/a5a3f4c4eb7be4b90ea305e64a90f0e9ccd0354d))
- bump diesel from 2.2.2 to 2.2.3 in /boltzr (#654) - ([3808455](https://github.com/BoltzExchange/boltz-backend/commit/3808455f6679c26c458d2c5efbfa15620fd38b88))
- bump CLN to v24.08 (#658) - ([96dfc8a](https://github.com/BoltzExchange/boltz-backend/commit/96dfc8a81e7db255f7757799240ddef96889f895))
- minor dependency updates - ([8f0451e](https://github.com/BoltzExchange/boltz-backend/commit/8f0451ee5efe83d5443ed2507802295224330c54))
- update ZeroMQ dependency - ([a98a871](https://github.com/BoltzExchange/boltz-backend/commit/a98a871405a16b1b00beff34bb9d74f18c863cc0))
- bump express - ([e4568d1](https://github.com/BoltzExchange/boltz-backend/commit/e4568d14d53088d9cb71f7c478fde869796f096e))
- bump LND to v0.18.3 (#665) - ([7caac56](https://github.com/BoltzExchange/boltz-backend/commit/7caac56da55d5fb216929866abd057345bbd0c39))
- bump vulnerable dependencies (#666) - ([684d768](https://github.com/BoltzExchange/boltz-backend/commit/684d76843c0aad824a9a8dc77acf37969114668f))
- update CLN to v24.08.1 (#670) - ([47636e7](https://github.com/BoltzExchange/boltz-backend/commit/47636e72c22dea2b888ebda5a0b2895865205d06))
- bump tonic from 0.12.2 to 0.12.3 in /boltzr (#671) - ([3c898e7](https://github.com/BoltzExchange/boltz-backend/commit/3c898e7afdadf8bd0b35546a7ec7a1991802deab))
- bump max invoice description length (#673) - ([611bbff](https://github.com/BoltzExchange/boltz-backend/commit/611bbff6fd74892c9dfddd78334adc5a4d0f0ab3))
- bump Bitcoin Core to v28.0 (#676) - ([6e1e5d9](https://github.com/BoltzExchange/boltz-backend/commit/6e1e5d9f7d74fc837d2098ff6ec9e19734c9911d))
- update Rust dependencies - ([3ad484d](https://github.com/BoltzExchange/boltz-backend/commit/3ad484dc99d28e2a049b43eed7252c4b4453ea44))
- update NPM dependencies - ([8f5d97d](https://github.com/BoltzExchange/boltz-backend/commit/8f5d97dd51317229248530d1dede0500dc65bf35))
- log when calling alert endpoint - ([8bc2f79](https://github.com/BoltzExchange/boltz-backend/commit/8bc2f795f2c36d0c9a9775154a8efd373fc4b979))
- bump hold invoice plugin - ([45ba641](https://github.com/BoltzExchange/boltz-backend/commit/45ba6417923f82ae5127557a3357f82bdc09aa48))
- update dependencies - ([13f5792](https://github.com/BoltzExchange/boltz-backend/commit/13f57922e3fffdc29e47ad8f464464d518cbdba8))
- reorder boltzr gRPC service - ([20b9a74](https://github.com/BoltzExchange/boltz-backend/commit/20b9a74ea3ee8439ad266c61e7a3979831ec8d4b))
- bump CLN to v24.08.2 (#692) - ([7d8f2aa](https://github.com/BoltzExchange/boltz-backend/commit/7d8f2aae6694f7d29a3c3e571f71ca4144ee346e))
- switch to upstream bolt11 library (#694) - ([2109250](https://github.com/BoltzExchange/boltz-backend/commit/21092503b17b850ac25eb02756972f368d11d17f))
- update anvil to fix contract deployment (#701) - ([d953560](https://github.com/BoltzExchange/boltz-backend/commit/d95356042abaa22656275682bfa783baacc23e59))
- bump elliptic from 6.5.7 to 6.6.0 (#702) - ([e0fc15b](https://github.com/BoltzExchange/boltz-backend/commit/e0fc15b145a70a456b59e5b17ef3ad8117fadfe5))
- migrate to ESLint v9 - ([544deea](https://github.com/BoltzExchange/boltz-backend/commit/544deeaf18f691e2ee1085543a7b267dfc26990e))
- update NPM dependencies - ([3b6be88](https://github.com/BoltzExchange/boltz-backend/commit/3b6be8868315745053d6d8a93daa1561848d5589))
- update Rust dependencies - ([49f5dcb](https://github.com/BoltzExchange/boltz-backend/commit/49f5dcbebf96bd2ccb5426bb515841aee6fc6fec))
- bump version to v3.8.0 - ([5131797](https://github.com/BoltzExchange/boltz-backend/commit/5131797876e9b5899e0e0cdf70bc15d59d716a69))

### Refactoring

- use new hold plugin - ([b283e37](https://github.com/BoltzExchange/boltz-backend/commit/b283e37c81397ff2a2d6b34dd5b8986266236843))
- move SSE swap update streams to sidecar - ([cf3071e](https://github.com/BoltzExchange/boltz-backend/commit/cf3071ea06fa2e8f3c0ae96faa4c989f4884066b))
- cleanup shutdown (#677) - ([5592233](https://github.com/BoltzExchange/boltz-backend/commit/5592233ba1b8ab76e297f134d11d485f72fb685e))
- configurable 0-conf wait time (#696) - ([27113a2](https://github.com/BoltzExchange/boltz-backend/commit/27113a25281986b9f4710a45f251a4c6111c33d6))
- move backups to sidecar - ([a2c8a1b](https://github.com/BoltzExchange/boltz-backend/commit/a2c8a1b1ab6c261d76d3b5b1c7bad81f166abf7e))
- allow node connections to fail on startup - ([30f7103](https://github.com/BoltzExchange/boltz-backend/commit/30f71039bf24b5110aeb2d1025c0a377750e21c2))

---
## [3.7.3](https://github.com/BoltzExchange/boltz-backend/compare/v3.7.2..v3.7.3) - 2024-08-16

### Bug Fixes

- **(cli)** certificates type - ([b86f475](https://github.com/BoltzExchange/boltz-backend/commit/b86f475869b2a25057cf9c99375f37b5fe29ed30))
- non lowball 0-conf broadcasts through API (#610) - ([e38eb51](https://github.com/BoltzExchange/boltz-backend/commit/e38eb51c92486db4b8962fab63dc375b52cee6ea))
- enforce correct limit for chain swaps (#613) - ([0d6f871](https://github.com/BoltzExchange/boltz-backend/commit/0d6f871e2a44e48e4d2afae3f0ab149084a80b1f))
- make preimage optional in chain swap claim endpoint (#614) - ([ffde577](https://github.com/BoltzExchange/boltz-backend/commit/ffde577057c752a12074e0fc2ee6c2f33752560e))
- match logger job name with tracing service - ([9e4f6f4](https://github.com/BoltzExchange/boltz-backend/commit/9e4f6f465f3e50a0159fcc6b6b354f8868419a1f))
- try connect loop of sidecar - ([b42f684](https://github.com/BoltzExchange/boltz-backend/commit/b42f6847f29803770dfc06120e4f72515d647118))
- persist swap failure reason (#621) - ([a5b52eb](https://github.com/BoltzExchange/boltz-backend/commit/a5b52eb6c18627fb0cafdefe9576e7d1d3a545f2))
- coalesce sidecar certificate path - ([2eb0746](https://github.com/BoltzExchange/boltz-backend/commit/2eb0746dc6a8012f7515c2cf01195f1f0e74adca))
- nicer error when chain swap already claimed - ([d04f520](https://github.com/BoltzExchange/boltz-backend/commit/d04f52087c2b04dc9fa3284ccebb73e4cd77f8e8))
- lint errors for unused caught exceptions - ([cea5974](https://github.com/BoltzExchange/boltz-backend/commit/cea59747df654859c6d86f72a5041aba1c5eab7a))
- use TEXT column type for BIP-21 in magic routing hints (#644) - ([4aa1955](https://github.com/BoltzExchange/boltz-backend/commit/4aa1955526d36b2d724b584dee4ec58b5eecdc85))
- missing subscription ack message in WebSocket (#645) - ([3f26a68](https://github.com/BoltzExchange/boltz-backend/commit/3f26a6807ec933acbf9d3ab912ddd75f6bb7e365))

### Documentation

- add webhook documentation - ([f37091f](https://github.com/BoltzExchange/boltz-backend/commit/f37091f150d7fba8c240a4bbcf1b2d1e23da790a))
- add swap status change info (#618) - ([fc3cfc3](https://github.com/BoltzExchange/boltz-backend/commit/fc3cfc3a9739a64b0871d55fe856196d9edad3ce))
- update description of how preimages are revealed with taproot swaps (#639) - ([9c37770](https://github.com/BoltzExchange/boltz-backend/commit/9c37770fcdd2f096762aa291626326a03899f6cf))

### Features

- open WebSocket and streams metrics - ([546b202](https://github.com/BoltzExchange/boltz-backend/commit/546b202ff051b8d831476bcb737ddad44576ef93))
- add OpenTelemetry - ([084f701](https://github.com/BoltzExchange/boltz-backend/commit/084f701fc7bb55254c91fdf7b92b754c2d7ce76a))
- WebHook caller - ([319205a](https://github.com/BoltzExchange/boltz-backend/commit/319205a6d7328dd35a6c76da4ad3fd97a40c0e98))
- implement WebHooks in API - ([9cef596](https://github.com/BoltzExchange/boltz-backend/commit/9cef596c876e8825c101f3b62154f2a0f50a3dcd))
- tracing in sidecar - ([3b0ab89](https://github.com/BoltzExchange/boltz-backend/commit/3b0ab896d56f2bd90f20de899a064856c37a2471))
- CLN backups to S3 compatible API - ([7b578ae](https://github.com/BoltzExchange/boltz-backend/commit/7b578ae6caed334fa41dea23fab0cc537e7b28c5))
- send notification when invoice fails to settle - ([0d5698e](https://github.com/BoltzExchange/boltz-backend/commit/0d5698e7466e9d30560060f76627bd23142fc4fa))
- custom Core RPC wallet names - ([ae1a009](https://github.com/BoltzExchange/boltz-backend/commit/ae1a009c89336a3ee1f1d04afd5196f6a261cf47))
- Webhook status include list (#632) - ([c9358b0](https://github.com/BoltzExchange/boltz-backend/commit/c9358b0c3436b98f507b0ce0cef3adadf923ba41))
- configurable RSK network name (#633) - ([12d8876](https://github.com/BoltzExchange/boltz-backend/commit/12d88768b48b7eec70ffa9f92eb318600cbcf16d))
- EVM transaction labels (#637) - ([ce5b487](https://github.com/BoltzExchange/boltz-backend/commit/ce5b4873e21073b9e5e8d89d4437c1e4229ae436))
- command to query transaction labels (#641) - ([0fc173e](https://github.com/BoltzExchange/boltz-backend/commit/0fc173e6cefce2160f39f4ef472b84273c698bea))
- description hashes for reverse swap invoices - ([10c926f](https://github.com/BoltzExchange/boltz-backend/commit/10c926f44f0c237cb932e19133690dd86b38d02b))
- sign cooperative EVM refund by preimage hash (#643) - ([96410c3](https://github.com/BoltzExchange/boltz-backend/commit/96410c3ff0d241150ff868eb39430b64b94d9622))
- include timestamp in WebSocket swap updates - ([9a44944](https://github.com/BoltzExchange/boltz-backend/commit/9a44944bb1fbf951f38d051f2fab256721e4b24c))

### Miscellaneous Chores

- add CHANGELOG for v3.7.2 - ([f7ef24e](https://github.com/BoltzExchange/boltz-backend/commit/f7ef24e0b36ca54a44be1f04323594ebe08546ee))
- move swap related non lowball tx logging - ([a34d0d7](https://github.com/BoltzExchange/boltz-backend/commit/a34d0d7cf25cf5ad1e4827f5936c7d113059a070))
- update sidecar to changed config keys - ([d683b8f](https://github.com/BoltzExchange/boltz-backend/commit/d683b8f77748654f90838b02686028b12b47c56d))
- allow slight version mismatch in dev - ([a12561f](https://github.com/BoltzExchange/boltz-backend/commit/a12561f5e5bffc672121d12fafd230f195fa80f5))
- bump openssl from 0.10.64 to 0.10.66 in /boltzr (#615) - ([99deedb](https://github.com/BoltzExchange/boltz-backend/commit/99deedbc9e0a4df45f0ba46a7a9767f105afd74f))
- use prettier for Markdown files (#619) - ([20027c1](https://github.com/BoltzExchange/boltz-backend/commit/20027c1758d0eba5e8b37b7b49db480c49c3d651))
- trace commands from mattermost - ([0deaf40](https://github.com/BoltzExchange/boltz-backend/commit/0deaf401645dc25c47bb077d081966785ef1bbbf))
- remove WebDav backup provider - ([ca61096](https://github.com/BoltzExchange/boltz-backend/commit/ca610965d52eaddf224e45fdd8987e5736b1ca66))
- update dependencies - ([9c52375](https://github.com/BoltzExchange/boltz-backend/commit/9c523757a08e4930ce8288427e6509ec4f06315c))
- make webhook config of sidecar optional - ([b72aca4](https://github.com/BoltzExchange/boltz-backend/commit/b72aca441960017d5c2f11d0000a7ec19b3252ba))
- disable ARM64 builds in CI again - ([c42a756](https://github.com/BoltzExchange/boltz-backend/commit/c42a756c1adf80c2033ade75237b7dfa43921708))
- bump fast-xml-parser from 4.3.2 to 4.4.1 (#629) - ([9707526](https://github.com/BoltzExchange/boltz-backend/commit/9707526d77b7fdaf8ce2b942468e7b17d761fcf0))
- bump max custom invoice description length (#630) - ([b488a3a](https://github.com/BoltzExchange/boltz-backend/commit/b488a3ab44a75411f5a04ba8b06e4521f3b1ec6a))
- change regtest chain id to 33 - ([2954dbf](https://github.com/BoltzExchange/boltz-backend/commit/2954dbfbdda2f5e418c06bc594a95c59d22213ab))
- remove disk usage checker - ([8edc1b9](https://github.com/BoltzExchange/boltz-backend/commit/8edc1b9a2da186612416135d29b2e272b19c7d0a))
- get rid of dyn-clone - ([fb9eef8](https://github.com/BoltzExchange/boltz-backend/commit/fb9eef8d0ea0ea7290eaf4beb25f7f12f59c97b9))
- bump axios to v1.7.4 - ([c1819d0](https://github.com/BoltzExchange/boltz-backend/commit/c1819d0ff94c782eb8386769dc12302b6fc200bd))
- bump LND to v0.18.3 - ([3b079df](https://github.com/BoltzExchange/boltz-backend/commit/3b079df84fdb31fa41fd8481a9b2a9386c449862))
- bump version to v3.7.3 - ([aad3f28](https://github.com/BoltzExchange/boltz-backend/commit/aad3f288d5fe1ebb797c481de7e94aed52edae15))

### Refactoring

- move sidecar child process logic - ([a376a78](https://github.com/BoltzExchange/boltz-backend/commit/a376a78a56d21021f1e55338f72567f46a79646a))
- improve API tracing - ([beb6bc5](https://github.com/BoltzExchange/boltz-backend/commit/beb6bc5757f4c3a67f5275b3d0519038e08b303c))
- remove Discord - ([4b20209](https://github.com/BoltzExchange/boltz-backend/commit/4b20209f498327cb8f535e004c9479397e853bd9))
- remove SQLite database backend - ([e7f988e](https://github.com/BoltzExchange/boltz-backend/commit/e7f988ed4b10f61c85bf43e885e1c900a1cf672a))
- remove unused getWalletInfo method - ([6663858](https://github.com/BoltzExchange/boltz-backend/commit/666385811c9c8d64b1490480a1bc0220d8400b0a))
- remove WebDAV CLN backups - ([22d08c6](https://github.com/BoltzExchange/boltz-backend/commit/22d08c633499b09164cfc332afcb61b2a03287ab))
- move EIP-712 signing to sidecar (#631) - ([d86ea12](https://github.com/BoltzExchange/boltz-backend/commit/d86ea127c1bf0b4cf18bec710ac5da4553de3d0a))
- move Mattermost to sidecar - ([aa1cac3](https://github.com/BoltzExchange/boltz-backend/commit/aa1cac3181f71041f2ca1827b5b4ab0c116fd72b))
- move WebSockets to sidecar - ([69566b5](https://github.com/BoltzExchange/boltz-backend/commit/69566b59f1a75291f4cadaf59b3430e59b8101df))

### Tests

- sidecar database interactions and gRPC service - ([815d60d](https://github.com/BoltzExchange/boltz-backend/commit/815d60d64b00564674999129e80ff64473ea2fcc))
- Webhook integration in backend - ([0de07fe](https://github.com/BoltzExchange/boltz-backend/commit/0de07fe2ed4d8d4fc8390a72108d257c34b4a4e9))

---
## [3.7.2](https://github.com/BoltzExchange/boltz-backend/compare/v3.7.1..v3.7.2) - 2024-07-15

### Bug Fixes

- failed notitication for swap without invoice - ([e1d3d6c](https://github.com/BoltzExchange/boltz-backend/commit/e1d3d6c05c6b013b9fc38575c3b59ef4c5857737))
- failed Chain Swap notifications - ([e781bc2](https://github.com/BoltzExchange/boltz-backend/commit/e781bc2d106e5243589fa638cda2b7fedd3c437d))
- brute force key order combinations in CLI (#603) - ([a131e66](https://github.com/BoltzExchange/boltz-backend/commit/a131e66b8b437091859e035087b359ea1a10a835))

### Documentation

- add TypeScript examples for Liquid swaps - ([02532ab](https://github.com/BoltzExchange/boltz-backend/commit/02532ab259b556aba15566e073a3716b4fdb9ed9))
- add Bitcoin -> Liquid Chain swap example - ([291cdcb](https://github.com/BoltzExchange/boltz-backend/commit/291cdcb33fb62339fba9274eaf4ec447747fad09))
- add chain swap lifecycle and transaction details - ([1cc27fc](https://github.com/BoltzExchange/boltz-backend/commit/1cc27fc5b36f40651d25eea26948ee86d1c41faa))
- add common problems page (#606) - ([b06443f](https://github.com/BoltzExchange/boltz-backend/commit/b06443f5a0f4c84c1c022a1291a969cacd2007c2))

### Features

- sanity check invoice memos - ([5f95d82](https://github.com/BoltzExchange/boltz-backend/commit/5f95d82fe46036c4e34e7c61f712465df7084161))
- custom reverse swap invoice description - ([d218794](https://github.com/BoltzExchange/boltz-backend/commit/d218794c6b93fefcb69da559acf2f5cacbbe1c16))
- gRPC server SSL encryption and authentication (#591) - ([75a2037](https://github.com/BoltzExchange/boltz-backend/commit/75a20373ce48d01ba2ed0611ab803e73bb66e7ae))
- allow lowball lockup transactions in API (#598) - ([f8ce827](https://github.com/BoltzExchange/boltz-backend/commit/f8ce827a3a8c1a0b8c01d0dec27b944432a6b617))
- onchain overpayment protection (#599) - ([61a3d91](https://github.com/BoltzExchange/boltz-backend/commit/61a3d91d6b0aaa79bf6e69d640fed89db5819191))
- S3 compatible backup provider - ([e24f2bf](https://github.com/BoltzExchange/boltz-backend/commit/e24f2bf515d70666a543b1a418e5faf61a1c5005))
- ListSwaps gRPC method (#607) - ([c6e2e4b](https://github.com/BoltzExchange/boltz-backend/commit/c6e2e4b0fa7642742a57aca2d5a2e8f3165802a5))

### Miscellaneous Chores

- add CHANGELOG for v3.7.1 - ([a8b37c0](https://github.com/BoltzExchange/boltz-backend/commit/a8b37c0b3e3d38e35f56c7d1b0a7a5db385bb1da))
- bump certifi from 2024.6.2 to 2024.7.4 in /tools (#597) - ([2261aa4](https://github.com/BoltzExchange/boltz-backend/commit/2261aa4259f199d7cfd86d435a5a18a143c1ff3b))
- remove Google Cloud bucket backup provider - ([bc5af96](https://github.com/BoltzExchange/boltz-backend/commit/bc5af9623a2ae57cab5a54349b2bf51d69bf4b1c))
- optimize backend Dockerfile (#604) - ([ee4c77b](https://github.com/BoltzExchange/boltz-backend/commit/ee4c77be1fcb9bb2b45703c542ad67f7efbf218d))
- include swap id in invoice settlement error log (#608) - ([3b652be](https://github.com/BoltzExchange/boltz-backend/commit/3b652beba7b62284cddcd31d703ad47bfe6ed84e))
- minor dependency updates - ([bbb992c](https://github.com/BoltzExchange/boltz-backend/commit/bbb992cf0907551a62541d3a662fbc7536eed78c))
- bump Docker image versions - ([08ed479](https://github.com/BoltzExchange/boltz-backend/commit/08ed4790deeb56686d9e84782aa485506e77a9cc))
- apply docs review feedback - ([f4260f5](https://github.com/BoltzExchange/boltz-backend/commit/f4260f533abb0d96dea5fbf8f0dd3e219f7de60e))

---
## [3.7.1](https://github.com/BoltzExchange/boltz-backend/compare/v3.7.0..v3.7.1) - 2024-07-02

### Bug Fixes

- put locks on cooperative swap settlement - ([2a36576](https://github.com/BoltzExchange/boltz-backend/commit/2a365767290c0ac08727b5ed6b17c41ad7fb0e2e))
- unconfirmed user lockup transaction error handling - ([adfbb9c](https://github.com/BoltzExchange/boltz-backend/commit/adfbb9cd852b949c780c74677374449c2a8eecfe))
- check prevout index for swap related broadcasts (#560) - ([7cdd390](https://github.com/BoltzExchange/boltz-backend/commit/7cdd390b9ac4981252f136f74257940eba2c86e0))
- also clear temporary exclude list when resetting mpay - ([db7116a](https://github.com/BoltzExchange/boltz-backend/commit/db7116a08ef8142d4830546f21291277a6b87c99))
- allow for cooperative refunds when CLN pay failed to pay an invoice (#567) - ([293be5e](https://github.com/BoltzExchange/boltz-backend/commit/293be5ed6a85f9cbaee175a1c32aaa7095b1ea59))
- cleanup Loki log format - ([2a4725a](https://github.com/BoltzExchange/boltz-backend/commit/2a4725a32c27ac3f5a3e63b4d73bf879bb805cc5))
- missing status for cooperative chain swap refunds (#578) - ([1ed17a8](https://github.com/BoltzExchange/boltz-backend/commit/1ed17a889af3126b1d74b40b71b7781084a1c357))
- Mattermost max message length (#584) - ([8c4a4e2](https://github.com/BoltzExchange/boltz-backend/commit/8c4a4e21616097f46c12043eaf96ba80f85d6db6))
- lowball claim covenants (#585) - ([ec4d5b2](https://github.com/BoltzExchange/boltz-backend/commit/ec4d5b267ea201400e5c3dadc0dd5fc1b447fd4b))
- off by one in BIP-21 routing hint - ([abde534](https://github.com/BoltzExchange/boltz-backend/commit/abde5340fdf86e84b331d851543cba7ae44d962b))

### Features

- include user lockup transactions in swap updates - ([939b889](https://github.com/BoltzExchange/boltz-backend/commit/939b8896957c5700f032e34ebd3b1c4360b4b5fd))
- add details to failure reason of swap status - ([48e120a](https://github.com/BoltzExchange/boltz-backend/commit/48e120afa3b258b4357341ddcf306790b4117db9))
- throw error when setting expired invoice - ([90d87cf](https://github.com/BoltzExchange/boltz-backend/commit/90d87cf03afec971c69971828bfb97b9bad1d10e))
- return referral id in swap created response (#557) - ([74e56ad](https://github.com/BoltzExchange/boltz-backend/commit/74e56addfc19b6a97f86c1a04695b01de07cfd07))
- configurable minimal swap size multipliers (#562) - ([d86316d](https://github.com/BoltzExchange/boltz-backend/commit/d86316de2f5985e49ae57eb779b34da465ac88ba))
- granular temporary and permanent mpay memory reset - ([c65f5bb](https://github.com/BoltzExchange/boltz-backend/commit/c65f5bb2c67c30964f9d4c1b20737b0427334523))
- set labels for addresses and transactions - ([a312595](https://github.com/BoltzExchange/boltz-backend/commit/a31259534723f5549c14bc8b4f31f77f160e4c6d))
- sanitize ZMQ address wildcards (#576) - ([447e072](https://github.com/BoltzExchange/boltz-backend/commit/447e07214e18598d93160c75ab64f2ebba4788b3))
- detailed cooperative refund rejection error (#581) - ([e08c854](https://github.com/BoltzExchange/boltz-backend/commit/e08c854cd73b69547dbff36c0fa084cbb41c333e))
- save permanent payment errors in database (#587) - ([2b9a4e8](https://github.com/BoltzExchange/boltz-backend/commit/2b9a4e8d3bebe369c21cb6843bc345b8e1742f0a))

### Miscellaneous Chores

- add CHANGELOG for v3.7.0 - ([1c7636c](https://github.com/BoltzExchange/boltz-backend/commit/1c7636c21d719265d7ce81594f1148815bc263fe))
- minor dependency update - ([5dcbe5e](https://github.com/BoltzExchange/boltz-backend/commit/5dcbe5eb722a6d3d8353ec7ec80092c0bf92f552))
- bump LND to v0.18.0-beta - ([bf13d1f](https://github.com/BoltzExchange/boltz-backend/commit/bf13d1f1c836095d909c45dc0214b71e1eab74b2))
- minor dependency updates - ([d362dad](https://github.com/BoltzExchange/boltz-backend/commit/d362dad7c3b189026a1906e7c1dedbc6aa7bda10))
- set NODE_ENV to production in Docker build - ([a433cea](https://github.com/BoltzExchange/boltz-backend/commit/a433cea986869d74c413e9e8e34bf20ef0a715fd))
- bump CLN to v24.05 (#559) - ([358c9bf](https://github.com/BoltzExchange/boltz-backend/commit/358c9bf3fd545fc564fd42cdbcdec1e9698d7d67))
- update CLN protos to v24.05 (#561) - ([7239988](https://github.com/BoltzExchange/boltz-backend/commit/7239988b430f98c508afd336e60b2ea751e3a1fe))
- update Python dependencies - ([10b055f](https://github.com/BoltzExchange/boltz-backend/commit/10b055f5891edfae1502760789825c5589fc9b0b))
- add logging for rescan command - ([525c885](https://github.com/BoltzExchange/boltz-backend/commit/525c88513360e10ba28267228655e951773add26))
- bump @grpc/grpc-js from 1.10.8 to 1.10.9 (#568) - ([47505ba](https://github.com/BoltzExchange/boltz-backend/commit/47505ba8ddfef226736c8f284ce98379ca4b3eb6))
- bump braces from 3.0.2 to 3.0.3 (#569) - ([8108cc6](https://github.com/BoltzExchange/boltz-backend/commit/8108cc6889d26fd1c1fc192e1329a1a28594f515))
- bump urllib3 from 2.2.1 to 2.2.2 in /tools (#571) - ([ca491df](https://github.com/BoltzExchange/boltz-backend/commit/ca491df9f80825f425a1c66bbc36a90934a56265))
- bump ws and ethers (#572) - ([41564aa](https://github.com/BoltzExchange/boltz-backend/commit/41564aacfcbebd382db8033522b55d9f981cb199))
- bump Bitcoin Core to v27.1 (#575) - ([3436b5a](https://github.com/BoltzExchange/boltz-backend/commit/3436b5ac79d5096351270edc6908772009807e6a))
- update NPM dependencies - ([e9681fd](https://github.com/BoltzExchange/boltz-backend/commit/e9681fd62ede92c74d36016b117cab3906f8bd0e))
- change license to AGPL-3 (#574) - ([1f61a44](https://github.com/BoltzExchange/boltz-backend/commit/1f61a44286ba614bd3d234b87026fbdddc037c78))
- bump LND version to v0.18.1-beta (#582) - ([bae070f](https://github.com/BoltzExchange/boltz-backend/commit/bae070fb701ca8cb3db50a1e180c2b7df0f85425))
- include dependencies for clnrest in image - ([cac6d0b](https://github.com/BoltzExchange/boltz-backend/commit/cac6d0b65016ebf8c6931eea882c7e39ec39b2df))
- bump CI action versions - ([e7b18d0](https://github.com/BoltzExchange/boltz-backend/commit/e7b18d06ea7c22c0a5442c4703cb933b032bbd11))
- bump version to v3.7.1 - ([0f7ded9](https://github.com/BoltzExchange/boltz-backend/commit/0f7ded9924a3404763401547974bd165d24c910c))
- include swap id in invoice payment tracking logs (#589) - ([e52efbf](https://github.com/BoltzExchange/boltz-backend/commit/e52efbfc574f93910f7103c3b407a1c27cd51ce6))

### Refactoring

- improve transaction detection logging - ([77d7f00](https://github.com/BoltzExchange/boltz-backend/commit/77d7f009716e2c81ac11622b642e85f2a0c7e520))
- swap status cache - ([751077c](https://github.com/BoltzExchange/boltz-backend/commit/751077c7d7bd7d8ec2ed5c5dbf0540e9fb1b0f73))
- make toHaveBeenCalledTimes in tests more readable - ([e17185e](https://github.com/BoltzExchange/boltz-backend/commit/e17185ee384fc366496597dff747b2abef143c69))
- tracking of pending invoice payments - ([e7edd6a](https://github.com/BoltzExchange/boltz-backend/commit/e7edd6af12de7087eb12c4614b12f0a87713e935))

### Tests

- make tests more robust by waiting for CLN sync - ([748e5f8](https://github.com/BoltzExchange/boltz-backend/commit/748e5f871994fa6f9bf98a8588a8950ddf74c7d5))

---
## [3.7.0](https://github.com/BoltzExchange/boltz-backend/compare/v3.6.0..v3.7.0) - 2024-05-29

### Bug Fixes

- mpay override implementation (#541) - ([22d3ddf](https://github.com/BoltzExchange/boltz-backend/commit/22d3ddf59bcdd84bf3f6e308976789725ffb7f95))
- chain swap errors in Swagger - ([65680d0](https://github.com/BoltzExchange/boltz-backend/commit/65680d08254e5a80699289c51de8b087036c3d38))
- chain swap refund error - ([48bd28a](https://github.com/BoltzExchange/boltz-backend/commit/48bd28af471d29b468907e353825c484053c3291))
- chain swap pair mapping - ([eb6b30c](https://github.com/BoltzExchange/boltz-backend/commit/eb6b30c92c73cc0f8b01131f5a26716a8b3999f8))
- CLI command to coop claim chain swaps - ([1efdee9](https://github.com/BoltzExchange/boltz-backend/commit/1efdee9f100b9b4e54eca8aedd764401a3f1cfda))
- regression in getpairs endpoint - ([4ee85b0](https://github.com/BoltzExchange/boltz-backend/commit/4ee85b065aeac17913ced66bd3a6682d04cf3ed1))
- increase chain swap min swap size multiplier - ([1eb62d8](https://github.com/BoltzExchange/boltz-backend/commit/1eb62d86a668e9c16ef7a859af0865581c1e6764))
- chain swap expiry - ([2a5f2af](https://github.com/BoltzExchange/boltz-backend/commit/2a5f2af28c70d896d52c0d782d5d567d84082d71))
- chain swap pending lockup transaction tracking - ([101a12b](https://github.com/BoltzExchange/boltz-backend/commit/101a12b6543889c8617dd79bcc47ad3e11c9b941))
- lock when broadcasting cooperative claim - ([21ae1f4](https://github.com/BoltzExchange/boltz-backend/commit/21ae1f4e6ee9a9cf10404eaa283dc31cf2b22a68))
- include timeout ETA in chain swap transactions endpoint - ([38f3351](https://github.com/BoltzExchange/boltz-backend/commit/38f3351b6e6c1ff2bc78c22ef3a9db87a43dc615))
- consistent 0-conf rejected status on restart - ([323c30f](https://github.com/BoltzExchange/boltz-backend/commit/323c30f6bad7fc4cc9744a0d046044df4d9f1088))
- ignore empty swap options when fetching ChainSwaps - ([784a796](https://github.com/BoltzExchange/boltz-backend/commit/784a796d83659f9ad347dc6298ba127ba04cdbc7))
- use script path fee estimation for chain swaps - ([ddc6878](https://github.com/BoltzExchange/boltz-backend/commit/ddc68782b954f26ff65136a842e15115704a1191))

### Documentation

- add claim covenant and magic routing hints (#536) - ([bc82896](https://github.com/BoltzExchange/boltz-backend/commit/bc82896467dcfa78f2245651b86d99c6cd436eed))
- Swagger for chain swaps - ([660bf3b](https://github.com/BoltzExchange/boltz-backend/commit/660bf3bbf48169a61ad192a0a868f56fe4143d6a))
- add missing swapTypes for pairs config - ([d80d13a](https://github.com/BoltzExchange/boltz-backend/commit/d80d13a05720d6193b510bb8636df73e78f74165))
- add missing chain swap timeout in config - ([24ff6bc](https://github.com/BoltzExchange/boltz-backend/commit/24ff6bc65059f7a4d16c43feaa74faff8a4293ec))

### Features

- allow specifying referral via URL query (#543) - ([8398fee](https://github.com/BoltzExchange/boltz-backend/commit/8398fee96bc36d3b40a7880e1e31d6a501b2e817))
- chain swap POC - ([02906af](https://github.com/BoltzExchange/boltz-backend/commit/02906af582798790d76e6c67928cbdcd67032b6e))
- FeeProvider for chain swaps - ([f444b11](https://github.com/BoltzExchange/boltz-backend/commit/f444b116375cef1371c96f52d4c450fd0e3c7ba4))
- SQL queries for chain swaps - ([86fc8b7](https://github.com/BoltzExchange/boltz-backend/commit/86fc8b7b51f98bd995fba8db31879d53472545bb))
- recreate filters for chain swaps - ([2ba0a92](https://github.com/BoltzExchange/boltz-backend/commit/2ba0a9208dccad35e99966f9e431bce42defbf63))
- cooperative chain swap claims - ([9ba1065](https://github.com/BoltzExchange/boltz-backend/commit/9ba1065b47d87185cbc435ca8d53f62efd775755))
- cooperative chain swap refunds - ([9dbcbf6](https://github.com/BoltzExchange/boltz-backend/commit/9dbcbf6395515cc812ae5b1eb56ed1f05cda2ee0))
- query chain swap transactions - ([c1f72d3](https://github.com/BoltzExchange/boltz-backend/commit/c1f72d309095ae428274e0adc39c2e46fb271f86))
- EVM chain swaps - ([25ef8dd](https://github.com/BoltzExchange/boltz-backend/commit/25ef8dd4998d265a70bf3348dc5ebd13c9122241))
- separate timeout block delta for chain swaps - ([76bcc4c](https://github.com/BoltzExchange/boltz-backend/commit/76bcc4cae2f720a89ab1bf2e15e68baad88345eb))
- allow configuring API endpoint of CLI - ([fca6b06](https://github.com/BoltzExchange/boltz-backend/commit/fca6b0649830a3b40a447ff0a0ffc64a6063fb38))
- include reverse routing hints in swapinfo - ([85cb218](https://github.com/BoltzExchange/boltz-backend/commit/85cb2185b2f61c6cc4cee0ac2e0c22df29e885e5))
- partialy cooperative chain swap claims - ([520b921](https://github.com/BoltzExchange/boltz-backend/commit/520b921d6713da1e106c973bd324019c3f3cfd2c))
- always include transaction in related events - ([612540f](https://github.com/BoltzExchange/boltz-backend/commit/612540ff20fa84cda44a73b318f2bf62e64ce855))
- chain swap fee per direction - ([3319205](https://github.com/BoltzExchange/boltz-backend/commit/3319205e6efa2c5852c6deea72fb1510e765b5de))
- separate swap amount limits for chain swaps - ([d90c7b4](https://github.com/BoltzExchange/boltz-backend/commit/d90c7b402d6178bc51fb96ca4a387cfec45314f1))

### Miscellaneous Chores

- bump undici and @discordjs/rest (#542) - ([05614cc](https://github.com/BoltzExchange/boltz-backend/commit/05614cc502f98750a0639faa0ba4b0ce1b9b8308))
- move partners to license file (#546) - ([c4f6287](https://github.com/BoltzExchange/boltz-backend/commit/c4f62876d46fc2e77ab2306e4dbbf541b8c0c563))
- bump requests from 2.31.0 to 2.32.0 in /tools (#548) - ([34d2c6d](https://github.com/BoltzExchange/boltz-backend/commit/34d2c6d81821e038427e38fe5046ba97d3527b09))
- update dependencies - ([945d5ef](https://github.com/BoltzExchange/boltz-backend/commit/945d5efe29f3bef637f728bf40d296686a24e980))
- address review feedback - ([f0ff23a](https://github.com/BoltzExchange/boltz-backend/commit/f0ff23a48f30455b5a6a3be261c8baad213415ae))
- update Docker images - ([c69a575](https://github.com/BoltzExchange/boltz-backend/commit/c69a5758a5f4ee7f73b4bbc6f10fa41caa581246))
- update NPM dependencies (#552) - ([adf2f14](https://github.com/BoltzExchange/boltz-backend/commit/adf2f14555b52b8a3b77d813ee692be505572c65))

### Refactoring

- rename chain swap response properties - ([6b8ba97](https://github.com/BoltzExchange/boltz-backend/commit/6b8ba9783219d98b1a6ddfdddfac2c87b3f2a4aa))
- use isTxConfirmed function - ([6ed7bd4](https://github.com/BoltzExchange/boltz-backend/commit/6ed7bd40384abe6a666b4e2f4c9308c91af8ebdf))
- wrapped swap repository for chain and reverse - ([797bd1e](https://github.com/BoltzExchange/boltz-backend/commit/797bd1e94d0ddfc1500982d0f5d79d7c243a1ba0))

### Tests

- add tests for chain swap related code - ([fc0abe0](https://github.com/BoltzExchange/boltz-backend/commit/fc0abe0146c3dc78a14b2c6118acd31d6dacd1e6))
- fix broken test cases - ([d249c05](https://github.com/BoltzExchange/boltz-backend/commit/d249c05f9b23abdf39a840a7126d76c687b2f59d))

### Mpay

- add `mpay-override-pay` option to override `pay` command (default false, for now!) - ([14fe5a0](https://github.com/BoltzExchange/boltz-backend/commit/14fe5a07c67343b712a1e6c0ff044773e1d0df74))

### Tools/plugins/mpay

- make the `mpay-override-pay` option dynamic where supported. - ([5415e70](https://github.com/BoltzExchange/boltz-backend/commit/5415e70f7259417aedb155d5eb55e0d2b64d4b5c))

---
## [3.6.0](https://github.com/BoltzExchange/boltz-backend/compare/v3.5.0..v3.6.0) - 2024-04-24

### Bug Fixes

- Docker build script backend version - ([c3f6aaa](https://github.com/BoltzExchange/boltz-backend/commit/c3f6aaa1543dc67777da8b0d0512a9d2c3b89dc2))
- flaky fee calculating integration test - ([c375740](https://github.com/BoltzExchange/boltz-backend/commit/c3757401760ee49c88e0f8b6c3cc35280e2ef3a3))
- remove lockup transaction table foreign contraint - ([d149cc6](https://github.com/BoltzExchange/boltz-backend/commit/d149cc6c644ff63f39c0dfd89d4e35a03377841f))
- use lowball config for second Elements client - ([ee3d5be](https://github.com/BoltzExchange/boltz-backend/commit/ee3d5be095729ed84c891f61ef1f1796dfec4a68))
- allow lowball for refunds (#533) - ([f0aab1c](https://github.com/BoltzExchange/boltz-backend/commit/f0aab1cd569a79527e3c73ece4a7f7f7fb6502af))
- bump Liquid claim transaction size estimation (#534) - ([9df7beb](https://github.com/BoltzExchange/boltz-backend/commit/9df7beb0a43ce04a0e3698a4c4f0efca6fd66a45))

### Features

- make CORS headers configurable (#529) - ([efc463f](https://github.com/BoltzExchange/boltz-backend/commit/efc463fa7f5a984a9bee71ee4dbffa0d22723d39))
- use lowball for emitting unconfirmed transactions - ([9621376](https://github.com/BoltzExchange/boltz-backend/commit/9621376a7018dd1dbc889e546350a6cb5db477b6))
- 0-conf circuit breaker - ([0c33029](https://github.com/BoltzExchange/boltz-backend/commit/0c330295b2e90b42de9848de13d01a869467b40c))
- send alert notification when 0-conf is disabled - ([b135ce6](https://github.com/BoltzExchange/boltz-backend/commit/b135ce60af554b7ef781391c3b3b335bbfb8f406))
- use lowball fees in ElementsWrapper (#531) - ([add9ea5](https://github.com/BoltzExchange/boltz-backend/commit/add9ea5890c26709de6c2490ace70dadaa574edb))

### Miscellaneous Chores

- address minor review feedback - ([874abc9](https://github.com/BoltzExchange/boltz-backend/commit/874abc9405764cc7278978f8e130ca387ceb38d4))
- bump Bitcoin Core to v27.0 (#526) - ([246cf7d](https://github.com/BoltzExchange/boltz-backend/commit/246cf7d4a541104d5e8656427826c810b27c7dfa))
- prepare release v3.6.0 - ([cc21c00](https://github.com/BoltzExchange/boltz-backend/commit/cc21c00ecb602e328c602ad62af59efeaa3695bc))

### Refactoring

- simplify IChainClient generic - ([493c04b](https://github.com/BoltzExchange/boltz-backend/commit/493c04b1614f71e08333799e16f575140f330fb4))
- only broadcast with public Elements client - ([1459b1e](https://github.com/BoltzExchange/boltz-backend/commit/1459b1ed9e8dfabfaa41b7e44031e3601a673a9c))
- move allSettled into PromiseUtils - ([4937beb](https://github.com/BoltzExchange/boltz-backend/commit/4937beb4ef541c17a7be8eb7e157ee6d8b5159cb))
- use tableName for all SQL tables - ([50b1aa4](https://github.com/BoltzExchange/boltz-backend/commit/50b1aa4a54a1a286393769135295e9bb9b854a35))

---
## [3.5.0](https://github.com/BoltzExchange/boltz-backend/compare/v3.4.0..v3.5.0) - 2024-04-12

### Bug Fixes

- ElementsWalletProvider test flakiness - ([3d8dee2](https://github.com/BoltzExchange/boltz-backend/commit/3d8dee25367390628494b8e62d569e562e6ecea8))
- Mattermost block formatting - ([322db1e](https://github.com/BoltzExchange/boltz-backend/commit/322db1e721f99ab61e5579542b30a674e6c1ae42))
- detection of already paid invoices - ([b321af0](https://github.com/BoltzExchange/boltz-backend/commit/b321af0980c98045b27473516ef13cc5f7959168))
- improve LND HTLC acceptance logging - ([ce4824b](https://github.com/BoltzExchange/boltz-backend/commit/ce4824b1b4c18c4330c27561f8e19bed4a0a0d4f))
- Bitcoin Core work queue exhaustion when fetching transactions - ([029fb78](https://github.com/BoltzExchange/boltz-backend/commit/029fb78779dccf32173e1252985e8e2e733fc336))
- mpay forbid self payments - ([12bc09d](https://github.com/BoltzExchange/boltz-backend/commit/12bc09d748ba993c1560e307fc4bff87ec2f3431))
- wrong types in swagger (#485) - ([3dab64b](https://github.com/BoltzExchange/boltz-backend/commit/3dab64b0f68c1ba94c720ca42c9b1cafbc004e74))
- wrong onchainAmount swagger type - ([e4db482](https://github.com/BoltzExchange/boltz-backend/commit/e4db4823f376835b3e21fd8ec13df6c9d91c5778))
- CLN plugins for v24.02 - ([eef0544](https://github.com/BoltzExchange/boltz-backend/commit/eef05443eeb7281ca509038d423c2f75e29b054a))
- mpay known routes (#503) - ([492057a](https://github.com/BoltzExchange/boltz-backend/commit/492057a151120acbb4b6f3d651b72cef2f07285a))
- remove mpay exception traceback - ([b2c14d6](https://github.com/BoltzExchange/boltz-backend/commit/b2c14d6968d4b4a11a3ff773987573d5fd6e6c26))
- use right node for timeout query for invoices (#522) - ([acd0b56](https://github.com/BoltzExchange/boltz-backend/commit/acd0b562f10de0c02524b46fb1e3010f3a570194))
- harden Taproot signature generation - ([622f291](https://github.com/BoltzExchange/boltz-backend/commit/622f291f768804d052a0b79b116b729e94b0ee9c))
- mpay error could not find a route error - ([0bf3f06](https://github.com/BoltzExchange/boltz-backend/commit/0bf3f06069a10434a864a56e2d89843bdb319fbb))

### Documentation

- update regtest and deployment configurations - ([d180636](https://github.com/BoltzExchange/boltz-backend/commit/d1806365a2ec5a0a4525f48c63df4e220ba5b16c))
- Taproot scripting - ([0390f90](https://github.com/BoltzExchange/boltz-backend/commit/0390f90ccd5ed7aeb70e2363922412f6d8548d95))
- API v2 references - ([0da625c](https://github.com/BoltzExchange/boltz-backend/commit/0da625ceffd93e807949e1b9a1800cea73bf307e))
- refine Swagger spec - ([a8b8c4b](https://github.com/BoltzExchange/boltz-backend/commit/a8b8c4be6a3bbe8a559c1c48a20bdbc033043ff4))
- E2E examples for API V2 - ([6891a75](https://github.com/BoltzExchange/boltz-backend/commit/6891a7562200cd4cb7a3d765bbf3ba11dd4b76ea))
- API v2 wording and style (#486) - ([4972f31](https://github.com/BoltzExchange/boltz-backend/commit/4972f315c816aa7399c2e6e32809863b12106dd9))
- No subject - ([b81e5a2](https://github.com/BoltzExchange/boltz-backend/commit/b81e5a2e0c88c6d20d796646adb755fe9a2ef4fc))
- typo in API v2 code sample (#497) - ([2654e7b](https://github.com/BoltzExchange/boltz-backend/commit/2654e7b0f2ba4dc7526dc0c4cd4817b8fadfc050))
- add state transaction.lockupFailed (#513) - ([1e4a86a](https://github.com/BoltzExchange/boltz-backend/commit/1e4a86af2fc0f07a17882063a1d7e1fa1d89a2d1))

### Features

- referral API v2 - ([5191b6d](https://github.com/BoltzExchange/boltz-backend/commit/5191b6d1fabaf8fa03e93b18f197173c17c09855))
- Mattermost notifications (#470) - ([9e527c4](https://github.com/BoltzExchange/boltz-backend/commit/9e527c4c9729e4218d1fc944fe0c2f1805b06b9b))
- block height API - ([00556c2](https://github.com/BoltzExchange/boltz-backend/commit/00556c2654201c4f631206f379ded05b32fdd38d))
- sanity check mpay invoice (#475) - ([2027c13](https://github.com/BoltzExchange/boltz-backend/commit/2027c1377f04bb753e40ff1eb086e62918553b3c))
- marked swaps (#477) - ([57ee9a5](https://github.com/BoltzExchange/boltz-backend/commit/57ee9a5b4d9bb92235ff13e9f3bba83e4fc72d31))
- address filter - ([28855ee](https://github.com/BoltzExchange/boltz-backend/commit/28855ee8be62a9079e08d2da016b19e06a21a2e8))
- batched normal swap claims - ([9cc7009](https://github.com/BoltzExchange/boltz-backend/commit/9cc70095852996a5934d3e089aefed2ebf3abf20))
- cooperative Submarine claim transactions - ([141542e](https://github.com/BoltzExchange/boltz-backend/commit/141542ec06afe63283339589f9324bbf3d766b3a))
- API V2 WebSocket - ([7620de2](https://github.com/BoltzExchange/boltz-backend/commit/7620de2786efb7b5b0294314c38359e8b322f4fd))
- API V2 EVM contract data - ([d2e3489](https://github.com/BoltzExchange/boltz-backend/commit/d2e3489fa41697eb8598b5998dedd1634572c876))
- get reverse swap lockup transaction endpoint - ([c6a1f4c](https://github.com/BoltzExchange/boltz-backend/commit/c6a1f4c1d5f6b4bfa6f769f631f6664c0eedd1a5))
- cooperative EVM refunds - ([87f952a](https://github.com/BoltzExchange/boltz-backend/commit/87f952a44ca21d3a30799d95857b9ab8bfbcdc1a))
- RSK in API V2 - ([d0dbe53](https://github.com/BoltzExchange/boltz-backend/commit/d0dbe53fe5c32bf514265036d64ffaf6a8c105b1))
- magic BIP-21 routing hints (#482) - ([d82bc20](https://github.com/BoltzExchange/boltz-backend/commit/d82bc200a71cca064ce80e36bf8e73c9dd576211))
- rescan gRPC method (#489) - ([8f3cf44](https://github.com/BoltzExchange/boltz-backend/commit/8f3cf449f13a5c6c084fd6d5ffbda4701f55f203))
- Liquid claim covenant (#488) - ([436245d](https://github.com/BoltzExchange/boltz-backend/commit/436245d8def128f7b5a838f7d62d7a38873be17b))
- mpay response compatibility with pay - ([1ee2a15](https://github.com/BoltzExchange/boltz-backend/commit/1ee2a15c76adcf80b55f1f0b1674b3918b0f3a30))
- invoice expiry check (#498) - ([b8b76ca](https://github.com/BoltzExchange/boltz-backend/commit/b8b76cacf2d3731a6f53ab27a4ee852d8a45bf06))
- gRPC to change swap status (#500) - ([7853162](https://github.com/BoltzExchange/boltz-backend/commit/78531624027c2b827555f992c3e4216eb87c1efb))
- gRPC to dump heap (#506) - ([283d650](https://github.com/BoltzExchange/boltz-backend/commit/283d6500ac17187f50f566faac32a22fd8993c9e))
- add getLockedFunds gRPC call (#518) - ([586c364](https://github.com/BoltzExchange/boltz-backend/commit/586c364ce029c9616efcadef7340b693d4b78332))
- getPendingSweeps gRPC (#520) - ([1dc1c49](https://github.com/BoltzExchange/boltz-backend/commit/1dc1c49978d3900577146bfe206f1465c6133f80))

### Miscellaneous Chores

- update dependencies - ([71d49b6](https://github.com/BoltzExchange/boltz-backend/commit/71d49b69dcee4708fcefb742e212c529eca7c952))
- update dependencies - ([4ad8a4f](https://github.com/BoltzExchange/boltz-backend/commit/4ad8a4f688a571fe1f8a32d9a2b04749f536e02f))
- bump Docker image versions - ([32dc1da](https://github.com/BoltzExchange/boltz-backend/commit/32dc1da3c20d1ff408aacf8587ad7cae45ee1db3))
- update NPM dependencies - ([43c725c](https://github.com/BoltzExchange/boltz-backend/commit/43c725c9cd88bfba31c88ae3a4345ff70a1da471))
- update dependencies (#491) - ([bdaa1fd](https://github.com/BoltzExchange/boltz-backend/commit/bdaa1fdecd50a24c444821254081b6907b87a8fd))
- update partnerships in README - ([41d65ce](https://github.com/BoltzExchange/boltz-backend/commit/41d65cec3df004cab86b2944a279c2cf12503639))
- bump @openzeppelin/contracts from 5.0.1 to 5.0.2 (#492) - ([58dd311](https://github.com/BoltzExchange/boltz-backend/commit/58dd311c9e0af431cd79d98ca186354ec0744f7c))
- update Docker images - ([e7ca60a](https://github.com/BoltzExchange/boltz-backend/commit/e7ca60af7656bc83fd4cdb9bf6bacde5ce73b27d))
- update partnerships in readme (#502) - ([1719bc2](https://github.com/BoltzExchange/boltz-backend/commit/1719bc29fc403e0e2c8a66024954c31f79759a81))
- update CLN Docker image to v24.02.1 - ([4d6e240](https://github.com/BoltzExchange/boltz-backend/commit/4d6e240003ec5c71d8581f3455e925769c029747))
- bump follow-redirects from 1.15.4 to 1.15.6 (#505) - ([6d3a1fc](https://github.com/BoltzExchange/boltz-backend/commit/6d3a1fcf651e9781f129d8be473fa20ef883bead))
- Swagger UI deep linking (#512) - ([0d89dd2](https://github.com/BoltzExchange/boltz-backend/commit/0d89dd295307ec1518dca4008605976fa8a2f429))
- bump express from 4.18.3 to 4.19.2 (#515) - ([d9134d6](https://github.com/BoltzExchange/boltz-backend/commit/d9134d67ec001ac5cc1b00e4f9c14f2eea2c1df5))
- remove host networking from Docker setup (#517) - ([d9031e4](https://github.com/BoltzExchange/boltz-backend/commit/d9031e47525870767ed6ef8d82ad8c1174d017cc))
- update Bitcoin Core to v26.1 (#519) - ([8c1dbe2](https://github.com/BoltzExchange/boltz-backend/commit/8c1dbe28b2b3899550678c63365283e2a5549617))
- update CLN to v24.02.2 (#521) - ([d48a489](https://github.com/BoltzExchange/boltz-backend/commit/d48a489b138f4244d75ecf8b152bbaec006983dd))
- read backend image tag from package.json - ([f9d956b](https://github.com/BoltzExchange/boltz-backend/commit/f9d956bd58b7ca94a6d89bccb200e6260ed68049))
- bump tar from 6.1.13 to 6.2.1 (#523) - ([38bb1f3](https://github.com/BoltzExchange/boltz-backend/commit/38bb1f3483a0f08b80fbf7f99d2609d1cad04502))
- update Python dependencies - ([ae3fac3](https://github.com/BoltzExchange/boltz-backend/commit/ae3fac39b74f4f57fa92cb5035a584641f73e169))
- changelog for v3.5.0 - ([432fc64](https://github.com/BoltzExchange/boltz-backend/commit/432fc642bebe834f3f9e1ec81d0827d4235625f8))

### Refactoring

- strong typed EventEmitter - ([808aea9](https://github.com/BoltzExchange/boltz-backend/commit/808aea9725223a00bb1c6488e92c34cd179fcffc))
- simplify naming in DeferredClaimer - ([b108bb2](https://github.com/BoltzExchange/boltz-backend/commit/b108bb298e3dfd2c9b373d8dd24b2e75e236bd86))
- Reverse Swap BIP-21 query by invoice (#483) - ([97e6328](https://github.com/BoltzExchange/boltz-backend/commit/97e632895646d228efe112be1ce633804f123ee3))
- consistent endpoint in API V2 - ([0308974](https://github.com/BoltzExchange/boltz-backend/commit/030897441de7bb21d083cce837d9522100f9c4c5))
- use Sets for WebSocket mappings - ([62ed227](https://github.com/BoltzExchange/boltz-backend/commit/62ed227dff5b5364effd7a4d111587324a012f48))

---
## [3.4.0](https://github.com/BoltzExchange/boltz-backend/compare/v3.3.0..v3.4.0) - 2024-01-25

### Bug Fixes

- forbid reverse swaps with same preimage hash - ([f18c3bc](https://github.com/BoltzExchange/boltz-backend/commit/f18c3bc8e31e46674adfb40a460b48722e212b89))
- race condition when setting invoices of swaps (#432) - ([80809ae](https://github.com/BoltzExchange/boltz-backend/commit/80809ae5f64dc4539da39b9639ce80744716ff69))
- exclude most expensive route in mpay - ([cdce890](https://github.com/BoltzExchange/boltz-backend/commit/cdce890d5725262737467945075d886075b435d1))
- deduplicate already paid mpay invoices - ([b66c44a](https://github.com/BoltzExchange/boltz-backend/commit/b66c44a61a5a1e67ae7e3156fa8abfe3f82a7a92))
- mpay tests in CI - ([32d5a24](https://github.com/BoltzExchange/boltz-backend/commit/32d5a2423f0317cd4d07ad8237f47d3c7e5505b0))
- route hint delay on retries - ([1d4c7ba](https://github.com/BoltzExchange/boltz-backend/commit/1d4c7baea5662a139675526ad574fe63e2ec25ea))
- order of mpay route stats - ([8775df5](https://github.com/BoltzExchange/boltz-backend/commit/8775df50982aaccd1914e5561fc3528c6b5f0dc7))
- gas price BigInt conversion error in FeeProvider - ([e80a374](https://github.com/BoltzExchange/boltz-backend/commit/e80a3744579f581da1c8f2934f26947571e61714))
- locked funds prometheus metric with PostgreSQL - ([6f0f46c](https://github.com/BoltzExchange/boltz-backend/commit/6f0f46c4f472076fc0531a155799bb18b8c00681))
- make Anvil miner faster - ([3ee2f45](https://github.com/BoltzExchange/boltz-backend/commit/3ee2f4590c7c7d3fa4b5b135673ebf7e31ca703d))
- stats of first month of year - ([e26e8bf](https://github.com/BoltzExchange/boltz-backend/commit/e26e8bfceb68dec3a1e365055b46e01cc8020bdc))
- Python plugin certificate creation test - ([fd9ff9c](https://github.com/BoltzExchange/boltz-backend/commit/fd9ff9caaa59ebcda4fac64a52b506fd85ac04ff))
- allow modded versions of CLN - ([ed7d81f](https://github.com/BoltzExchange/boltz-backend/commit/ed7d81f7c98b1e3d7be9c6574c609bcebaf2cd9d))
- CLN node URIs - ([18de9ee](https://github.com/BoltzExchange/boltz-backend/commit/18de9eef3e45871d2d3af2ef1bc10845237e0490))
- handling of invoices with msat precision (#454) - ([5ea0c82](https://github.com/BoltzExchange/boltz-backend/commit/5ea0c82cfb9ca15eea40bc144544d8b8f611f64a))
- reset LND mission control on interval (#461) - ([b76ce8f](https://github.com/BoltzExchange/boltz-backend/commit/b76ce8f5d14dbb342d606332d7f88906ed15ebcb))
- tests broken by Taproot swaps - ([719f075](https://github.com/BoltzExchange/boltz-backend/commit/719f075e16a4f39807951630f75946814800f8c3))
- wrong status event for eligible swap refund - ([80d0a93](https://github.com/BoltzExchange/boltz-backend/commit/80d0a93ebd8f7c7ee8b786aea5e2ddaa4aed6d12))
- remove "l" from swap id generator (#457) - ([6618abf](https://github.com/BoltzExchange/boltz-backend/commit/6618abfc852fa937c3bf455aea83093772d366d6))
- include RSK in API v2 pairs - ([a3e31f3](https://github.com/BoltzExchange/boltz-backend/commit/a3e31f35892a54cd8b4338f2e8a7b0bc5e7a30bc))
- do not overwrite failure reason when expiring swap - ([46d87df](https://github.com/BoltzExchange/boltz-backend/commit/46d87dfd20d8b584e9c2bb84537cba86f903f6a6))
- API v2 swap routes - ([e9d1ee3](https://github.com/BoltzExchange/boltz-backend/commit/e9d1ee372efe06c44f9d11845a7d97f0f927f0e7))

### Documentation

- misc updates (#429) - ([affd303](https://github.com/BoltzExchange/boltz-backend/commit/affd303bb92ea5670a31d345eaf6a2a52d11939c))
- fix P2SH nested P2WSH hashing - ([0358881](https://github.com/BoltzExchange/boltz-backend/commit/0358881bf9633c0bd49f51cfc9fd7f984285a124))
- redeem script clarification (#463) - ([1a93026](https://github.com/BoltzExchange/boltz-backend/commit/1a93026be0401fb1bcda47597b523b84c2c2d30f))
- swagger specs for API V2 endpoints - ([798b4a7](https://github.com/BoltzExchange/boltz-backend/commit/798b4a72c05395b8c3645eeace71b09294cb4b74))

### Features

- PostgreSQL as database (#425) - ([9b6fff3](https://github.com/BoltzExchange/boltz-backend/commit/9b6fff365aa2f7a962ab7b33f35fb8018602a199))
- mpay plugin prototype - ([e5557e9](https://github.com/BoltzExchange/boltz-backend/commit/e5557e9260c55484665dee232ed35747a19bf3a6))
- try direct channels first in mpay - ([1c9d0ce](https://github.com/BoltzExchange/boltz-backend/commit/1c9d0ce651766b65212b9df161616dfd32c65daa))
- mpay list command - ([e6412f1](https://github.com/BoltzExchange/boltz-backend/commit/e6412f1797c0c7e85489b7318541dbae641db01f))
- reset path memory in mpay - ([e841e32](https://github.com/BoltzExchange/boltz-backend/commit/e841e32466cebcdc40a17667856ceccdb77f30ff))
- refactor route fee calculations - ([8418b60](https://github.com/BoltzExchange/boltz-backend/commit/8418b60764f4763e5a436b5e4f0c0bf4c00123c5))
- gRPC for mpay - ([aab13b4](https://github.com/BoltzExchange/boltz-backend/commit/aab13b4e1d844991e844a1969364d2ee16187aa4))
- SQLite mpay database - ([684c8bf](https://github.com/BoltzExchange/boltz-backend/commit/684c8bf4fc0535a627f0677c6c3d922fb56cfada))
- getswaptransaction for Ethereum chains - ([b354c06](https://github.com/BoltzExchange/boltz-backend/commit/b354c06ed6bbb9bf9a0cfb0c4cfd40a11e9e387f))
- swap node config (#442) - ([5143848](https://github.com/BoltzExchange/boltz-backend/commit/5143848cebf7fa3e9ab217bbd3e5fea66b7317ab))
- mpay route cache (#447) - ([da1b985](https://github.com/BoltzExchange/boltz-backend/commit/da1b985e7be74516c8a6832a1e75176a40fc9881))
- add nodes API v2 (#451) - ([a45d02b](https://github.com/BoltzExchange/boltz-backend/commit/a45d02bed4acc5af3c107010971b4b740fd70e40))
- BIP-21 in invoice memo of reverse swaps (#458) - ([53685a9](https://github.com/BoltzExchange/boltz-backend/commit/53685a98a3577f03b4097091e7e5531bf9895fa9))
- PostgreSQL database backups (#462) - ([13c9b4f](https://github.com/BoltzExchange/boltz-backend/commit/13c9b4f3cd14f1fc863cef11748ef70861b02d96))
- Taproot submarine swaps - ([d19bbc4](https://github.com/BoltzExchange/boltz-backend/commit/d19bbc4b64737069abab6132f69c70540bb60607))
- cooperative Taproot submarine swap refunds - ([f89e6c5](https://github.com/BoltzExchange/boltz-backend/commit/f89e6c5dd77c9371fc91c0d2e08f8853f88e9305))
- Taproot reverse swaps - ([f64d6ae](https://github.com/BoltzExchange/boltz-backend/commit/f64d6aebfff2b7876fd6d83ebb07acf715d33f48))
- uncooperative Taproot swap spend cli - ([59d473b](https://github.com/BoltzExchange/boltz-backend/commit/59d473b39e511e9c0af067b30f34bfa4bc782cf2))
- API v2 pairs - ([b74c5af](https://github.com/BoltzExchange/boltz-backend/commit/b74c5af13aa526f8054dff5ac141a48091a5cd7d))
- chain endpoints in API v2 - ([bacf555](https://github.com/BoltzExchange/boltz-backend/commit/bacf55554543ffe359f9d205f269c42cc314c40b))
- API v2 get submarine swap transaction - ([30ad5f0](https://github.com/BoltzExchange/boltz-backend/commit/30ad5f03184cacf33b5f686283c32ab508528dff))
- API v2 swap status - ([85289bd](https://github.com/BoltzExchange/boltz-backend/commit/85289bdd70ffb1d06dd4dea8aeeec28f653ebb3d))
- mpay to pay invoices - ([3ebed29](https://github.com/BoltzExchange/boltz-backend/commit/3ebed29ce47af912d7e507732b24978539cc0d87))

### GITBOOK-74

- change request with no subject merged in GitBook - ([57cbe4c](https://github.com/BoltzExchange/boltz-backend/commit/57cbe4c7b5c59176ead089233e1c0284e7c0d0e7))

### Miscellaneous Chores

- update changelog for v3.3.0 - ([5bc1470](https://github.com/BoltzExchange/boltz-backend/commit/5bc1470b1b50e8fa68f8204f6de43be57d8c53b0))
- update license for v3.3.0 release (#426) - ([c3a39cf](https://github.com/BoltzExchange/boltz-backend/commit/c3a39cfc9a1334b7452cad572142dd1b39e67fe4))
- minor readme update (#428) - ([3895c01](https://github.com/BoltzExchange/boltz-backend/commit/3895c012a176f18d6b1b637fbbedeb763ac3fa77))
- API landing page favicon (#430) - ([e4671c8](https://github.com/BoltzExchange/boltz-backend/commit/e4671c8473b82ef3d8d8e84308b6c05abd766046))
- update Python dependencies - ([e23f35e](https://github.com/BoltzExchange/boltz-backend/commit/e23f35edb5e9840fa54e2bb407db2c47dd5972a8))
- put MIT license on CLN plugins - ([c04faab](https://github.com/BoltzExchange/boltz-backend/commit/c04faabb24a1730e4ac27b1548723aa8d659d998))
- update to LND v0.17.1-beta - ([abb7973](https://github.com/BoltzExchange/boltz-backend/commit/abb79733c70981c6010ea3ab0804faed87214f63))
- update dependencies - ([acde2e9](https://github.com/BoltzExchange/boltz-backend/commit/acde2e96fd6eb815a953db5f15fd4ca8b1bfa2e2))
- bump LND version to v0.17.2-beta - ([17d6bb9](https://github.com/BoltzExchange/boltz-backend/commit/17d6bb927283d13e51fe9be9201c7739c3eb09b6))
- bump cryptography from 41.0.5 to 41.0.6 in /tools (#438) - ([7ebd2e6](https://github.com/BoltzExchange/boltz-backend/commit/7ebd2e608d0e897b694c62e6cea8c410c3fde28f))
- update dependencies - ([6a4ec39](https://github.com/BoltzExchange/boltz-backend/commit/6a4ec39a252ffb64f9848ca235636d4db8742d1a))
- bump max supported CLN version - ([441da3b](https://github.com/BoltzExchange/boltz-backend/commit/441da3b903abaa47c9caf4c73bf967ebe2474465))
- update Docker images (#444) - ([7613e79](https://github.com/BoltzExchange/boltz-backend/commit/7613e793cde0b3b506529079474aae5dfbec5375))
- bump CLN version to v23.11.1 - ([b21739a](https://github.com/BoltzExchange/boltz-backend/commit/b21739ac69233603946f8a228f70078a967fdc79))
- bump CLN version to v23.11.2 - ([e78529c](https://github.com/BoltzExchange/boltz-backend/commit/e78529ce82ce04cd7248c71ba89a53c31dd7a42c))
- bump follow-redirects from 1.15.2 to 1.15.4 (#456) - ([c4eb4d2](https://github.com/BoltzExchange/boltz-backend/commit/c4eb4d284d4f5620c3b0950d9963aed2476fa31a))
- prettier import sorting - ([f766032](https://github.com/BoltzExchange/boltz-backend/commit/f766032466e876783f1cf504da14d3b6a32d3af9))
- bump GETH Docker image version - ([c5d3c18](https://github.com/BoltzExchange/boltz-backend/commit/c5d3c181ad405199b3b6a408deddddb940f91972))
- generate mpay TypeScript protos - ([6e9fdab](https://github.com/BoltzExchange/boltz-backend/commit/6e9fdabd3e63e49cd6467637ff4aaca63d773eb8))
- changelog for v3.4.0 - ([90ff2bf](https://github.com/BoltzExchange/boltz-backend/commit/90ff2bff8dea0e803b1f1143f4813f7d43738e82))

### Refactoring

- cleanup Python project structure - ([338101f](https://github.com/BoltzExchange/boltz-backend/commit/338101f97c78ee14e483cca49c6f56fb98da0ccb))
- use external SQLAlchemy sessions - ([7777c85](https://github.com/BoltzExchange/boltz-backend/commit/7777c85ae0f0d7eef193cdbe5c65c84e4ae2cf27))
- include exclude check in get_routes - ([ec3eb73](https://github.com/BoltzExchange/boltz-backend/commit/ec3eb73d04346b6779c532a4b5563affc3fcaebf))
- stats queries for PostgreSQL - ([a92a51c](https://github.com/BoltzExchange/boltz-backend/commit/a92a51c1b9f9794fddf6f69a4687da95b832ae38))

### Revert

- RSK in API v2 - ([4a82c9a](https://github.com/BoltzExchange/boltz-backend/commit/4a82c9a3f1850c628ed50c41f87e5f5acc5f9714))

### Tests

- add rudimentary tests for mpay - ([b8adbb2](https://github.com/BoltzExchange/boltz-backend/commit/b8adbb25e9cd5a6e01c6b82fa17dd832cb913974))
- add Taproot related tests - ([a9af144](https://github.com/BoltzExchange/boltz-backend/commit/a9af1446eec6662cb98beb9278d1ad932a4897bf))
- MusigSigner integration test - ([7e1ebed](https://github.com/BoltzExchange/boltz-backend/commit/7e1ebed8b735fff5ac0be772603c15aec59c5294))

---
## [3.3.0](https://github.com/BoltzExchange/boltz-backend/compare/v3.2.1..v3.3.0) - 2023-10-30

### Bug Fixes

- custom integration test runner for CI - ([3da45b0](https://github.com/BoltzExchange/boltz-backend/commit/3da45b03e787ecf1f09afb475d387380635effc1))
- higher invoice CLTV offset for Reverse Swaps - ([fbd6403](https://github.com/BoltzExchange/boltz-backend/commit/fbd64031e6ccebb0b117bf4aa856ea7bf19b8ca8))
- connect nodes for hold invoice test - ([1c1289c](https://github.com/BoltzExchange/boltz-backend/commit/1c1289c312717ecf11bf8f53298afaf754528f22))
- skipped hold invoice plugin tests - ([d3b4614](https://github.com/BoltzExchange/boltz-backend/commit/d3b4614b788dda2d4014f43d299168ce2dc2b56d))
- too short CLTV expiry hold plugin test - ([efbcdbb](https://github.com/BoltzExchange/boltz-backend/commit/efbcdbbd48fac608b13981ad0728787baf62b326))
- Python plugin integration tests on CI - ([e652ce3](https://github.com/BoltzExchange/boltz-backend/commit/e652ce33c074aa4dbefee0b4b9335084bd8f977d))
- CLN to LND short channel id conversion - ([3e1949d](https://github.com/BoltzExchange/boltz-backend/commit/3e1949d5e148211dbdc0870b1eb8a0ce4b778303))
- various CLN bugs (#378) - ([793f05a](https://github.com/BoltzExchange/boltz-backend/commit/793f05a13695dd5068e92edfc27de3e025005c2f))
- CLN pay status gRPC - ([f6960fd](https://github.com/BoltzExchange/boltz-backend/commit/f6960fd19d2568cf8a7f9fe00bf1436659be388f))
- duplicate CLN pay calls - ([de3a832](https://github.com/BoltzExchange/boltz-backend/commit/de3a8327c5b925ece90159d24fe48c6396aa0a45))
- startup without LND - ([7bf3682](https://github.com/BoltzExchange/boltz-backend/commit/7bf36820cbd5ee48aa922b2ee1d04aed8d8b3020))
- route querying for CLN - ([9eccb3d](https://github.com/BoltzExchange/boltz-backend/commit/9eccb3dd7d6645fc775026b287ca66d6a8030e79))
- nested arrays in routing hints endpoint - ([de614bc](https://github.com/BoltzExchange/boltz-backend/commit/de614bc8a737fdf2db8fce7fb09e4469265b2b5d))
- use correct lightning node to query route CLTV estimations - ([af5c035](https://github.com/BoltzExchange/boltz-backend/commit/af5c0353350026f28f8b7457fe3106fed6cce440))
- check for paid invoices in paystatus - ([5ad22ac](https://github.com/BoltzExchange/boltz-backend/commit/5ad22ac064795260c62e7b65acc9e6ed70aff39a))
- check for temporary errors before pending - ([9bfa55c](https://github.com/BoltzExchange/boltz-backend/commit/9bfa55cfa6419f470bf6a5ff7dda73adba5ea814))
- improve detection of pending CLN payments - ([79f8646](https://github.com/BoltzExchange/boltz-backend/commit/79f86468ebfb1d2dc6602ee780d7bcd045892373))
- filter configs with no min wallet balance for notifications - ([9004cda](https://github.com/BoltzExchange/boltz-backend/commit/9004cdabb3875ccfb603d1e4827a19b7ddc5f504))
- reconnect to CLN subscription error on interval - ([1489a3d](https://github.com/BoltzExchange/boltz-backend/commit/1489a3d4015bb41f37512ee4e5268d85bef2ba57))
- retry SQLITE_BUSY error - ([bc4fea9](https://github.com/BoltzExchange/boltz-backend/commit/bc4fea98577b944afb566b04bb66092cee6d3648))
- detect open invoice with only cancelled HTLCs - ([a5a055d](https://github.com/BoltzExchange/boltz-backend/commit/a5a055dc8b3ce1c9e42328b58ccd369aac8b5dcb))
- minor prometheus metric typo - ([a734364](https://github.com/BoltzExchange/boltz-backend/commit/a734364fe89c3e85a01aa1b144ee27e90568d495))
- payment error handling (#417) - ([0a4901c](https://github.com/BoltzExchange/boltz-backend/commit/0a4901c80f1ecd392f319a4bc3ffd056da655c21))
- handling of pending HTLCs for expired invoices (#419) - ([d0c6385](https://github.com/BoltzExchange/boltz-backend/commit/d0c6385227f029fd234ea363ebc37a39fedb9742))
- minor adjustments for RSK compatibility - ([b027e63](https://github.com/BoltzExchange/boltz-backend/commit/b027e63bd74460b3754e2731ffe05cb6a5f79d76))
- CI Docker build workflow - ([852066f](https://github.com/BoltzExchange/boltz-backend/commit/852066fee508970a62f615abe5d0898752f1f07d))
- commit version in Docker image build - ([c2816d0](https://github.com/BoltzExchange/boltz-backend/commit/c2816d0a3b9a76d6bd6c3993f4172bd36d220309))
- default metrics to 0 - ([c7e1915](https://github.com/BoltzExchange/boltz-backend/commit/c7e191556b7e0da5f2683c67b8146b52ac3bccef))
- logging of InjectedProvider - ([d8c27af](https://github.com/BoltzExchange/boltz-backend/commit/d8c27af06acac283c3e83e0ed23689d33e939274))

### Documentation

- minor wording adjustment (#415) - ([9e5eade](https://github.com/BoltzExchange/boltz-backend/commit/9e5eadef8d175da241f5104299781ff28dbfd154))
- uncomment EVM RSK sections (#416) - ([39ccdf3](https://github.com/BoltzExchange/boltz-backend/commit/39ccdf3fa9f3550886e8012ebe862d0a7d6f9db7))
- add API Onion address (#423) - ([0155d52](https://github.com/BoltzExchange/boltz-backend/commit/0155d52caafe01d65b757e29b8dac0c44c97bba3))
- RSK related rewording (#424) - ([a1a9751](https://github.com/BoltzExchange/boltz-backend/commit/a1a9751f0093bc5ac2ca64ebaed1d02e9099648a))

### Features

- increase routing offset based on amount (#372) - ([5039127](https://github.com/BoltzExchange/boltz-backend/commit/5039127aac156307d2dcf8cf464b4450a4fc155d))
- gRPC command to unblind outputs of a transaction (#373) - ([2285372](https://github.com/BoltzExchange/boltz-backend/commit/22853723b5006f7756cbf5d8667121aad4d6497f))
- CLN hld invoice plugin - ([8b9e209](https://github.com/BoltzExchange/boltz-backend/commit/8b9e209fe86adef4e5e3ef06a3a9a6c98cd460d5))
- CLN SCB backup plugin - ([e5e3077](https://github.com/BoltzExchange/boltz-backend/commit/e5e3077a843dc8da82e56c851f064ff32c633ac8))
- MPP support for CLN hold invoice plugin - ([edd77aa](https://github.com/BoltzExchange/boltz-backend/commit/edd77aa54a1b180ab20b7dbf1e9be406b52869e1))
- gRPC for hold invoice plugin - ([540df92](https://github.com/BoltzExchange/boltz-backend/commit/540df92090ac151c0f7ab96bc1a1174d62d6bf48))
- improve hold gRPC error handling - ([679b1e6](https://github.com/BoltzExchange/boltz-backend/commit/679b1e63d17709d0f34eebe2b5d815975f675a06))
- track hold invoice state via gRPC - ([b564f39](https://github.com/BoltzExchange/boltz-backend/commit/b564f396f7f6a87e35f8a1c448ce0f8d0a7a0e8b))
- hold gRPC steam to track all invoices - ([24bf1fc](https://github.com/BoltzExchange/boltz-backend/commit/24bf1fc469bbc61def3094d5decd3591e17a7239))
- routing hints in hold invoice plugin (#375) - ([79a0999](https://github.com/BoltzExchange/boltz-backend/commit/79a0999c8ad2422d7cfa943b78f5225faf77da9b))
- CLN integration in backend - ([e3b8537](https://github.com/BoltzExchange/boltz-backend/commit/e3b853773d014d8de29dfac7846eb09662f58638))
- save creation date of hold invoices - ([ff0df0a](https://github.com/BoltzExchange/boltz-backend/commit/ff0df0a2e91dc46084d7b6013978359659f21555))
- gRPC SSL for hold invoice plugin - ([2884344](https://github.com/BoltzExchange/boltz-backend/commit/2884344b8ad313936999f9f7aac3396cc33f7724))
- support for multiple wallets/nodes in gRPC - ([3e83075](https://github.com/BoltzExchange/boltz-backend/commit/3e83075bc9a766d21aa21bb427f8bf905dede566))
- upload SCB backup on plugin startup - ([f86db5d](https://github.com/BoltzExchange/boltz-backend/commit/f86db5d0ec814dcf6b2808002834a9f03f619934))
- switch between LND and CLN based on referral (#379) - ([5da5cbc](https://github.com/BoltzExchange/boltz-backend/commit/5da5cbcd8fe479275a110cb9c8ab4b778dadfbdc))
- getRoute in hold plugin for specifying max CLTV - ([f743cda](https://github.com/BoltzExchange/boltz-backend/commit/f743cdaca7295f3a355a6c55fa79af171a07ba55))
- apply CLTV exceptions to routing hints - ([aac0c92](https://github.com/BoltzExchange/boltz-backend/commit/aac0c9294088d1d2463e2c85bd514ba10fce6189))
- query swapinfo by more columns (#399) - ([05811c4](https://github.com/BoltzExchange/boltz-backend/commit/05811c48fd9032a45bce86a320413e9f47189104))
- fallback for timeouts when creating invoices (#398) - ([a501908](https://github.com/BoltzExchange/boltz-backend/commit/a501908daf8c46e2a00a55ebc22dd40fbd81ad17))
- separate notification channel for alerts (#400) - ([62eae87](https://github.com/BoltzExchange/boltz-backend/commit/62eae87d0538f25cc4339f92e638a1352bde0547))
- use satcomma to format notification amounts (#403) - ([7e98a75](https://github.com/BoltzExchange/boltz-backend/commit/7e98a7587ffc648e450721207f21926116438315))
- max unused wallet balance alert (#405) - ([7923ae6](https://github.com/BoltzExchange/boltz-backend/commit/7923ae6b38e8f53c892a5a1e40a23eb266a14359))
- forbid swaps to our own lightning nodes - ([95cb46c](https://github.com/BoltzExchange/boltz-backend/commit/95cb46c37db63f94dd9ccd49821873e32e558af4))
- Loki transport for logger (#410) - ([4fef5de](https://github.com/BoltzExchange/boltz-backend/commit/4fef5de3836ebb778cb1262ce7dc664ed8268bad))
- race all locking lightning client calls - ([5bc7249](https://github.com/BoltzExchange/boltz-backend/commit/5bc72494c508df2172c4fbcc33669b7a983ec91a))
- log and send notification for client status changes - ([4c565cd](https://github.com/BoltzExchange/boltz-backend/commit/4c565cd29eb7fc5c3ab426fdf94cd1f1012699db))
- prometheus metrics - ([d6c2bea](https://github.com/BoltzExchange/boltz-backend/commit/d6c2bea7880c7e6d741831d960029a662b558601))
- RSK integration - ([d8b7a60](https://github.com/BoltzExchange/boltz-backend/commit/d8b7a6040eea0f6e638321bd708d4b91922be0ff))
- configurable expiry of reverse swap invoices (#422) - ([9cf91ff](https://github.com/BoltzExchange/boltz-backend/commit/9cf91ff25718eb5a9d003943f04bb5e2ae6c718b))
- save hold HTLC information in datastore - ([e1e08c7](https://github.com/BoltzExchange/boltz-backend/commit/e1e08c7df449ec1914a75e63202c57cac1f045fe))
- query listholdinvoices by invoice - ([a0000d9](https://github.com/BoltzExchange/boltz-backend/commit/a0000d9bdbc351d562d0e06b8aac6e2a3fa14adc))
- prevent invoice overpayment in hold plugin - ([8923b38](https://github.com/BoltzExchange/boltz-backend/commit/8923b388c40c6e80558886db9990d68194bdcd0e))
- throw error when creating invoices with hash length != 32 - ([e0260d3](https://github.com/BoltzExchange/boltz-backend/commit/e0260d35ff5bc1ed2322c65bcf22ecd91a80052d))

### Miscellaneous Chores

- update changelog - ([0ade83c](https://github.com/BoltzExchange/boltz-backend/commit/0ade83c99f365fb6b146e5acc5e0b49f11e781d4))
- speed up tests by disabling global type check - ([5146528](https://github.com/BoltzExchange/boltz-backend/commit/5146528808349df0677aa8f4120316008d9f99c9))
- bump certifi from 2022.12.7 to 2023.7.22 in /tools (#368) - ([dbf3bb1](https://github.com/BoltzExchange/boltz-backend/commit/dbf3bb17561d6cbd0c2110471cb4fe3891001caf))
- update NPM dependencies - ([3c6e7ca](https://github.com/BoltzExchange/boltz-backend/commit/3c6e7ca86d37dcb213e4424b489f56c582df1cf8))
- harden regtest Docker image build - ([b41add2](https://github.com/BoltzExchange/boltz-backend/commit/b41add2e0a3055e791524e9cda487efba8ac74e5))
- enable fast gossip for CLN in regtest image - ([54afef1](https://github.com/BoltzExchange/boltz-backend/commit/54afef1f7df8799c360463823b7074c42c5b0281))
- fix shebang line in Python plugins - ([bb021ec](https://github.com/BoltzExchange/boltz-backend/commit/bb021ecce194e35afb64c4922ded11ae6ef617ba))
- update geth Docker image to v1.12.2 - ([e77ece3](https://github.com/BoltzExchange/boltz-backend/commit/e77ece38c5d907c24d1293d30c84f62445b8f76e))
- bump version to v3.3.0 - ([5fbeef1](https://github.com/BoltzExchange/boltz-backend/commit/5fbeef139bdf74afa851861965d3e46428cf6613))
- bump CLN to v23.08 - ([de89fae](https://github.com/BoltzExchange/boltz-backend/commit/de89faeef862336de60d5ce6941b8af48a464b07))
- update dependencies - ([e862b05](https://github.com/BoltzExchange/boltz-backend/commit/e862b0589605783e23366d998aa033cf9739782e))
- update CLN Docker image - ([03a8705](https://github.com/BoltzExchange/boltz-backend/commit/03a8705fd3833626546051f5987bbd3b83a63dea))
- bump max CLN version - ([b6b47e1](https://github.com/BoltzExchange/boltz-backend/commit/b6b47e12523f2a993fe7643603eb096574bd4dce))
- bump cryptography from 41.0.3 to 41.0.4 in /tools (#384) - ([c386817](https://github.com/BoltzExchange/boltz-backend/commit/c386817d05aed14797c2226e4be8f638c7813eae))
- update dependencies - ([5ace4e1](https://github.com/BoltzExchange/boltz-backend/commit/5ace4e1fe74801a8f0c4570e79a8a95a11f050a6))
- remove docs build status - ([0c54391](https://github.com/BoltzExchange/boltz-backend/commit/0c543910477f89a71cecfa114da8e77c1d1e3b0a))
- bump urllib3 from 2.0.4 to 2.0.6 in /tools (#392) - ([0372a3c](https://github.com/BoltzExchange/boltz-backend/commit/0372a3c2a7500b2ffb668931f163a30e656a97e0))
- update LND to v0.17.0 (#397) - ([7ded9c5](https://github.com/BoltzExchange/boltz-backend/commit/7ded9c5dd1275f85fb9105883aedf88c74eeca44))
- update git-commit-template.txt (#393) - ([b08b092](https://github.com/BoltzExchange/boltz-backend/commit/b08b0929b2a3f79b235d18feaa3bf31db7007615))
- README Update (#389) - ([beae9c2](https://github.com/BoltzExchange/boltz-backend/commit/beae9c2ab06b1010377af00fe3f43e489517ffba))
- push Docker image on push to master - ([656836b](https://github.com/BoltzExchange/boltz-backend/commit/656836bc8d6ddf1814e5b1168aa0cf51668b6ea4))
- push Docker images with latest tag by default (#404) - ([7de4271](https://github.com/BoltzExchange/boltz-backend/commit/7de4271fa0e5d7c4ea1bfaf08e59515bf0097d20))
- remove unused mkdocs dependency - ([66c17be](https://github.com/BoltzExchange/boltz-backend/commit/66c17bed3748df70f48bb8e09a421b453d3258e5))
- bump urllib3 from 2.0.6 to 2.0.7 in /tools (#409) - ([9b99f07](https://github.com/BoltzExchange/boltz-backend/commit/9b99f073ea780f685df9f4dc6199b2918c972d2a))
- bump @babel/traverse from 7.22.8 to 7.23.2 (#411) - ([1870bb2](https://github.com/BoltzExchange/boltz-backend/commit/1870bb2768db843b02dc35f7c5be3876ea96d957))
- update to Bitcoin Core v25.1 - ([2728710](https://github.com/BoltzExchange/boltz-backend/commit/272871077bfbaa63349b7aaefa070e3e60b9539a))
- update dependencies - ([f6124c9](https://github.com/BoltzExchange/boltz-backend/commit/f6124c9fed3506b1a64e8016dbc7055dca1efa37))
- dependency updates - ([c16ca7d](https://github.com/BoltzExchange/boltz-backend/commit/c16ca7dc02a7f989a51406496e548eb923a2f397))
- update dependencies - ([3361b80](https://github.com/BoltzExchange/boltz-backend/commit/3361b80dad9715c90a56d1022ab90c8ea11d9d6e))
- fix .gitattributes - ([c340fc1](https://github.com/BoltzExchange/boltz-backend/commit/c340fc1a1581439ba3d60bb0fc49636e27c5971e))
- switch from black to ruff Python formatter - ([32d8550](https://github.com/BoltzExchange/boltz-backend/commit/32d8550e12dfb740646f9ed6f50dfed4e90ea8f4))
- Python format rule adjustments - ([609c1b7](https://github.com/BoltzExchange/boltz-backend/commit/609c1b7ac3c8fab2bc7a4057c58333caf19d6832))

### Refactoring

- use highest mempool.space fee estimation - ([7c38088](https://github.com/BoltzExchange/boltz-backend/commit/7c38088d9f4770bb882568ce91e2679453352b81))
- use bolt11 Python library - ([8574b2c](https://github.com/BoltzExchange/boltz-backend/commit/8574b2c58cc106151b65e8027f1f1edb5fa904c0))
- update bolt11 library - ([fb79bb9](https://github.com/BoltzExchange/boltz-backend/commit/fb79bb905dae1da00a4383d18ce38b3a8e4c48ce))
- move docs to gitbook - ([33018b6](https://github.com/BoltzExchange/boltz-backend/commit/33018b663329f938803787c80e893f017935dc12))
- getstats command (#402) - ([0c38daf](https://github.com/BoltzExchange/boltz-backend/commit/0c38dafb37f8859ba424c4615dfd2f07823b33bf))
- infer BaseClient log name from service name - ([a6d80bd](https://github.com/BoltzExchange/boltz-backend/commit/a6d80bd2ed67f917a1a18a2d06d4d7b63fe1c479))

### Style

- fix ruff warnings - ([884ffe6](https://github.com/BoltzExchange/boltz-backend/commit/884ffe681039e491ae33a642cb6c9b8b5a7ffd69))

### Tests

- integration test for hold invoice CLN plugin - ([5cc4ffe](https://github.com/BoltzExchange/boltz-backend/commit/5cc4ffeefc58bd573fae2749825d20a84c399df4))
- fix broken tests - ([5a1366c](https://github.com/BoltzExchange/boltz-backend/commit/5a1366c297f4e7a7223992f4a301fa330e05515d))
- fix broken TimeoutDeltaProvider tests - ([5149f02](https://github.com/BoltzExchange/boltz-backend/commit/5149f028a663a6f0ab682c0ffa27d409bdce3e08))
- add missing tests for RSK integration - ([26ef955](https://github.com/BoltzExchange/boltz-backend/commit/26ef9558774be766a3ef1b01df7ba799bb1c3d58))

### Refator

- remove last hardcoded usages of LND client - ([c05f818](https://github.com/BoltzExchange/boltz-backend/commit/c05f818c5a7810ccc16decc7d429f209b95675da))

---
## [3.2.1](https://github.com/BoltzExchange/boltz-backend/compare/v3.2.0..v3.2.1) - 2023-07-19

### Bug Fixes

- use correct Logger for NodeInfo - ([dde81b9](https://github.com/BoltzExchange/boltz-backend/commit/dde81b920ad70db7fe4b03fa71c8eae2f6944eaa))
- remove tslint config - ([4a40c30](https://github.com/BoltzExchange/boltz-backend/commit/4a40c303ca3b270db6dfa8d95a49d9b940fb2206))
- mine block before generating invoices in integration test - ([b727a15](https://github.com/BoltzExchange/boltz-backend/commit/b727a153065a43cbf689ca1f0ac6d1e37f01b250))

### Features

- send latest Swap status on SSE connect - ([572f8db](https://github.com/BoltzExchange/boltz-backend/commit/572f8dbbe6cc6feb4cdf957cfc53d28df752f5f9))
- use queryRoutes to estimate timeout of swaps - ([146f281](https://github.com/BoltzExchange/boltz-backend/commit/146f281830dddffd3506ebde4e2bfa69ce71cf60))

### Miscellaneous Chores

- **(deps)** bump semver from 6.3.0 to 6.3.1 (#364) - ([c7e8c13](https://github.com/BoltzExchange/boltz-backend/commit/c7e8c13abfebca617fbf1845c5371d8ba293fd5f))
- update CHANGELOG.md for v3.2.0 - ([a9cd51a](https://github.com/BoltzExchange/boltz-backend/commit/a9cd51aecb4afc3e2fedbafb94e90534dfb3e5f6))
- update LND to v0.16.4 (#362) - ([6ab3fd6](https://github.com/BoltzExchange/boltz-backend/commit/6ab3fd6aa742af09ef72aad8489097bd6ed83571))
- update ESLint TypeScript plugins - ([0e11b4c](https://github.com/BoltzExchange/boltz-backend/commit/0e11b4cb66a126a2d0b5f7ff5dbe3a8ec27a8585))
- update backend version - ([ada8ad3](https://github.com/BoltzExchange/boltz-backend/commit/ada8ad31954b109d37f2d1cca8f0d1d77e724872))

---
## [3.2.0](https://github.com/BoltzExchange/boltz-backend/compare/v3.1.5..v3.2.0) - 2023-06-30

### Bug Fixes

- stringify of BigInt - ([4553549](https://github.com/BoltzExchange/boltz-backend/commit/45535493e87b6fe05cf11c6820bd091742985a90))
- show output index of Swap transactions - ([1e34b3b](https://github.com/BoltzExchange/boltz-backend/commit/1e34b3bed4330717a108d457149274a6ca4f7d97))
- handle cltv limit should be greater than errors - ([c553bec](https://github.com/BoltzExchange/boltz-backend/commit/c553bec033f25fee15989092f9b4fca9c89a8787))
- allow disabling currencies gracefully - ([2e1a7bc](https://github.com/BoltzExchange/boltz-backend/commit/2e1a7bc2738d49d9653e62c6cad2425cf637533b))
- mininmal amount calculations on interval - ([0552955](https://github.com/BoltzExchange/boltz-backend/commit/05529556dc918fc5b2521af8c290522b83c22154))
- Liquid testnet BIP21 - ([f31b323](https://github.com/BoltzExchange/boltz-backend/commit/f31b323ecb954bc752f87c0575b2d24925744523))
- Liquid transaction sizes - ([8b8d2fc](https://github.com/BoltzExchange/boltz-backend/commit/8b8d2fc475be4a891a49cba0cf4e0c45631de58f))
- allow lower limits on Liquid - ([3577b71](https://github.com/BoltzExchange/boltz-backend/commit/3577b71d64f134a7fb2febe1aba937fe06edf9ef))
- do not throw when WebDAV backup fails - ([f1919df](https://github.com/BoltzExchange/boltz-backend/commit/f1919df2eae68978f5fdeeb34bb72b63e8a9e6ee))
- increase estimated size for Liquid claim transactions - ([136843f](https://github.com/BoltzExchange/boltz-backend/commit/136843fc536e8b183876c4023332654783a499b7))
- broken tests - ([641dd2b](https://github.com/BoltzExchange/boltz-backend/commit/641dd2bbd56c04090ab75c150c2c4e4702909fba))
- crash after LND restart with invoice GC - ([8e6a839](https://github.com/BoltzExchange/boltz-backend/commit/8e6a83923b22398b9880eede7ad5281c9d1f63c7))
- missing initEccLib call to bitcoinjs-lib - ([cd130ad](https://github.com/BoltzExchange/boltz-backend/commit/cd130adc77af4e762a9b69e30370f901eefce4b0))
- handle invoice settlement error - ([ced457f](https://github.com/BoltzExchange/boltz-backend/commit/ced457ff0db7de421d35d9f15368e3ec94c1f35c))
- channel open after successful swap - ([586717e](https://github.com/BoltzExchange/boltz-backend/commit/586717e71fd8b515856d3dc25643212e93549d5e))
- CoreWalletProvider integration test - ([0c1d3b7](https://github.com/BoltzExchange/boltz-backend/commit/0c1d3b7b49516a59199187bb1e4a526097c2fc5d))
- handling replaced swap transactions - ([8ad3481](https://github.com/BoltzExchange/boltz-backend/commit/8ad3481faf092c58f5dd32fd2bafcfafa1f69ea5))
- chain ID serialization - ([9dabe1c](https://github.com/BoltzExchange/boltz-backend/commit/9dabe1cba167fb030cade828e83db2ea991f8db6))
- broken service test - ([e928155](https://github.com/BoltzExchange/boltz-backend/commit/e9281554e6288521f8210800d7c0eb67ba6c0cad))
- Lightning payment reliability (#358) - ([7f9628a](https://github.com/BoltzExchange/boltz-backend/commit/7f9628a5407804a0b4a37db5613dc3e2956b1714))
- swap timeout for cross chain - ([fd59c9d](https://github.com/BoltzExchange/boltz-backend/commit/fd59c9d2e108067b575364b4933e13cc2d539c2c))
- buffer to reach routing hints - ([0f71bed](https://github.com/BoltzExchange/boltz-backend/commit/0f71bed9ef2dc49bf03bd5c2251065fa60b3021f))

### Documentation

- rm ltc sample from /getnodes (#321) - ([84cc573](https://github.com/BoltzExchange/boltz-backend/commit/84cc573ded79f356b48a02418c6abea1dfde6c0a))
- Markdown style fixes - ([79f6db9](https://github.com/BoltzExchange/boltz-backend/commit/79f6db9026ab4003abb2b7e49807d766a4092512))
- update according to changes in Liquid branch - ([395804d](https://github.com/BoltzExchange/boltz-backend/commit/395804d0d9036d4443cfcfe5961f2f5ee1c3aa85))
- update config sample - ([dd91827](https://github.com/BoltzExchange/boltz-backend/commit/dd918274e5341e6a9e2de52ed46c046296a6945a))

### Features

- LND v0.16.0-beta support (#316) - ([af28583](https://github.com/BoltzExchange/boltz-backend/commit/af285833db12976a3866bf216b64152395e9bb6b))
- add boltz-cli command to hash hex values - ([bdf2b72](https://github.com/BoltzExchange/boltz-backend/commit/bdf2b72afc3b096d3fd11b5692d7418901bb767f))
- backups to WebDav (#330) - ([9fe6b22](https://github.com/BoltzExchange/boltz-backend/commit/9fe6b2288b5fc8bec02d49e7e4b5218a55098544))
- Liquid integration - ([3c07b34](https://github.com/BoltzExchange/boltz-backend/commit/3c07b344464b5f5d9fdf2a1fd378edb77778a699))
- Liquid BIP21 - ([8183325](https://github.com/BoltzExchange/boltz-backend/commit/8183325882e9eea091593b3d933787e220e04a7f))
- configurable wallet backend - ([4f27cef](https://github.com/BoltzExchange/boltz-backend/commit/4f27cef187c9a2bb76d2de06f5fae3093e755384))
- Liquid 0.2 sat/vbyte floor - ([85c0fe2](https://github.com/BoltzExchange/boltz-backend/commit/85c0fe2931fc6d13248ceef0e4b69c37b41f4eeb))
- mempool.space API fallbacks - ([75ac107](https://github.com/BoltzExchange/boltz-backend/commit/75ac107e7f062b432200ec72a0f292a39aa630fa))
- blinding key of swaps - ([24e25ec](https://github.com/BoltzExchange/boltz-backend/commit/24e25ec2c31fbd51c60584fbbe360a29afe9206e))
- use Taproot addresses by default in Bitcoin Core wallet - ([7222fec](https://github.com/BoltzExchange/boltz-backend/commit/7222fec48b3d560d682b6c28674cdff0867045c7))
- node stats enpoint - ([ca46cad](https://github.com/BoltzExchange/boltz-backend/commit/ca46cad44a2b85a43e28cdcc24de4c2ba217801a))
- deriving blinding keys via gRPC - ([da44600](https://github.com/BoltzExchange/boltz-backend/commit/da446003525f060c3ef8a7fa7b330cce661e0103))
- API landing page - ([b918a82](https://github.com/BoltzExchange/boltz-backend/commit/b918a82264c352659bd03b761cb3ad3d4c50ff95))

### Miscellaneous Chores

- **(deps)** bump undici from 5.14.0 to 5.19.1 (#309) - ([f09f862](https://github.com/BoltzExchange/boltz-backend/commit/f09f862744dc23eace65c82cc5c85a21c6b7709b))
- **(deps)** bump sequelize from 6.28.0 to 6.28.2 (#310) - ([82c18a3](https://github.com/BoltzExchange/boltz-backend/commit/82c18a30eccd99890fa9ba5a5fa0e213d182a710))
- **(deps)** bump sequelize from 6.28.2 to 6.29.0 (#311) - ([00b536b](https://github.com/BoltzExchange/boltz-backend/commit/00b536bd7f38b5d461f52cf7051de53b2c9579e7))
- **(deps)** bump minimist from 1.2.5 to 1.2.6 (#313) - ([42f1637](https://github.com/BoltzExchange/boltz-backend/commit/42f16370fc126177cd6525aae74687560abe95c5))
- **(deps)** bump @openzeppelin/contracts from 4.8.2 to 4.8.3 (#320) - ([3bcd9ae](https://github.com/BoltzExchange/boltz-backend/commit/3bcd9ae43db64add1bd72fe639bc38cfa727da04))
- **(deps)** bump requests from 2.28.2 to 2.31.0 in /tools (#334) - ([851fdd2](https://github.com/BoltzExchange/boltz-backend/commit/851fdd2cba49349806fb21c91c2fd6b065cb19c9))
- **(deps)** bump @openzeppelin/contracts from 4.8.3 to 4.9.1 (#348) - ([7f8d287](https://github.com/BoltzExchange/boltz-backend/commit/7f8d2879fe6a8ec98f63bd305255b62cdc72b93b))
- **(deps)** bump dottie from 2.0.3 to 2.0.4 (#349) - ([9088daf](https://github.com/BoltzExchange/boltz-backend/commit/9088daf23c3debb1aecef4cdbd84bc6f980ae935))
- **(deps)** bump @openzeppelin/contracts from 4.9.1 to 4.9.2 (#352) - ([711151d](https://github.com/BoltzExchange/boltz-backend/commit/711151df0bb96857eff3cac6f960965b0835a8b3))
- **(deps)** bump fast-xml-parser from 4.2.4 to 4.2.5 (#355) - ([a533fb1](https://github.com/BoltzExchange/boltz-backend/commit/a533fb1b84ba046c46e1331803596e8d9d16922b))
- update changelog - ([e28033b](https://github.com/BoltzExchange/boltz-backend/commit/e28033bee6be9e433a83d4470ffc46326bdf8a33))
- update GitHub CI Action (#312) - ([10a021c](https://github.com/BoltzExchange/boltz-backend/commit/10a021c7a91748b45b8abaa3089b64376fa61896))
- update Docker images - ([cb7cdec](https://github.com/BoltzExchange/boltz-backend/commit/cb7cdec967195ff580f7a3276da0f0524182180c))
- update sqlite3 to 5.1.5 - ([2c774c8](https://github.com/BoltzExchange/boltz-backend/commit/2c774c82649d4da540344ca008095be74a962fb4))
- update CLN Docker image to 23.02.2 - ([c3ede74](https://github.com/BoltzExchange/boltz-backend/commit/c3ede74a95473efeef1c08e723cbc9bb29bc0c3c))
- improve miner_fee script - ([cf69d6f](https://github.com/BoltzExchange/boltz-backend/commit/cf69d6f680351dc914c4a0e2b02accbbbd7a99d1))
- minor style fixes - ([bf57bea](https://github.com/BoltzExchange/boltz-backend/commit/bf57bea14525bc24c9fc2661c34f02c9b5e10af6))
- update boltz Docker image - ([65e42a1](https://github.com/BoltzExchange/boltz-backend/commit/65e42a1d9370f724ee21222680008e19d7e8eb88))
- update LND to 0.16.1-beta (#324) - ([78ad326](https://github.com/BoltzExchange/boltz-backend/commit/78ad326db142a6180c0153a43056efd4ea6ced97))
- update LND to 0.16.2-beta (#328) - ([b80b3ca](https://github.com/BoltzExchange/boltz-backend/commit/b80b3ca5e5b5e9cb21215f74729ae5930040c55a))
- print version on startup - ([50e7227](https://github.com/BoltzExchange/boltz-backend/commit/50e722763eae702aa40d53393f33f2b5d99d9832))
- increasize liquid fees - ([bd2d40a](https://github.com/BoltzExchange/boltz-backend/commit/bd2d40aba0107e7735faff8f8a90f04d60378ad6))
- bump boltz-core-liquid - ([9ef6b89](https://github.com/BoltzExchange/boltz-backend/commit/9ef6b89afa39c6be64b47fd8ec34d728a6caadd5))
- hardcode Liquid tx fee to 0.11 sat/vbyte - ([6008308](https://github.com/BoltzExchange/boltz-backend/commit/6008308481dafba042e5defb5e72c68dd106577b))
- update regtest container - ([2902981](https://github.com/BoltzExchange/boltz-backend/commit/29029815182c825cd0ac105aac554fc77b4d0fe8))
- run prettier on whole project - ([76659bf](https://github.com/BoltzExchange/boltz-backend/commit/76659bf0145c333baf9d626a6208cb2a05557999))
- update Docker images - ([8fdf0bb](https://github.com/BoltzExchange/boltz-backend/commit/8fdf0bb61eebd79cd399ef5428eb571397c41002))
- increase Mempool.space refresh interval - ([c47dd07](https://github.com/BoltzExchange/boltz-backend/commit/c47dd07a6a86279ca66c9db1b736512b8ec8f95f))
- update Eclair Docker image - ([7c3530d](https://github.com/BoltzExchange/boltz-backend/commit/7c3530dafadea4459fe77c7ed9eacce4abfbfd74))
- update dependencies - ([3b4d573](https://github.com/BoltzExchange/boltz-backend/commit/3b4d57339d9594f4bf8382d0eefbb2e9a3d79653))
- revert version to v3.2.0 - ([fe37410](https://github.com/BoltzExchange/boltz-backend/commit/fe37410f747de4030f5a500e07d336ca0e6c58c6))
- bump CI Node.js version (#356) - ([79554ce](https://github.com/BoltzExchange/boltz-backend/commit/79554ceecec7e9e0eec7b778c78276a54baba42d))
- update CLN Docker image to v23.05.2 - ([bdea464](https://github.com/BoltzExchange/boltz-backend/commit/bdea464f73e3a50cb664083b5434ab91059dd781))

### Refactoring

- Dockerfile of backend for tagged image builds - ([1a5d59e](https://github.com/BoltzExchange/boltz-backend/commit/1a5d59ed835f20835f18ea899440ea828dc7132e))
- fee estimation preparation log - ([b5cbcbd](https://github.com/BoltzExchange/boltz-backend/commit/b5cbcbd73e816f14a7c272d307e485867eb66ba7))
- update to Ethers v6 - ([7d45e27](https://github.com/BoltzExchange/boltz-backend/commit/7d45e273b6f9b9cd829caf22364aa6a4a1cb66f3))
- querying statistics - ([72e9c9c](https://github.com/BoltzExchange/boltz-backend/commit/72e9c9cb297ac1cf2c52d53073f4056135899fcd))
- make database repositories static - ([cf1b3ef](https://github.com/BoltzExchange/boltz-backend/commit/cf1b3ef33649f3e776fb14bc7a9dc69c0a01aa76))
- disable RBF for lockup transactions - ([16289e4](https://github.com/BoltzExchange/boltz-backend/commit/16289e47aba9d6de17456fa59b0bab56c1510224))
- set limit of pairs in pair - ([a4aa33a](https://github.com/BoltzExchange/boltz-backend/commit/a4aa33a548b93843a1525c46387fc5b3fac7f66a))

---
## [3.1.5](https://github.com/BoltzExchange/boltz-backend/compare/v2.4.3..v3.1.5) - 2023-02-11

### Bug Fixes

- race condition in fee calculation of ERC20s - ([e99b1b9](https://github.com/BoltzExchange/boltz-backend/commit/e99b1b92412af34719d2f0dcb94f311e95d7d5c8))
- improve Web3 provider initialization - ([65e6b23](https://github.com/BoltzExchange/boltz-backend/commit/65e6b23efc4b07656218815f1a03b5a64c252a5c))
- failure reason detection of SendPaymentV2 - ([430d00a](https://github.com/BoltzExchange/boltz-backend/commit/430d00a482fa485f6d55e8e64e01364189a5aa46))
- query lockup vout in database migration to v2 - ([a3c5467](https://github.com/BoltzExchange/boltz-backend/commit/a3c54673b34928cd76c60f8dbdab70a53a48951e))
- race condition which caused claim transactions not being detected - ([30dadfb](https://github.com/BoltzExchange/boltz-backend/commit/30dadfb3b14b0bd710c18df11929372c83d245bd))
- balance alerts of Ethereum wallets (#224) - ([7e62082](https://github.com/BoltzExchange/boltz-backend/commit/7e620823b0c72fd4caf46af4c0b55248926305e2))
- set payment fee limit (#230) - ([7973fab](https://github.com/BoltzExchange/boltz-backend/commit/7973fabb5c763f8e0ad3ee4c8cdce9a15ef80ac8))
- harden Discord login logic - ([fdc546c](https://github.com/BoltzExchange/boltz-backend/commit/fdc546c7b78c6b865d7cb79945b57c1a9e3cd8a2))
- LND max message length - ([7a602f6](https://github.com/BoltzExchange/boltz-backend/commit/7a602f6fc16aa6014c1968108f72e48f7850b6cf))
- set start height of LND transaction list call - ([54f41b4](https://github.com/BoltzExchange/boltz-backend/commit/54f41b451824f68cd20ddc5c3c24bf8968af06d2))
- timestamp of log messages (#236) - ([07623ea](https://github.com/BoltzExchange/boltz-backend/commit/07623ea4612882553911d69998ca3646f9402d96))
- handle pending lightning HTLCs - ([1c9dc98](https://github.com/BoltzExchange/boltz-backend/commit/1c9dc9869162925020b5dfc63362f772b26b7123))
- pad log timestamps - ([8c7ea40](https://github.com/BoltzExchange/boltz-backend/commit/8c7ea40d90f5dd286e34c90e48267504e14abcd6))
- convert amounts of lockefunds command to whole coins - ([75b81c4](https://github.com/BoltzExchange/boltz-backend/commit/75b81c4ccbce4736b6154286e09db259dac28495))
- retry of channel creation invoice payment - ([a144aaa](https://github.com/BoltzExchange/boltz-backend/commit/a144aaa5dd14d3481b7edcb93e644a0af9c45686))
- error when routing policy is not defined - ([4ed6c06](https://github.com/BoltzExchange/boltz-backend/commit/4ed6c067c7f5f576ea870b828fef2d3894e42333))
- handle failed requests to GasNow - ([31ff40a](https://github.com/BoltzExchange/boltz-backend/commit/31ff40a4ee62a3d6efff9d5c7f0c8836134b2adb))
- double channel opening when connecting to remote node - ([eae72d3](https://github.com/BoltzExchange/boltz-backend/commit/eae72d360ff24165314c213be039e85045446625))
- check routability for disabled channel creations - ([7028ebb](https://github.com/BoltzExchange/boltz-backend/commit/7028ebb5f2736948008ef3a92021c590656e5ae2))
- harden ZMQ connection logic - ([6d4096d](https://github.com/BoltzExchange/boltz-backend/commit/6d4096d8024b162003f6592aba24d37d0466d056))
- harden Reverse Swap lockup confirmation logic (#246) - ([6b37452](https://github.com/BoltzExchange/boltz-backend/commit/6b3745221c2b10eb97c6e8e99f072ae0ab5975a8))
- invoice cancellation on fresh regtest environments - ([080a373](https://github.com/BoltzExchange/boltz-backend/commit/080a37349c861d624ac165bbff3e29ddc6d0905e))
- show method of failed Web3 provider requests (#248) - ([fb14e7f](https://github.com/BoltzExchange/boltz-backend/commit/fb14e7f8df1229a49ea9602e6fa6787d36ee569e))
- handle rejections (#249) - ([89152b1](https://github.com/BoltzExchange/boltz-backend/commit/89152b10b8aa2ccdc6bde75d9ca37ef1b7f487b6))
- GasNow WebSocket timeouts - ([c6b34e5](https://github.com/BoltzExchange/boltz-backend/commit/c6b34e56162d1135f38641c62a92435f24d708c3))
- stuck GasNow WebSocket - ([d7a9c9e](https://github.com/BoltzExchange/boltz-backend/commit/d7a9c9e9dc47580c3f85cd5af629ed046ae10c0b))
- handle invoices already cancelled by LND - ([b652b57](https://github.com/BoltzExchange/boltz-backend/commit/b652b57139de8ed567903a88b57db68fd21cc539))
- foreign key of channel creations - ([1d981f8](https://github.com/BoltzExchange/boltz-backend/commit/1d981f8965c64a52d45091b992caa8efdbc1338d))
- handle GasNow WebSocket errors - ([9d2fcd3](https://github.com/BoltzExchange/boltz-backend/commit/9d2fcd310151057d19062e51704797bb3b5d121c))
- still allow LND v0.12 - ([8521707](https://github.com/BoltzExchange/boltz-backend/commit/852170765d1c27ee9dac97eba5d7483278a5bcf5))
- update dependencies - ([1de1a5f](https://github.com/BoltzExchange/boltz-backend/commit/1de1a5feb6b3c430bab9f0fffddabe04cbb5f532))
- redundant check for confirmed lock transactions - ([1ec7464](https://github.com/BoltzExchange/boltz-backend/commit/1ec7464fc0678d76a769021667d907ab54002ecf))
- increase invoice payment timeout - ([5c995bd](https://github.com/BoltzExchange/boltz-backend/commit/5c995bdcc11f05662e4d602a82c63fc28c156949))
- more verbose backup upload failure logs (#260) - ([bb25238](https://github.com/BoltzExchange/boltz-backend/commit/bb25238fa2425e4abaf88d823785de6fc65e281c))
- endless channel backup reconnection loop - ([f9bc5d7](https://github.com/BoltzExchange/boltz-backend/commit/f9bc5d783e6ed32688f2678111a0412a2123627a))
- add missing port to startRegtest.sh (#280) - ([10a94ca](https://github.com/BoltzExchange/boltz-backend/commit/10a94ca37da9106e9d1b6eb1fc61611d6202ee67))
- reject AMP invoices for swaps (#289) - ([08bc278](https://github.com/BoltzExchange/boltz-backend/commit/08bc278971b1aeeda5a3adbe4df66c88e3c36806))
- prepay minerfee race condition - ([5d84fc7](https://github.com/BoltzExchange/boltz-backend/commit/5d84fc778120b7a38c01d4215614ee82760d0eff))
- missing -f parameter to docker build (#296) - ([0795dc8](https://github.com/BoltzExchange/boltz-backend/commit/0795dc8dd36da31bf32a35482b7e3e23afdfb556))
- ARM64 boltz-backend Docker build - ([e4f705a](https://github.com/BoltzExchange/boltz-backend/commit/e4f705aea37a3477e7d2b54a6f18603ce1622bd4))
- parsing of invalid Bitcoin addresses - ([07fed7a](https://github.com/BoltzExchange/boltz-backend/commit/07fed7aadbb7750f420e5edb417a6587885b7867))
- max CLTV delta for lightning payments - ([4b09d5b](https://github.com/BoltzExchange/boltz-backend/commit/4b09d5b40318cda1c2d437eb9a4ab9efa04b30d8))
- CLTV delta for cross chain swaps - ([809a3a9](https://github.com/BoltzExchange/boltz-backend/commit/809a3a9e1e4924ed54e82dbabf1697d4cf37827d))
- cross chain CLTV delta for Ethereum - ([22ac8ba](https://github.com/BoltzExchange/boltz-backend/commit/22ac8ba660204a44acab21c104f22177e7127792))
- add check for minimal CLTV limit - ([c6a846b](https://github.com/BoltzExchange/boltz-backend/commit/c6a846bcd09c48fdd29428809ea5a23b6b34f7a3))

### Documentation

- update for v3.1.0 - ([8373f13](https://github.com/BoltzExchange/boltz-backend/commit/8373f1342498af77af42c66168dbced6dd38e09a))
- request authentication and querying referrals - ([a77997a](https://github.com/BoltzExchange/boltz-backend/commit/a77997aa096ff40e51a8ad77d67c464648da64ff))
- add note that API is not accessible from browser (#295) - ([f14068b](https://github.com/BoltzExchange/boltz-backend/commit/f14068b7bfd9df56914b6d79173777ab3fa2c980))
- minor wording fix - ([6edaa89](https://github.com/BoltzExchange/boltz-backend/commit/6edaa898b7cb2361b810bb498d8132b7bcff4fc2))

### Features

- improve balance check notifications - ([c4d9938](https://github.com/BoltzExchange/boltz-backend/commit/c4d9938f7f33e548fdcbebec3ed116d0cfd30b81))
- add timeout to requests to web3 provider - ([f2a2859](https://github.com/BoltzExchange/boltz-backend/commit/f2a2859a32af9fb4cbb816085ef3911229659a7e))
- group stats by year - ([c244b3e](https://github.com/BoltzExchange/boltz-backend/commit/c244b3e842c91523b275b793db5041e9a6635c71))
- split long Discord message in multiple parts - ([9317666](https://github.com/BoltzExchange/boltz-backend/commit/9317666ec2c95ea1574f57efd7d33edf5313a95c))
- show ids of swaps for which coins are locked (#233) - ([658476c](https://github.com/BoltzExchange/boltz-backend/commit/658476cceb4a2a670aafe77e9fba58f59e216749))
- add provider for Bitcoin Core wallet (#235) - ([73131bf](https://github.com/BoltzExchange/boltz-backend/commit/73131bf32d6cbb37c85edb390ac0a40b9796bdbd))
- allow client to request private routing hints - ([28f3856](https://github.com/BoltzExchange/boltz-backend/commit/28f38569398ecfb3c013175d4a479e67a504c1f1))
- allow clients to fetch routing hints - ([887e1f1](https://github.com/BoltzExchange/boltz-backend/commit/887e1f150cbd061db9f9e70cc01dc7baba8c97a4))
- update to swap contracts v2 - ([e5cb02d](https://github.com/BoltzExchange/boltz-backend/commit/e5cb02df1e322021231d7894f20d8ad6afecdea7))
- add Ethereum prepay miner fee - ([b646dbe](https://github.com/BoltzExchange/boltz-backend/commit/b646dbe3c4df7212b855b0c65a9f9cf26ce82f71))
- cancel pending HTLCs for expired prepay invoices - ([d736033](https://github.com/BoltzExchange/boltz-backend/commit/d736033361d2aa06846461ed11d0f4b14cd3689e))
- allow to specify onchain amount when creating Reverse Swaps - ([6f3cbf4](https://github.com/BoltzExchange/boltz-backend/commit/6f3cbf41ece223f0c6d819e06cc3070382a49aa7))
- add user/password RPC authentication again - ([f0c7ec7](https://github.com/BoltzExchange/boltz-backend/commit/f0c7ec78ddc59c70d3ab98abf5ab5ba8a6677df0))
- improve invoice cancellation logic - ([688a818](https://github.com/BoltzExchange/boltz-backend/commit/688a818e4a072b15457c899ac18e009f15c64041))
- switch to GasNow WebSocket (#247) - ([a8dc34b](https://github.com/BoltzExchange/boltz-backend/commit/a8dc34b4a31f8974aa01132f6db194b13ae96f01))
- add mempool.space based fee estimates - ([7c4b90d](https://github.com/BoltzExchange/boltz-backend/commit/7c4b90def0fd80c0fca300f1c9e7861c0ae3cb34))
- adjust minimal limits based on miner fees (#253) - ([c76971c](https://github.com/BoltzExchange/boltz-backend/commit/c76971c233df0c5083dbf969978f3183d0a5dedc))
- add referral fee - ([1b308d2](https://github.com/BoltzExchange/boltz-backend/commit/1b308d2a372a3be27996bfef298920955aa823e4))
- send Ethereum type 2 transactions - ([5722b07](https://github.com/BoltzExchange/boltz-backend/commit/5722b07d3a4aacb4297ca97070380f84bc80b7e0))
- add referral API keys and secrets - ([27a060d](https://github.com/BoltzExchange/boltz-backend/commit/27a060d97894885dfb8187514d00eceebc4a8189))
- add HMAC API authentication - ([7f671b8](https://github.com/BoltzExchange/boltz-backend/commit/7f671b88052da14c6dbcd375a755fd8e2c4f1961))
- add API endpoint to query referrals - ([0c812a9](https://github.com/BoltzExchange/boltz-backend/commit/0c812a93e918384b9cef65f5d2b063c594e1faab))
- API endpoint to query swap timeouts - ([c0f4cfb](https://github.com/BoltzExchange/boltz-backend/commit/c0f4cfb8fc2255f9ae9f00421b4fd2f1a4aed8c5))
- allow configuring ZMQ endpoints - ([8c9eb7f](https://github.com/BoltzExchange/boltz-backend/commit/8c9eb7f39be3756ca627d54c6a5f31f591cff512))
- add elements to docker regtest (#269) - ([4e1466f](https://github.com/BoltzExchange/boltz-backend/commit/4e1466f48f5fef30f55bb931ec4c7ea8f7a81e0b))
- set max payment fee ratio for LND (#299) - ([c620679](https://github.com/BoltzExchange/boltz-backend/commit/c62067994a8b8ba7c6e2c09197ddab249ec50903))
- swapIn fee (#305) - ([cc69389](https://github.com/BoltzExchange/boltz-backend/commit/cc69389876685c22b67e929d06874caf9ec1bb66))
- allow setting feePerVbyte and timeoutBlockHeight in CLI tooling - ([3b99058](https://github.com/BoltzExchange/boltz-backend/commit/3b99058f19dd5d5545bc5d5767fb4cbefe92cf36))

### Miscellaneous Chores

- **(deps)** bump ini from 1.3.5 to 1.3.8 (#228) - ([a381315](https://github.com/BoltzExchange/boltz-backend/commit/a3813158375ff51ee8f7418d25e0ac2e3492008d))
- **(deps)** bump node-notifier from 8.0.0 to 8.0.1 (#229) - ([256fe20](https://github.com/BoltzExchange/boltz-backend/commit/256fe20844d20364782bbe157d319b66b3d1c545))
- **(deps)** bump date-and-time from 0.14.1 to 0.14.2 (#231) - ([498d2bc](https://github.com/BoltzExchange/boltz-backend/commit/498d2bc7fb267bdf03912ef0a3b32acbc3138f17))
- **(deps)** bump urllib3 from 1.26.4 to 1.26.5 in /tools (#255) - ([75fc674](https://github.com/BoltzExchange/boltz-backend/commit/75fc67471c024a19d5abed05021f7db51b2dce54))
- **(deps)** bump mkdocs from 1.2.2 to 1.2.3 in /tools (#266) - ([d88ac3d](https://github.com/BoltzExchange/boltz-backend/commit/d88ac3d35f4d51bd2832c923cdf8f9e0f84459cc))
- **(deps)** bump moment-timezone from 0.5.34 to 0.5.37 (#294) - ([7efec83](https://github.com/BoltzExchange/boltz-backend/commit/7efec836cf71056fb2746f9d67cbf7d24fbdf55a))
- **(deps)** bump http-cache-semantics from 4.1.0 to 4.1.1 (#306) - ([3d6257b](https://github.com/BoltzExchange/boltz-backend/commit/3d6257b92a9419068c68e1c75a7050e7222cd2a9))
- decrease LND payment timeout to 15 seconds - ([9a34643](https://github.com/BoltzExchange/boltz-backend/commit/9a34643941e9361bfbab1b087906cd5f5d1bf3b8))
- update GETH to v1.9.25 - ([61684a7](https://github.com/BoltzExchange/boltz-backend/commit/61684a746bae0830f8b4cd9fbdd5da69d3319ec1))
- update LND to v0.12.0 - ([1d76336](https://github.com/BoltzExchange/boltz-backend/commit/1d76336b821f4e646b025e83a582374394af77a5))
- update Docker images - ([7895c5f](https://github.com/BoltzExchange/boltz-backend/commit/7895c5fb785728cf99bdbc26069f7b342c67d218))
- run Github actions only against Node v14 - ([3e6af5c](https://github.com/BoltzExchange/boltz-backend/commit/3e6af5cb4cd57631beba2f43db4d76d307b33bf3))
- update to LND v0.12.1 - ([07d62eb](https://github.com/BoltzExchange/boltz-backend/commit/07d62eb57bd6ce9c993dfe65968671ffdc3cd8cf))
- update Zcash to v4.3.0 - ([4455dd0](https://github.com/BoltzExchange/boltz-backend/commit/4455dd04d6b1e13e099a056ae39869a9dda15342))
- update GETH to v1.10.0 - ([d0c886f](https://github.com/BoltzExchange/boltz-backend/commit/d0c886f244cae00019f60c022e4232a23847a856))
- update GETH to v1.10.1 - ([d625a30](https://github.com/BoltzExchange/boltz-backend/commit/d625a3081a19b30c001298c413934cceb47fce60))
- update dependencies - ([97c4a2b](https://github.com/BoltzExchange/boltz-backend/commit/97c4a2bc1785f95d5e8a4dd8ef3beaf0f3e5adab))
- update Python dependencies - ([c8b02dc](https://github.com/BoltzExchange/boltz-backend/commit/c8b02dc6f16074085b5b951ae9a07ae46fe75b8b))
- update dependencies (#251) - ([ec72aee](https://github.com/BoltzExchange/boltz-backend/commit/ec72aee601c77adcc460c483c6c6c95b62c1133d))
- update NPM dependencies - ([4f77051](https://github.com/BoltzExchange/boltz-backend/commit/4f77051b9cc462b9d08351b09e66d007d8670fa2))
- update NPM dependencies - ([44d669d](https://github.com/BoltzExchange/boltz-backend/commit/44d669dfafc599cf7b71c79e1b3fdefae7eade77))
- fix build (#256) - ([59d7a3a](https://github.com/BoltzExchange/boltz-backend/commit/59d7a3a5b5d2c5688bdd01da6517efc7ffb74e50))
- update dependencies - ([c8da59a](https://github.com/BoltzExchange/boltz-backend/commit/c8da59a41f75f921850d11977050f457369cd55e))
- update dependencies - ([5999854](https://github.com/BoltzExchange/boltz-backend/commit/59998542c0360e3e3776907eb16ca8c588ba3638))
- switch to grpc-js - ([a547c2c](https://github.com/BoltzExchange/boltz-backend/commit/a547c2ca39b5a6acf2e80a41cd6296c7ddeb42cf))
- update dependencies - ([f6f528a](https://github.com/BoltzExchange/boltz-backend/commit/f6f528a5b9af383badf618909940699f10c700fc))
- dependency updates - ([cb3ff1e](https://github.com/BoltzExchange/boltz-backend/commit/cb3ff1e505f4206bac488c65c1b7dbea63d39f29))
- update GETH to v1.10.9 - ([94f46e9](https://github.com/BoltzExchange/boltz-backend/commit/94f46e9870e4db2882a698049b17dbe6129741df))
- update LND to v0.13.3-beta (#263) - ([35e5730](https://github.com/BoltzExchange/boltz-backend/commit/35e57300aa6e855b2000dfc2a8faaf72b4ef2f6c))
- update dependencies - ([d58cb65](https://github.com/BoltzExchange/boltz-backend/commit/d58cb659ac6d1bab377e29186f470df9b1b9cc37))
- fix lint errors - ([5527fbb](https://github.com/BoltzExchange/boltz-backend/commit/5527fbb50b2766ba953d2309f06e36926faf8be7))
- update c-lightning image to v0.10.2 - ([3a12239](https://github.com/BoltzExchange/boltz-backend/commit/3a122397a26c7944dea73c073fb8b9e6cbcbbd50))
- update to Node v16 (#267) - ([f0524fd](https://github.com/BoltzExchange/boltz-backend/commit/f0524fdd1b8632f3f436119d31319f9723a0fac8))
- update dependencies - ([bb8c850](https://github.com/BoltzExchange/boltz-backend/commit/bb8c850d9c9b81662885a43c58621e903741903d))
- update Docker images - ([0ddd1a4](https://github.com/BoltzExchange/boltz-backend/commit/0ddd1a45d0a348b27940e7f6fcb437c7611d2fbc))
- update dependencies - ([a3f8571](https://github.com/BoltzExchange/boltz-backend/commit/a3f85714eae85417f5cd77083ff1fc7acef6b939))
- Docker images for linux/arm64 - ([5a6b448](https://github.com/BoltzExchange/boltz-backend/commit/5a6b44852e84869e00bdd7fdf3386f58f1536e23))
- allow specifying organisation in Docker build script - ([1320014](https://github.com/BoltzExchange/boltz-backend/commit/13200147c055913ec295aac3986c379f683da09f))
- update Docker images - ([490d2a6](https://github.com/BoltzExchange/boltz-backend/commit/490d2a605bd7dae20a795607d61f5c722ab42054))
- update to LND 0.14.2-beta (#274) - ([f0f96da](https://github.com/BoltzExchange/boltz-backend/commit/f0f96da344e1524d571d077d92eec980874134fe))
- add docker image for boltz-backend (#285) - ([fa95b8e](https://github.com/BoltzExchange/boltz-backend/commit/fa95b8eb88cba581db531843d4872477d33656ee))
- add security.md (#287) - ([e365e18](https://github.com/BoltzExchange/boltz-backend/commit/e365e18a6733221b0a699c56a879a195a86e776f))
- Docker image updates - ([66c6cd4](https://github.com/BoltzExchange/boltz-backend/commit/66c6cd4a3027cca2a4ecfb8667ee2cf378a3806d))
- NPM dependency updates - ([5c1030a](https://github.com/BoltzExchange/boltz-backend/commit/5c1030a47d141c5f591338ead19085755a5bb9bd))
- minor wording fixes - ([fc99ed8](https://github.com/BoltzExchange/boltz-backend/commit/fc99ed8ca8c7f59d7e0517bb148a81102ce60876))
- add docker aliases script (#282) - ([d41cdab](https://github.com/BoltzExchange/boltz-backend/commit/d41cdabb3c9fb8a0ebd5508c8081fb0da7e56ae3))
- update LND to v0.15.0 - ([0efe103](https://github.com/BoltzExchange/boltz-backend/commit/0efe103eae20f4bfee85da8e33be1c2d1434bdb9))
- update protos for LND 0.15.0 - ([6e90d44](https://github.com/BoltzExchange/boltz-backend/commit/6e90d44c8528b452006d172fb3719f60ea97dd91))
- bump max LND version 0.15.1 - ([1631b3c](https://github.com/BoltzExchange/boltz-backend/commit/1631b3c997c1a9231a59f5570a61427761180b8f))
- update Docker images - ([5ff96a9](https://github.com/BoltzExchange/boltz-backend/commit/5ff96a9a6af4921f7ede211a8cc74f26edee1f48))
- update Dockerfile for Boltz backend - ([d5f27f9](https://github.com/BoltzExchange/boltz-backend/commit/d5f27f98a918c45593c455da386ab9d013a9ea88))
- update dependencies - ([b0e3606](https://github.com/BoltzExchange/boltz-backend/commit/b0e3606262d4f0a312b25266e219781bd99846c2))
- update Docker images to LND 0.15.2-beta - ([90a9029](https://github.com/BoltzExchange/boltz-backend/commit/90a9029eb377506a10ece5f7b058edf4ba981f28))
- set max LND version to 0.15.3 - ([7b999d7](https://github.com/BoltzExchange/boltz-backend/commit/7b999d79d241af4b433c283849db15f9e40f9989))
- update LND Docker image to v0.15.3 - ([4ba0847](https://github.com/BoltzExchange/boltz-backend/commit/4ba08474e19f5e687023305df187df264d730973))
- update LND to v0.15.4 - ([5698f29](https://github.com/BoltzExchange/boltz-backend/commit/5698f29ca02db1de7e53051ca7f0ae49175a9a64))
- update Docker images - ([13e636a](https://github.com/BoltzExchange/boltz-backend/commit/13e636acaeef9c7531dcf0d255a34fd7c0ae6762))
- update Docker images - ([8114473](https://github.com/BoltzExchange/boltz-backend/commit/8114473b35a4e2776f7ded595bdbd0dac9491b35))
- update regtest Docker image - ([b226ca6](https://github.com/BoltzExchange/boltz-backend/commit/b226ca672d29b05f3b9ba9b8ba12cc0019ccc479))
- update vulnerable dependencies - ([bf33de0](https://github.com/BoltzExchange/boltz-backend/commit/bf33de0d57009cb1d84e8ab961f642cb67c1588b))
- update dependencies - ([c13d613](https://github.com/BoltzExchange/boltz-backend/commit/c13d613db86359c62f5431a11147660ee4a12d22))
- add SQL scripts to query stats - ([f0cf513](https://github.com/BoltzExchange/boltz-backend/commit/f0cf51348b1f44cd5d818b5868861c28ca4ea619))
- show TX ID when it cannot be found - ([20800d8](https://github.com/BoltzExchange/boltz-backend/commit/20800d8ffd38cb4fccb0c76f4248ea0c85876e66))
- update dependencies - ([453f83a](https://github.com/BoltzExchange/boltz-backend/commit/453f83ad07ff77bf2ce1395393c9193a7790326b))

### Refactoring

- remove all GasNow code - ([aa26f36](https://github.com/BoltzExchange/boltz-backend/commit/aa26f365d00d0577dde7d281808d33861e3a30bc))
- cache LND node URIs - ([63dc44b](https://github.com/BoltzExchange/boltz-backend/commit/63dc44bfb9e8342888ab1d3d93b56402629cb538))
- switch from WebSocket to HTTP Web3 providers - ([0f6ae39](https://github.com/BoltzExchange/boltz-backend/commit/0f6ae392c294545120365c68590e85a2ad755552))
- remove native dependency for disk usage - ([a80b2e1](https://github.com/BoltzExchange/boltz-backend/commit/a80b2e183fb8f186a9ea28c9eaac8343563b5236))
- use poetry for Python dependencies - ([4a14bc7](https://github.com/BoltzExchange/boltz-backend/commit/4a14bc774f1c4a4193b0834a5e4eb2f46f661ef1))

### Tests

- add case for gRPC messages longer than the default limit - ([9ab1380](https://github.com/BoltzExchange/boltz-backend/commit/9ab13802229447ffb1ba6c02b5cf9cb9e55dd390))
- fetch contract addresses dynamically - ([f2f16ad](https://github.com/BoltzExchange/boltz-backend/commit/f2f16ad04620962db17683d5cdd682bfedb752f6))
- comment out Binance price oracle test - ([3d72851](https://github.com/BoltzExchange/boltz-backend/commit/3d7285169a5d69409822cfb60b54bc0d6db183b3))
- add case for decoding of invalid addresses - ([076c1bb](https://github.com/BoltzExchange/boltz-backend/commit/076c1bbee8fda80c7b472fab9ac5c89d09a4e594))

---
## [2.4.3](https://github.com/BoltzExchange/boltz-backend/compare/v2.4.2..v2.4.3) - 2020-11-19

### Bug Fixes

- use miner fees shown in API - ([95631d3](https://github.com/BoltzExchange/boltz-backend/commit/95631d34feffd78e7ac9be42bb7dfa0d1caea1ec))

### Documentation

- catch up with Ethereum branch - ([34b3913](https://github.com/BoltzExchange/boltz-backend/commit/34b39130297b5fc61feda15c4ff5148f31abe99a))
- add pairHash documentation - ([f25bdf4](https://github.com/BoltzExchange/boltz-backend/commit/f25bdf41e2850c744948213161c0c19e5d99e15f))

### Features

- make swap status updates more consistent - ([f837735](https://github.com/BoltzExchange/boltz-backend/commit/f83773552b97cfe9300cd0f3ec74778be5fa03eb))
- improve injected web3 provider - ([24c84d2](https://github.com/BoltzExchange/boltz-backend/commit/24c84d2dd88d5d66f1ba6cba2efea029a0a4e2d6))
- add CLI command to derive keys - ([f2071db](https://github.com/BoltzExchange/boltz-backend/commit/f2071dbc562f1abe7e20cc6817092eb469995830))
- return refund address for Ethereum Reverse Swaps - ([154c0c7](https://github.com/BoltzExchange/boltz-backend/commit/154c0c7b78d84cb87852663321d55e530c3fcb4a))
- expose Ethereum network identifier in API - ([78f4f8d](https://github.com/BoltzExchange/boltz-backend/commit/78f4f8db66c89b82817d2bd9985f4b95141218e1))
- add tests for UtxoNursery - ([0faf2e2](https://github.com/BoltzExchange/boltz-backend/commit/0faf2e2568435b6ac778f430e38f546e22dcf032))
- add CLI tool to migrate database - ([00e7ad6](https://github.com/BoltzExchange/boltz-backend/commit/00e7ad6fa9745c95553a79efd7b808ea3fd9dfce))
- group volume by month in stats command - ([a0aa322](https://github.com/BoltzExchange/boltz-backend/commit/a0aa322eb6af45f81af1a61e6e662d715ebfa46e))
- add support for Infura as eth provider - ([81de0d4](https://github.com/BoltzExchange/boltz-backend/commit/81de0d4bbd40da4fe19dcb0703e62de13a5d7f8b))
- use SendPaymentV2 with up to 3 parts - ([f75d08e](https://github.com/BoltzExchange/boltz-backend/commit/f75d08ec11d6e9f576283ff1d67a648a2b273116))
- query routes in a MPP compatible way - ([4a226ad](https://github.com/BoltzExchange/boltz-backend/commit/4a226ada63afc5ade1a1c54762fe119449541ed4))
- remove ambiguous id possibilities - ([a88df2c](https://github.com/BoltzExchange/boltz-backend/commit/a88df2cc48fc487ceb2ddb1354bd2f015aae1438))
- implement pair hash check - ([f8cdcbe](https://github.com/BoltzExchange/boltz-backend/commit/f8cdcbe286fc1d8a7e3e02358f463876b2305df0))

### Miscellaneous Chores

- update Eclair to v0.4.2 - ([c1bcc6d](https://github.com/BoltzExchange/boltz-backend/commit/c1bcc6d4833dc73bac3879c3c6dbcb3d5645a59f))
- update GETH to v1.9.23 - ([7bd46a9](https://github.com/BoltzExchange/boltz-backend/commit/7bd46a9615692e1b4dd9121ac100bf8ff47097bc))
- run CI with Node v15 - ([ec2cfd8](https://github.com/BoltzExchange/boltz-backend/commit/ec2cfd84140acbcac03a732d0cd920da44446355))
- update Docker images - ([19ba725](https://github.com/BoltzExchange/boltz-backend/commit/19ba72532b7a56877fe2695d657636e3cf96aa9e))
- update GETH to v1.9.24 - ([bac911e](https://github.com/BoltzExchange/boltz-backend/commit/bac911e60eb60c9874b84eb1239a15a03567e76b))
- update Zcash to v4.1.1 - ([f7f57b7](https://github.com/BoltzExchange/boltz-backend/commit/f7f57b70b001e4eaf0afe3f86de9cdb70482a89c))
- update changelog - ([10fad5f](https://github.com/BoltzExchange/boltz-backend/commit/10fad5fc0cb5599afc5833a2fd40c35584e26914))

### Tests

- add unit tests for LightningNursery - ([b9ac67b](https://github.com/BoltzExchange/boltz-backend/commit/b9ac67b10ea4ee92088993085f351f9aa7de9e58))
- add unit test for EthereumNursery - ([42a1c18](https://github.com/BoltzExchange/boltz-backend/commit/42a1c1853b372896c9848a267522f7b21562973d))
- add ETH and USDT test cases to FeeProvider - ([c196154](https://github.com/BoltzExchange/boltz-backend/commit/c1961545019362cd204e3ae8ce80886e572268ea))

---
## [2.4.2](https://github.com/BoltzExchange/boltz-backend/compare/v2.4.1..v2.4.2) - 2020-10-10

### Bug Fixes

- update to LND v0.11.1 - ([acff8e7](https://github.com/BoltzExchange/boltz-backend/commit/acff8e73a7b7ced7aec89c5148565fd0c53be46b))

### Features

- expose token contracts addresses in API - ([3fefc83](https://github.com/BoltzExchange/boltz-backend/commit/3fefc83142c26745e4dad9d6c79e73a24af7cd19))
- query Ethereum Swap values from lockup transcation - ([c939532](https://github.com/BoltzExchange/boltz-backend/commit/c939532f071abc2fa75e34a33b9b794fb6deecbd))
- add fallback web3 provider - ([3fa8288](https://github.com/BoltzExchange/boltz-backend/commit/3fa82880459a392e33019425f7437cc37264015f))
- switch to Bitcoin and Litecoin Core cookie authentication - ([f77dbc3](https://github.com/BoltzExchange/boltz-backend/commit/f77dbc30d672e8cb50f4db2b611d23cc16447d74))

### Miscellaneous Chores

- fix publish script - ([0d6ca2d](https://github.com/BoltzExchange/boltz-backend/commit/0d6ca2db05cc9225462e3bda6b2ab9afa6a9627f))
- update GETH to v1.9.22 - ([ba47828](https://github.com/BoltzExchange/boltz-backend/commit/ba47828693e3cb6740a397086ecc69f5b286aafa))
- update LND to v0.11.1-beta - ([bd850c1](https://github.com/BoltzExchange/boltz-backend/commit/bd850c12dd7f896373aca54f6927039d5023ef61))
- switch from IERC20 to ERC20 ABI - ([7965be0](https://github.com/BoltzExchange/boltz-backend/commit/7965be054adf7743f8731e728bde377a535c9d4e))
- bump version to v2.4.2 - ([fdd36a1](https://github.com/BoltzExchange/boltz-backend/commit/fdd36a1b6668facd4bf1dd763c67a6d341c5413d))

---
## [2.4.1](https://github.com/BoltzExchange/boltz-backend/compare/v2.4.0..v2.4.1) - 2020-09-22

### Bug Fixes

- handle changed node locktime error - ([f43e66a](https://github.com/BoltzExchange/boltz-backend/commit/f43e66a3ded8774e5d3a6b544f5dbedd9a41dbb1))
- retry channel opening when remote node is syncing - ([1c71e1b](https://github.com/BoltzExchange/boltz-backend/commit/1c71e1beac453f3c5bc419591b486b52c89c223b))
- set rate for unconfirmed Swap outputs - ([305c9bd](https://github.com/BoltzExchange/boltz-backend/commit/305c9bd2525dd92d9d6047335842567f36ddb820))
- broken unit tests - ([eaa8dd9](https://github.com/BoltzExchange/boltz-backend/commit/eaa8dd9521f0ac4bff2c2c3e85a49d9ce4423ace))
- Channel Creation edge cases - ([36024cc](https://github.com/BoltzExchange/boltz-backend/commit/36024ccf7e9baa3b11eeff9367fcf02e3c790a66))
- use GasNow only on mainnet - ([bbd73b6](https://github.com/BoltzExchange/boltz-backend/commit/bbd73b65d0d4b1f481f39ddd102043e64ca6bee7))

### Features

- add ethereum tooling - ([050c925](https://github.com/BoltzExchange/boltz-backend/commit/050c9254ee4e967194baf42444f3fa023bc4d97c))
- add Ether and ERC20 wallets - ([16cf7cf](https://github.com/BoltzExchange/boltz-backend/commit/16cf7cfb53528200846e2bb3b41c615af41ec440))
- add Ether and ERC20 swaps - ([f3e6b05](https://github.com/BoltzExchange/boltz-backend/commit/f3e6b05cd83951c3a6013be71c25bef159749c61))
- rescan chains on startup - ([a905176](https://github.com/BoltzExchange/boltz-backend/commit/a9051764bf4c925065902abd9f153d33aaa34f9f))
- Ethereum Swap improvements - ([1d13efc](https://github.com/BoltzExchange/boltz-backend/commit/1d13efc380067bec54106d0160a264780b30597c))
- charge correct miner fee for USDT pairs - ([16a9ca6](https://github.com/BoltzExchange/boltz-backend/commit/16a9ca660f9ee0cd50ad0149f51dc2d4e5c03791))
- add database migration for schema version 2 - ([59a0d45](https://github.com/BoltzExchange/boltz-backend/commit/59a0d45237c4ba78dd22c64a801e58d17be216e9))
- add Channel Creation and Swap retry logic - ([3041185](https://github.com/BoltzExchange/boltz-backend/commit/3041185af1baa139fde349d0bb51ae2d216db0ad))
- set rate of Swaps created with preimage hash - ([100fd7a](https://github.com/BoltzExchange/boltz-backend/commit/100fd7a48e9edb776de27af76911c962b1bc3ece))
- events for failed lockup transactions in API - ([feda384](https://github.com/BoltzExchange/boltz-backend/commit/feda38432c861e70aa915e3389b51bd85153e673))
- use GasNow for gas price predictions - ([d50bc91](https://github.com/BoltzExchange/boltz-backend/commit/d50bc91fcf83ab4e0cb21ebdf967ed4d779ab123))
- improve sending from boltz-ethereum - ([c3fc6ff](https://github.com/BoltzExchange/boltz-backend/commit/c3fc6ff52c4a1182e18e6f055e12601507d831cc))
- add pending Ethereum transaction tracker - ([139d8ff](https://github.com/BoltzExchange/boltz-backend/commit/139d8ff90c65ba6ab79ce56fcfb116781f105fae))
- add 10 percent buffer to CLTV expiry for cross chain Reverse Swaps - ([97d7ee3](https://github.com/BoltzExchange/boltz-backend/commit/97d7ee3d66420ee7ee20eec5581f1fd3b1854fae))

### Miscellaneous Chores

- add c-lightning and eclair images - ([285319a](https://github.com/BoltzExchange/boltz-backend/commit/285319a7f15ea3c1a8d71b0cebac77b07a63045d))
- switch from Ganache to GETH - ([ab12fd8](https://github.com/BoltzExchange/boltz-backend/commit/ab12fd8ea34e1a65f72688f2164a12ad71baf611))
- update dependencies - ([b2f263b](https://github.com/BoltzExchange/boltz-backend/commit/b2f263b9681bb2e0b3938130a11f91f5806d8722))
- update dependencies - ([0a1df20](https://github.com/BoltzExchange/boltz-backend/commit/0a1df20ddfd1f8b0174cb12cf0936a3311b08bb9))
- update dependencies - ([f4b713c](https://github.com/BoltzExchange/boltz-backend/commit/f4b713ce2d01cdfc7d2ed923b4a9298dcb418c7f))
- fund Ethereum wallets when starting Docker images - ([5afe16b](https://github.com/BoltzExchange/boltz-backend/commit/5afe16b9ce475bcfd934a07f9eccab50ffdadd8f))
- update zcash Docker image - ([c213f4e](https://github.com/BoltzExchange/boltz-backend/commit/c213f4eaa048d585629353e66de6bb0762f97e17))
- update c-lightning to 0.9.1 - ([20f7ee2](https://github.com/BoltzExchange/boltz-backend/commit/20f7ee285a55b155319bb319ee7cc4a9682f70b9))
- update dependencies - ([e8294ff](https://github.com/BoltzExchange/boltz-backend/commit/e8294ff97a851d278b6a0f44993a9f3bc572a81b))
- update CHANGELOG.md - ([d4d5f8f](https://github.com/BoltzExchange/boltz-backend/commit/d4d5f8fce90ba074bb0973fb1c7c1b77a24d2131))

### Tests

- update and fix integration tests - ([de4a703](https://github.com/BoltzExchange/boltz-backend/commit/de4a703f1dd6741c0574d298b68436931214846e))

---
## [2.4.0](https://github.com/BoltzExchange/boltz-backend/compare/v2.3.0..v2.4.0) - 2020-08-18

### Bug Fixes

- relax invoice check in auto Channel Creation mode - ([caa4fc2](https://github.com/BoltzExchange/boltz-backend/commit/caa4fc213b75ec294beb96d3de452d00b8b2373c))

### Features

- add chain client and LND version checks - ([25a0417](https://github.com/BoltzExchange/boltz-backend/commit/25a0417b230d01d18bec29988d8a4478ab86b757))
- try to connect by public key before opening channel - ([6a32a72](https://github.com/BoltzExchange/boltz-backend/commit/6a32a728a39c6322b2fd00465dcdab3949770578))
- send notifications when LND stream errors (#217) - ([f7ba741](https://github.com/BoltzExchange/boltz-backend/commit/f7ba7413353da3aed87b340fedec58b453de94ce))

### Miscellaneous Chores

- switch to eslint - ([5af7b13](https://github.com/BoltzExchange/boltz-backend/commit/5af7b13845283d8d938a663642e1a7340167080b))
- update to LND 0.10.3-beta - ([35bbbca](https://github.com/BoltzExchange/boltz-backend/commit/35bbbcadf489ab80fd1b264ea8b634900bd0f2c4))
- update vulnerable dependencies - ([68038dc](https://github.com/BoltzExchange/boltz-backend/commit/68038dcd95875d6c93784f736ffc1b9007002f40))
- bump max supported versions - ([cb6c059](https://github.com/BoltzExchange/boltz-backend/commit/cb6c059f7fe33132bf1309cbea416d4619eeb69a))

---
## [2.3.0](https://github.com/BoltzExchange/boltz-backend/compare/v2.1.0-beta..v2.3.0) - 2020-07-05

### Bug Fixes

- invoice decoding library (#180) - ([8a1dc47](https://github.com/BoltzExchange/boltz-backend/commit/8a1dc479a03b0aeb61aacf7b7feb2c95233f013c))
- add scanned block height to GetInfo (#183) - ([440cd5d](https://github.com/BoltzExchange/boltz-backend/commit/440cd5d3abb08c36b3fe94c9e5ed03ff29a5c0ad))
- update proto for LND version 0.9.0-beta - ([b1477c7](https://github.com/BoltzExchange/boltz-backend/commit/b1477c7f286de57e8f2e9674148a0abd7722b90c))
- sweeping Ether - ([d43a7e1](https://github.com/BoltzExchange/boltz-backend/commit/d43a7e1d5cf349e0b959aceaac8ebd0e47d3c299))
- Travis build - ([5e875ec](https://github.com/BoltzExchange/boltz-backend/commit/5e875ec84de4e92b2724d9bacc5221047e6ab0c7))
- failed transactions included in pending swaps (#184) - ([07f407b](https://github.com/BoltzExchange/boltz-backend/commit/07f407bafe40bb849863211ac555d3c34b471ce8))
- README.md update (#199) - ([bbadb98](https://github.com/BoltzExchange/boltz-backend/commit/bbadb988b6cc0652b4f885a22c843a3b977abb6d))
- pay invoice if set after transaction was sent - ([297e140](https://github.com/BoltzExchange/boltz-backend/commit/297e140a946d21fa4e13ad09b5ef45a6ccae16c2))
- broken link in docs - ([fc23163](https://github.com/BoltzExchange/boltz-backend/commit/fc231639702c104e0f6109d7f2204d0888f87fcf))
- minor fixes - ([44f3144](https://github.com/BoltzExchange/boltz-backend/commit/44f314432485cc7740808c71f754034bfe4e988e))
- LND race conditions - ([6f0aa8f](https://github.com/BoltzExchange/boltz-backend/commit/6f0aa8fdaacef604c9cbbaf8e1dd8c1f3df25167))
- handle OP_RETURN outputs - ([aea1683](https://github.com/BoltzExchange/boltz-backend/commit/aea1683183a7990617d8c100e17428bec96c34ff))
- unit tests - ([7ec9f1d](https://github.com/BoltzExchange/boltz-backend/commit/7ec9f1d9f2fb0bf6d100d6021c7cd47adb8b1726))
- Swap rate calculations - ([accf2c8](https://github.com/BoltzExchange/boltz-backend/commit/accf2c87a0bcf13e0b87c2a7af302382824f1845))
- cross chain Channel Creations - ([ee892d7](https://github.com/BoltzExchange/boltz-backend/commit/ee892d7872feb09389a5f916244c14e39af774d6))
- peer online database query - ([b1f7163](https://github.com/BoltzExchange/boltz-backend/commit/b1f7163710b9633b603238343301649c7650647e))
- recreating filters on restarts - ([ad918e3](https://github.com/BoltzExchange/boltz-backend/commit/ad918e3fad5e10f9d0952caadd9785d4cd12623b))
- invoice expiry check - ([3624278](https://github.com/BoltzExchange/boltz-backend/commit/362427891ae401a22ae42be7c5228a9b5ce4a559))
- Channel Creation Discord messages - ([f8925b3](https://github.com/BoltzExchange/boltz-backend/commit/f8925b3f7a3681b537a8833cfff2346ed48f7d2c))

### Documentation

- add channel creation docs - ([3fbcd42](https://github.com/BoltzExchange/boltz-backend/commit/3fbcd42174b0003ec488702bfcb912fc9d7dea34))
- add docs for deployments - ([1a10c35](https://github.com/BoltzExchange/boltz-backend/commit/1a10c35629524f30ad978266254c7e78b6d984c7))
- finish deployment docs - ([48b276c](https://github.com/BoltzExchange/boltz-backend/commit/48b276c04cee848798c516dba46c846e1c94df1a))
- minor fixes and clarifications - ([073ecb0](https://github.com/BoltzExchange/boltz-backend/commit/073ecb0eaa11cb58e1af97c62137a1ae6e8415f4))
- add refund file standard - ([e1bd1e3](https://github.com/BoltzExchange/boltz-backend/commit/e1bd1e3ac11b748416268a633eb675e2c60c28b2))
- add scripting docs - ([d54e460](https://github.com/BoltzExchange/boltz-backend/commit/d54e4602ad52feac7b43595378a1b123398a7a70))

### Features

- add Ether and ERC20 wallet - ([e8a2444](https://github.com/BoltzExchange/boltz-backend/commit/e8a2444d138ee0f39d72627751de775be6b90026))
- set CLTV expiry of hold invoices - ([e8e2591](https://github.com/BoltzExchange/boltz-backend/commit/e8e25912e3a42399f6ce4bcc1b0558e73f63e9e4))
- add endpoint to query lockup transaction of swap - ([c81986e](https://github.com/BoltzExchange/boltz-backend/commit/c81986ef4ac979df528de9a14db140b8b0f17fc0))
- special error handling broadcasting refund transactions - ([b953797](https://github.com/BoltzExchange/boltz-backend/commit/b9537970f04267acae9d35da47b81c6a7a3aa35b))
- add endpoint to query nodes - ([0fa346f](https://github.com/BoltzExchange/boltz-backend/commit/0fa346fc6e94ec83bababc78124fe91cfee001a5))
- add channel creation logic - ([f22fab7](https://github.com/BoltzExchange/boltz-backend/commit/f22fab7945a4ae7e365e764c62146a22de87aa50))
- improve logging of failed requests - ([8f5bfdb](https://github.com/BoltzExchange/boltz-backend/commit/8f5bfdbe9fe80b509fc69f078138d509e8f84d33))
- invoice and channel object sanity checks - ([09809b9](https://github.com/BoltzExchange/boltz-backend/commit/09809b90d9dc30500c0c997032b05daec3a5eead))
- configurable address type for Submarine Swaps - ([af9c7fe](https://github.com/BoltzExchange/boltz-backend/commit/af9c7fea9d537191f90795f4815cd0aa0acaac91))
- add prepay minerfee Reverse Swap protocol - ([62a517a](https://github.com/BoltzExchange/boltz-backend/commit/62a517ab8eed8b06e51ad5e4763619a38bbf0991))
- add "channel.created" event (#204) - ([5666abf](https://github.com/BoltzExchange/boltz-backend/commit/5666abf0ec990dc68a24396fb01163c3ed532805))
- add database version schema (#205) - ([257119a](https://github.com/BoltzExchange/boltz-backend/commit/257119a166d849e1419b58eab35a5b1fa7d90f2e))
- custom Discord notifications for Channel Creations - ([eea7081](https://github.com/BoltzExchange/boltz-backend/commit/eea70811bbe5660587fd51a7bbbbe3de36db5869))
- abandon Swaps with expired invoices - ([e11312a](https://github.com/BoltzExchange/boltz-backend/commit/e11312ae1e036ca70baf539fa863a53c05a3f3fc))

### Miscellaneous Chores

- prepare release v2.1.0-beta (#179) - ([57360a0](https://github.com/BoltzExchange/boltz-backend/commit/57360a0ba5c982dff7ef536534729b2105b482ac))
- update LND to v0.9.0-beta - ([c51ffa7](https://github.com/BoltzExchange/boltz-backend/commit/c51ffa7e399b08edd885c4c3747efb078444b045))
- rename newaddress Discord command - ([9418555](https://github.com/BoltzExchange/boltz-backend/commit/941855500d3e7188688c3342c61ff9893223a706))
- update dependencies - ([4e9f027](https://github.com/BoltzExchange/boltz-backend/commit/4e9f027e1dc30c74adf7e8f6fa7ea6539820882d))
- add script to calculate miner fee of transactions - ([a10771a](https://github.com/BoltzExchange/boltz-backend/commit/a10771a16889db5b2710a0bd97994b6f6bea73f8))
- update discord.js client - ([210ef5e](https://github.com/BoltzExchange/boltz-backend/commit/210ef5e707deffc062a3a1934dcbf22f07f5a380))
- update dependencies - ([3864d0e](https://github.com/BoltzExchange/boltz-backend/commit/3864d0e948193ee31fb09975a207b98e3bd2b4d1))
- update LND to v0.9.2-beta - ([5175232](https://github.com/BoltzExchange/boltz-backend/commit/5175232b2bd99212769429bea235e7a440633468))
- update dependencies - ([1110e52](https://github.com/BoltzExchange/boltz-backend/commit/1110e52c2df5cc2045ab8f104f7ef202ddce0cda))
- update dependencies - ([b98f1fd](https://github.com/BoltzExchange/boltz-backend/commit/b98f1fd24418a045035eccde11320e0a8eeccef0))
- update to LND 0.10 - ([0d25e5d](https://github.com/BoltzExchange/boltz-backend/commit/0d25e5df40789695ea9e8ce21385f4bd4ed465db))
- update dependencies - ([c606040](https://github.com/BoltzExchange/boltz-backend/commit/c6060405d8968572119d76aac03769401b7864d8))
- upgrade Bitcoin Core & Litecoin Core - ([9348afe](https://github.com/BoltzExchange/boltz-backend/commit/9348afe2357d01f47a448e026d02004fc41d455e))
- update LND to 0.10.1-beta - ([787443a](https://github.com/BoltzExchange/boltz-backend/commit/787443ad53557382a7631eab14b16390fefecd51))
- switch to GitHub actions - ([c4421c3](https://github.com/BoltzExchange/boltz-backend/commit/c4421c3694c26ae3d1a58462ba236fc645b7688e))
- update build badge in README - ([bc21d2b](https://github.com/BoltzExchange/boltz-backend/commit/bc21d2bc05c2c52469205fc2abc7b3166ddb5938))
- enable integration tests on GitHub actions - ([c818ff2](https://github.com/BoltzExchange/boltz-backend/commit/c818ff28dfabc19face317df6975463c60df580f))
- update dependencies - ([02f9b04](https://github.com/BoltzExchange/boltz-backend/commit/02f9b046506c37b6b5f8f41e97fa69ebcf8ea0da))
- update Sequelize to v6 (#209) - ([bd03efe](https://github.com/BoltzExchange/boltz-backend/commit/bd03efed9ba90c2c31207a2d96270f3b76c08e6a))

### Refactoring

- swap flow to allow creation with preimage hash - ([7e261ca](https://github.com/BoltzExchange/boltz-backend/commit/7e261cabef10662297cf73496b9b4f4ac18aed6c))
- retry logic - ([c84a080](https://github.com/BoltzExchange/boltz-backend/commit/c84a080a8b356db19ab2e0e5fb252aa3d93f2d27))
- reveal both invoices in prepay minerfee protocol (#201) - ([20d59b1](https://github.com/BoltzExchange/boltz-backend/commit/20d59b11095a1f4ae5cd434f89d4ef886cae6f3a))

### Tests

- update test cases - ([017fc90](https://github.com/BoltzExchange/boltz-backend/commit/017fc90357b8536ef182cf2b0f246c92f66fb122))
- add cases for SwapNursery - ([5db22d1](https://github.com/BoltzExchange/boltz-backend/commit/5db22d1df3696b26513bb2b12d2e3d3594c68cce))
- fix and add test cases - ([0d9f9de](https://github.com/BoltzExchange/boltz-backend/commit/0d9f9de964aa9111b03829bf96a15fb4e8ca224f))
- add tests for SwapManager - ([c7b7265](https://github.com/BoltzExchange/boltz-backend/commit/c7b7265fce082a04716a955c2b45812621f704f9))

---
## [2.1.0-beta](https://github.com/BoltzExchange/boltz-backend/compare/v2.0.0-beta..v2.1.0-beta) - 2020-01-14

### Bug Fixes

- error printing of chain client during initialization - ([7fe33bd](https://github.com/BoltzExchange/boltz-backend/commit/7fe33bdeedf091320ee2db3ebfce3aa5eefa5254))
- multiple messages of disk usage checker - ([1af2887](https://github.com/BoltzExchange/boltz-backend/commit/1af2887f2cf68935e6d626ff13eec60f6c7667ed))
- address and invoice encoding in LND Litecoin - ([62e0bbb](https://github.com/BoltzExchange/boltz-backend/commit/62e0bbb5a1637b6e2145132089731e368b55ee7a))
- loading status of pending reverse swaps - ([9104819](https://github.com/BoltzExchange/boltz-backend/commit/91048191a24e9f060aa170af1baf07e121b52693))
- Python linting warnings - ([a346829](https://github.com/BoltzExchange/boltz-backend/commit/a346829e13ddc876ef9317b52c9efa29d5188e8a))
- update commands for new reverse swaps - ([41460c0](https://github.com/BoltzExchange/boltz-backend/commit/41460c0120c2491703560d8d214c92097383b826))
- normal cross chain swaps - ([7072765](https://github.com/BoltzExchange/boltz-backend/commit/7072765443b58112a9bbabc5ad51b2d96fd89b7b))
- edge case of swap event handling - ([68f9387](https://github.com/BoltzExchange/boltz-backend/commit/68f9387d9c1fff0e0d77c942ce904090a57b927f))
- invoice decoding on testnet - ([bf21052](https://github.com/BoltzExchange/boltz-backend/commit/bf210522f525770773da23f3a6c854a5eb433d1e))

### Documentation

- feedback changes (#139) - ([5ef2ab5](https://github.com/BoltzExchange/boltz-backend/commit/5ef2ab5a0bf8a03dc2b37013d3bab6e526a2843b))
- add aliases for executables in Docker image (#140) - ([83259df](https://github.com/BoltzExchange/boltz-backend/commit/83259dfac3ec124686f8b9874657c154f951bdec))
- add discord badge (#149) - ([26e59a6](https://github.com/BoltzExchange/boltz-backend/commit/26e59a6c88aa55df2bfc4d30ddeada10384f1ca2))
- add missing Discord link (#148) - ([5e837da](https://github.com/BoltzExchange/boltz-backend/commit/5e837da5886e3ac08f29a8a7443484e78e7c0e7a))

### Features

- add memo to invoice of reverse swaps - ([556513f](https://github.com/BoltzExchange/boltz-backend/commit/556513ffd4957a130da481fad1c6420ab42c2400))
- add script to fund Boltz wallet (#141) - ([c0ff5ca](https://github.com/BoltzExchange/boltz-backend/commit/c0ff5cafb691b6336114230869d45c86f1fedb5f))
- add withdraw Discord command (#142) - ([6fdc4d4](https://github.com/BoltzExchange/boltz-backend/commit/6fdc4d4bd9f34459561b8fc6f5427306b0bd0fb7))
- add notification when disk is getting full (#146) - ([47843ba](https://github.com/BoltzExchange/boltz-backend/commit/47843ba1c9aec0b481b128cc84b974e141feae34))
- add usage of single commands to Discord help - ([63c6e8c](https://github.com/BoltzExchange/boltz-backend/commit/63c6e8ca1a18ece9d76340b10d064e526ce7989f))
- show git commit hash in version (#151) - ([f84a2f7](https://github.com/BoltzExchange/boltz-backend/commit/f84a2f7c303e5d5a17c2f5db666a1da60cfb9088))
- add pendingswaps Discord command - ([f192ea2](https://github.com/BoltzExchange/boltz-backend/commit/f192ea2260fb4488038d79243c8860b9c9e4500f))
- add lockedfunds Discord command - ([b034f25](https://github.com/BoltzExchange/boltz-backend/commit/b034f25ef81e40662404c9d91ea488c0ad1dacad))
- make timeouts configurable on a per chain basis (#153) - ([14f7b80](https://github.com/BoltzExchange/boltz-backend/commit/14f7b8037218b50c5110eb5d76239450824549a2))
- add tool to analyze failed swaps (#157) - ([9138f3b](https://github.com/BoltzExchange/boltz-backend/commit/9138f3b24c853ec3c8178d52ef919e5df9b5ebcf))
- accept invoices with upper case letters (#158) - ([d2f08d4](https://github.com/BoltzExchange/boltz-backend/commit/d2f08d45b79eafc16f5c778b687b11f590c2dde4))
- show onchainAmount in response of createreverseswap (#161) - ([f1c784a](https://github.com/BoltzExchange/boltz-backend/commit/f1c784a7d1111c7f7d6ffe85d746753f5bde2427))
- add Dogecoin Core and Zcash Docker images - ([9bec35d](https://github.com/BoltzExchange/boltz-backend/commit/9bec35da3d72a1ba885e03664e12be9f3841eb39))
- add support for Dogecoin - ([2c9e9d6](https://github.com/BoltzExchange/boltz-backend/commit/2c9e9d689b3dbc64d922a61b06534a1e3a0c28ce))
- remove Boltz wallet - ([6946bf3](https://github.com/BoltzExchange/boltz-backend/commit/6946bf34b7bf746b73b7ab98a32253b7b6f8ef72))
- build LND docker image with all available tags - ([d3ddba0](https://github.com/BoltzExchange/boltz-backend/commit/d3ddba0cc9324823944be4c053cc4bfc17a8d107))
- add version API endpoint - ([277d2c7](https://github.com/BoltzExchange/boltz-backend/commit/277d2c7d4595ca56ede18019eccd50bbfda31460))
- reverse swaps with hold invoices - ([6936fc2](https://github.com/BoltzExchange/boltz-backend/commit/6936fc203b5fcb1cabbb28853f0b94eed71c0bb0))
- use new reverse swap script - ([82d8860](https://github.com/BoltzExchange/boltz-backend/commit/82d8860b86c8da9fc0cbb6e5f76d6a577f5f03f2))
- add timeouts of hold reverse swaps - ([f4aae82](https://github.com/BoltzExchange/boltz-backend/commit/f4aae827a2bf347a05bd6659ecf9999898b27f4c))
- cancel invoices of expired reverse swaps - ([e6aef4f](https://github.com/BoltzExchange/boltz-backend/commit/e6aef4f8789fc2307d26425ba0ba9d431e5093b9))
- raw transaction in events of reverse swaps - ([46b8d25](https://github.com/BoltzExchange/boltz-backend/commit/46b8d25437497f74ad39dd44ecced3d84fd04ce0))
- default status for swaps - ([531fd39](https://github.com/BoltzExchange/boltz-backend/commit/531fd39920ccc749af0f3cc10e2ec756dced6b65))
- add ETA to TransactionMempool events - ([3a3a29d](https://github.com/BoltzExchange/boltz-backend/commit/3a3a29df443172f6c32ce6038445e4211351cb7b))
- reword invoice memo (#178) - ([fe7ca9d](https://github.com/BoltzExchange/boltz-backend/commit/fe7ca9d539aec581d0e35c3cd4cfbf9d75fc9f0c))

### Miscellaneous Chores

- update dependencies - ([1505027](https://github.com/BoltzExchange/boltz-backend/commit/1505027d247af75a7518bf72d2d37e5e5b5e1a7b))
- switch from CircleCI to Travis (#144) - ([15e1d83](https://github.com/BoltzExchange/boltz-backend/commit/15e1d837bf0b9d6d49529226cff6943f1ed8122f))
- add Travis build badge - ([c7897c8](https://github.com/BoltzExchange/boltz-backend/commit/c7897c84071fcb21f0410b6014cbb18480de132c))
- add Travis build on Windows - ([d883428](https://github.com/BoltzExchange/boltz-backend/commit/d883428c4f55356d795a167a164435c304bb8474))
- update dependencies - ([3f118fd](https://github.com/BoltzExchange/boltz-backend/commit/3f118fd9e935ce0bceb4da13c6697d0b33e51902))
- update dependencies and Docker images - ([b9d0f1d](https://github.com/BoltzExchange/boltz-backend/commit/b9d0f1d4aa40aca6c448a5a72853c1a3ed9d0dc9))
- update LND and regtest images to use LND 0.8.0-beta - ([3f65516](https://github.com/BoltzExchange/boltz-backend/commit/3f65516a47ace0d010198a7d757922f3ce551c22))
- update dependencies - ([0e2cfec](https://github.com/BoltzExchange/boltz-backend/commit/0e2cfecd9aca4ee623b29b21e061e930b6c4ac79))
- disable CircleCI build (#168) - ([722e910](https://github.com/BoltzExchange/boltz-backend/commit/722e910586ccb435a2b04f029a63a648de235874))
- update Docker images - ([b198f2d](https://github.com/BoltzExchange/boltz-backend/commit/b198f2df675ec84851c566d4014691b5a86b55b4))
- update NPM dependencies - ([a01d043](https://github.com/BoltzExchange/boltz-backend/commit/a01d043d9a96959435b36393ff97012574268726))
- update LND to 0.8.2-beta - ([8143355](https://github.com/BoltzExchange/boltz-backend/commit/8143355cf775563abb8bacee26be1d8cb76cf2b5))
- exclude TypeScript build info from NPM package - ([84d4446](https://github.com/BoltzExchange/boltz-backend/commit/84d4446c7bfa1142d38229c6a404fcdbfb795619))
- bump amount of coins sent to LND wallet - ([3c5a23a](https://github.com/BoltzExchange/boltz-backend/commit/3c5a23a5c9eb87c5acac3762ec088d3756d2fa80))
- update Discord messages for new reverse swaps - ([ee2e122](https://github.com/BoltzExchange/boltz-backend/commit/ee2e12274d9d93f0cfa0ede715259ba423d97241))
- update dependencies - ([13fdee2](https://github.com/BoltzExchange/boltz-backend/commit/13fdee2cbc6e56e484e17c0d73dae6c2d2b6910d))

### Refactoring

- reformat swap messages (#143) - ([51ab0cc](https://github.com/BoltzExchange/boltz-backend/commit/51ab0cc3499d6d086165644c6304b20a8fb7a2c3))
- improve git commit hash script - ([9bb7c8f](https://github.com/BoltzExchange/boltz-backend/commit/9bb7c8fedea8656a4caf5c04db5f12c8f04ae4fc))
- readable swap Discord notifications - ([f9503b3](https://github.com/BoltzExchange/boltz-backend/commit/f9503b3f0783d3f42b621bbdcedabc3be463f7d7))
- createswap API endpoint - ([25744f1](https://github.com/BoltzExchange/boltz-backend/commit/25744f1ca172170d3ce2a3e63b4f4083aa62f5a0))

### Tests

- add and update unit tests - ([c13ad8c](https://github.com/BoltzExchange/boltz-backend/commit/c13ad8c3c1aa2aa67467b2a69c850c02ad0ad6de))
- fix remaining failing tests - ([0c37daf](https://github.com/BoltzExchange/boltz-backend/commit/0c37daf740017b3582f188081460f6474af40d64))

---
## [2.0.0-beta](https://github.com/BoltzExchange/boltz-backend/compare/v1.0.0-beta.2..v2.0.0-beta) - 2019-08-27

### Bug Fixes

- output type of NewAddress - ([ca52f9c](https://github.com/BoltzExchange/boltz-backend/commit/ca52f9c61a6630d157e78dbc55d032e274c14246))
- tests in different timezones - ([af283ec](https://github.com/BoltzExchange/boltz-backend/commit/af283ece5156351b070be4f99538392ad5f2b3cc))
- minor improvements - ([c3f19b4](https://github.com/BoltzExchange/boltz-backend/commit/c3f19b4c79c6961d1e719aeae3c8af4d23a2f9a2))
- minor fee calculation fixes - ([9075469](https://github.com/BoltzExchange/boltz-backend/commit/9075469d604db9b7e0cd454121edd82d1ff8eae0))
- not throwing exception if backup private key cannot be found - ([ec84edc](https://github.com/BoltzExchange/boltz-backend/commit/ec84edcbc469ff9dfe91a028d9938004ce1b2e31))
- tests after renaming event to status - ([335cac3](https://github.com/BoltzExchange/boltz-backend/commit/335cac3a90cd34eecb61d08608a4f3ba65c50c01))
- race conditions in EventHandler - ([9442a1e](https://github.com/BoltzExchange/boltz-backend/commit/9442a1e06d3609405b18ce50fb9bba03e65f4891))
- message of backup command (#131) - ([b5f1676](https://github.com/BoltzExchange/boltz-backend/commit/b5f1676cd3aa2400920bbeb7451ca4cc2ad883ea))
- calculation of enforced limits of LTC/BTC pair - ([e874595](https://github.com/BoltzExchange/boltz-backend/commit/e87459515701168257c8ad39009c9d5b0acbffb9))
- always use free port for ZMQ tests - ([8eb6984](https://github.com/BoltzExchange/boltz-backend/commit/8eb6984ac7d4ec846046dbad4748be430af32aa1))

### Documentation

- add readthedocs documentationn - ([411ba18](https://github.com/BoltzExchange/boltz-backend/commit/411ba18e133ed94bb8715e772713d312d0d00742))
- refactoring docs - ([2e39bb5](https://github.com/BoltzExchange/boltz-backend/commit/2e39bb5c81afa6d2f19216e0667ea0dfda9df8a3))
- move Regtest Docker environment wiki page - ([7f0d140](https://github.com/BoltzExchange/boltz-backend/commit/7f0d140080673e310038a538523534c149098e98))
- document Server-Sent Events script - ([4d73dcd](https://github.com/BoltzExchange/boltz-backend/commit/4d73dcde43c9717b617538b25118286eb2f54558))

### Features

- abort swaps after expiration (#123) - ([5879a3b](https://github.com/BoltzExchange/boltz-backend/commit/5879a3b0e5d2fcc1f3785cf34477fec8fe1ee47c))
- accept 0-conf for non RBF swap outputs (#118) - ([66066ee](https://github.com/BoltzExchange/boltz-backend/commit/66066ee7f960a88453058561b5e5e7418c0a4d80))
- add 0-conf limits to getPairs endpoint - ([769b79f](https://github.com/BoltzExchange/boltz-backend/commit/769b79f1e521ac7f6b9d7804e5e92c5de704ae56))
- improve Docker image build process - ([1c5c627](https://github.com/BoltzExchange/boltz-backend/commit/1c5c6271b33a202ac1fc7cd0b56b44b2efe1d75d))
- add timeoutBlockHeight to response of createReverseSwap - ([14b8314](https://github.com/BoltzExchange/boltz-backend/commit/14b831473b200abb0b446f247aacbed120e65702))
- add list of images to builder script - ([9a091f9](https://github.com/BoltzExchange/boltz-backend/commit/9a091f9272b04dc5b0c41a614d4e6821a840cdc7))
- add script to stream Server-Sent events - ([14c72bd](https://github.com/BoltzExchange/boltz-backend/commit/14c72bd289d4ee7dd4161c28d560eb781257fef7))

### Miscellaneous Chores

- update images - ([ce3805f](https://github.com/BoltzExchange/boltz-backend/commit/ce3805f5f4a0ae21f02af3e19db9d7d896f212e0))
- update dependencies - ([86ae388](https://github.com/BoltzExchange/boltz-backend/commit/86ae3883fdf8ecedcd7ad262c88d3dee07f1efe7))
- update Bitcoin Core and LND images - ([7d4fab8](https://github.com/BoltzExchange/boltz-backend/commit/7d4fab8eb10c815305fd1eeefab3dafba44e6812))
- update vulnerable dependencies - ([7f68075](https://github.com/BoltzExchange/boltz-backend/commit/7f680754c14244f1fb491578eb54f8578a073a97))
- update vulnerable dependencies (#134) - ([c1f08ed](https://github.com/BoltzExchange/boltz-backend/commit/c1f08ed7137f4a75a0e10ddfb94aa966b726c4c3))
- release v2.0.0-beta - ([fd68e30](https://github.com/BoltzExchange/boltz-backend/commit/fd68e30ebb5283633395e0578035d6fda1dc3017))
- link Read the Docs in README - ([dcf7ac9](https://github.com/BoltzExchange/boltz-backend/commit/dcf7ac940e1ed83dcf3424dfb8e37866bc7864c1))

### Refactoring

- move all fee and rate calculations to middleware (#124) - ([f31cf0e](https://github.com/BoltzExchange/boltz-backend/commit/f31cf0ef90879e6db33ca0a00d59170d01f10168))
- move logic from middleware to backend - ([d918534](https://github.com/BoltzExchange/boltz-backend/commit/d9185346dc97f9beeb763060531fc2e2d37fbc5f))
- switch from TransactionBuilder to PSBT - ([11dee91](https://github.com/BoltzExchange/boltz-backend/commit/11dee91da6dedc7f3a1813a6617b26826cae6009))
- rescanning of missed blocks - ([d197a25](https://github.com/BoltzExchange/boltz-backend/commit/d197a2571fc4d7cbcf28263bd427fddd51b1dbc9))

### Tests

- add tests from middleware - ([3177ca3](https://github.com/BoltzExchange/boltz-backend/commit/3177ca321bcb4086a4be91abda114c2f15b670bf))
- add tests - ([18b3c88](https://github.com/BoltzExchange/boltz-backend/commit/18b3c8804dff5ca854f1b4abe7b477fd654f7e29))
- add unit test for service and swap manager - ([6d6f2fb](https://github.com/BoltzExchange/boltz-backend/commit/6d6f2fb68e2677e029cae3a9f9c455396d78bd63))

### Rejactor

- move test suite to jest - ([b2c3b61](https://github.com/BoltzExchange/boltz-backend/commit/b2c3b612cf1ed911f3c54c2b749f6495abd2139c))

---
## [1.0.0-beta.2](https://github.com/BoltzExchange/boltz-backend/compare/v1.0.0-beta..v1.0.0-beta.2) - 2019-05-15

### Features

- detection of chain reorganizations (#115) - ([2d6a40f](https://github.com/BoltzExchange/boltz-backend/commit/2d6a40f0374b7c60bef5c1aaeb0a096317712333))
- more verbose events for accounting in the middleware (#120) - ([8c1e64d](https://github.com/BoltzExchange/boltz-backend/commit/8c1e64d5b3a359c2f7513962047a8ddc7125015d))

### Miscellaneous Chores

- switch to CircleCI workflows (#116) - ([9d9a260](https://github.com/BoltzExchange/boltz-backend/commit/9d9a260c512ed1cb74d36df47e7a1c927b67e9e3))
- update Docker images (#119) - ([ff55b6e](https://github.com/BoltzExchange/boltz-backend/commit/ff55b6e23637a0db6fc71f08478ba2e1e351ebba))
- release v1.0.0-beta.2 (#121) - ([321b3a9](https://github.com/BoltzExchange/boltz-backend/commit/321b3a91a37ed8eaff4f2f477345632332586511))

---
## [1.0.0-beta](https://github.com/BoltzExchange/boltz-backend/compare/v0.0.2..v1.0.0-beta) - 2019-04-29

### Bug Fixes

- claim swap after one confirmation (#26) - ([bee35ea](https://github.com/BoltzExchange/boltz-backend/commit/bee35eac72e4669705fa1c40fa1b58f3b70f3b4e))
- remove last usages of Networks.ts file (#30) - ([ba02a69](https://github.com/BoltzExchange/boltz-backend/commit/ba02a6946efd580bef7000433cffb27f1b36eba7))
- sending transaction on Litecoin - ([358dc25](https://github.com/BoltzExchange/boltz-backend/commit/358dc252ad10b92663be13f2540e9257ee9d9981))
- rate of reverse swaps (#64) - ([c5466e6](https://github.com/BoltzExchange/boltz-backend/commit/c5466e6a1be593d7fed4f663195233bc431abd50))
- improve logging of reverse swaps (#66) - ([cd700c5](https://github.com/BoltzExchange/boltz-backend/commit/cd700c5a2eecfa29d54fc96cbd67d35380f6e0fe))
- emit invoice.paid event only if request succeeded (#70) - ([5b41412](https://github.com/BoltzExchange/boltz-backend/commit/5b41412b15c7bd3cf34ecc72b87e7b50755ff754))
- outputs to wallet table relation - ([aa36b76](https://github.com/BoltzExchange/boltz-backend/commit/aa36b768ed2ab044d2cdbf8a7bc167d982c898a4))
- error message of broadcasting refund transactions (#80) - ([1e1cbf7](https://github.com/BoltzExchange/boltz-backend/commit/1e1cbf78fdda72b9ce944e0f316213beeb4df55e))
- set max fee to 100 sat per vbyte (#82) - ([14a8b7d](https://github.com/BoltzExchange/boltz-backend/commit/14a8b7d1425582badcc46c4619e4319c78a5151e))
- correct timeout block height in map (#89) - ([f6a2579](https://github.com/BoltzExchange/boltz-backend/commit/f6a2579072ab2adbeab0d612be5a30ce20e1719e))
- config file parsing (#90) - ([d82f518](https://github.com/BoltzExchange/boltz-backend/commit/d82f5187b2f0a4071201ee17fd3c9d70b1ece04c))
- catch LND errors when paying invoices (#94) - ([4b402a6](https://github.com/BoltzExchange/boltz-backend/commit/4b402a60bd7db703be3455108c36dcdf8b596694))
- fee calculation of reverse swaps (#101) - ([aced8f5](https://github.com/BoltzExchange/boltz-backend/commit/aced8f58d3ff9bfb59c04f91714b1f97664b86a6))
- fee calculation (#111) - ([575b4a5](https://github.com/BoltzExchange/boltz-backend/commit/575b4a5d47f1532977de6535ebc2e3188e2367a5))
- could not find route for private channels (#112) - ([1eeb4ee](https://github.com/BoltzExchange/boltz-backend/commit/1eeb4ee715ee8248553c7478c3ba80ae3bf1c684))
- route hint list length check (#113) - ([345d584](https://github.com/BoltzExchange/boltz-backend/commit/345d584cd0aca9aca82bd29bfa0e6a8875c34065))

### Features

- **(docker)** add prepared simnet environment - ([726f6f5](https://github.com/BoltzExchange/boltz-backend/commit/726f6f5c9dc7a2463b4ebeccbc6a3c6034de81e4))
- **(grpc)** subscribe to confirmed transactions - ([e029823](https://github.com/BoltzExchange/boltz-backend/commit/e02982385226a9de0f6f22173cb19775a5342d56))
- **(grpc)** subscribe to paid invoices - ([9290e38](https://github.com/BoltzExchange/boltz-backend/commit/9290e386af6adf4db98b8338bc12fe9c1b5b5664))
- **(grpc)** improve CreateReverseSwap response - ([134d43b](https://github.com/BoltzExchange/boltz-backend/commit/134d43b5fe12620198ce8283e52f6ba7693ba142))
- **(grpc)** add events to SubscribeTransactions - ([49809bb](https://github.com/BoltzExchange/boltz-backend/commit/49809bb6fe99a1fe59ffc56792f9ffa44c9ae656))
- **(grpc)** add preimage to invoice settled events (#65) - ([3abca51](https://github.com/BoltzExchange/boltz-backend/commit/3abca515ebde699e7a8f9cfbee890bf870f2ea85))
- **(grpc)** add timeout height to swap commands (#57) - ([61c7d44](https://github.com/BoltzExchange/boltz-backend/commit/61c7d44d16be1c5163bf9833a881941396c8bca5))
- **(wallet)** check unconfirmed UTXOs on startup - ([7aeb034](https://github.com/BoltzExchange/boltz-backend/commit/7aeb034b80c80c9ee15c9d4a763a7c82adc14085))
- add inquirer as optional input for boltz-cli (#24) - ([8a61628](https://github.com/BoltzExchange/boltz-backend/commit/8a616280da65851b3a04b9696e2db449ed4cfb5c))
- detect multiple UTXOs per output - ([c1d8b09](https://github.com/BoltzExchange/boltz-backend/commit/c1d8b094824690fe08e07364b524d75ae131b2a2))
- mark transactions as spent - ([635b9b6](https://github.com/BoltzExchange/boltz-backend/commit/635b9b65775dad5b610cb08ffcd66a4dfd3a81dc))
- add channel balance to GetBalanceResponse (#71) - ([c1af188](https://github.com/BoltzExchange/boltz-backend/commit/c1af188bfee2148e2bddc5fe940029a3839955dd))
- emit event when invoice not settled (#60) - ([69c5d99](https://github.com/BoltzExchange/boltz-backend/commit/69c5d999dd135d23e99f07bc70c1df53fb61a1f5))
- automatically refund failed swaps (#73) - ([a7291a8](https://github.com/BoltzExchange/boltz-backend/commit/a7291a89f5119e7a88a909932bca84c63b7892fa))
- reconnect to lnd if streaming calls are disconnected #48 (#59) - ([7e524f5](https://github.com/BoltzExchange/boltz-backend/commit/7e524f537f24e8cb90b73cecb10d84338ed36c6f))
- expose LND REST API on simnet image - ([86bc8d1](https://github.com/BoltzExchange/boltz-backend/commit/86bc8d1da046edc197fb7a055f5a9cd0435a5ca1))
- add error to status of connected nodes (#78) - ([fe4499d](https://github.com/BoltzExchange/boltz-backend/commit/fe4499de02ba5ba39fd5c13ec1a0e1cf2aba8569))
- add BTCD fee estimator - ([525e75f](https://github.com/BoltzExchange/boltz-backend/commit/525e75f56bc7fe8dba7601e58ea0e75540c0a2fd))
- add gRPC method to estimate fee - ([985cb10](https://github.com/BoltzExchange/boltz-backend/commit/985cb105b8e9a202495115dfd43b20efbe042e28))
- add gRPC method to send coins - ([0cb6f51](https://github.com/BoltzExchange/boltz-backend/commit/0cb6f51720d961c7fc68a998f20df8cd59136eba))
- add gRPC stream for refunds of reverse swaps - ([e795c64](https://github.com/BoltzExchange/boltz-backend/commit/e795c64e037fdca669ac2d18d71b0a2d7fcd0615))
- add additional field for fee of swap (#84) - ([768f539](https://github.com/BoltzExchange/boltz-backend/commit/768f539a3ade23b4fd4da3749631ed715784cd48))
- switch from BTCD to Bitcoin Core - ([f9efe7a](https://github.com/BoltzExchange/boltz-backend/commit/f9efe7af1ad6894b6ad89eeb608a46ea25cc8990))
- add fallback for pubrawblock ZMQ filter - ([dd30930](https://github.com/BoltzExchange/boltz-backend/commit/dd30930e6cbc9c341b6711000dde4e47a2fa3d5a))
- add lock to wallet to avoid double spending - ([49232e8](https://github.com/BoltzExchange/boltz-backend/commit/49232e89f17906f89dad1fc557c784939684e3f9))
- add event for not payable invoices - ([98bfa5c](https://github.com/BoltzExchange/boltz-backend/commit/98bfa5c585ec731cc40f3535fcb33dc0854c821d))
- add inbound balance to getbalance (#97) - ([55401c1](https://github.com/BoltzExchange/boltz-backend/commit/55401c1acf5c5cca32234053ca4514d7faab0a41))
- check whether invoice can be routed before creating swap - ([be1600b](https://github.com/BoltzExchange/boltz-backend/commit/be1600b3d39f452cc32c982a0109d8ef997634a1))
- send all funds of wallet (#108) - ([63bcf46](https://github.com/BoltzExchange/boltz-backend/commit/63bcf460bbe50dd260d5b3c3b25dfd00c1f5a0cf))
- add gRPC stream for static channel backups - ([6dc545b](https://github.com/BoltzExchange/boltz-backend/commit/6dc545be85825d7f66ae71dfa45c1ec81a03cc35))

### Miscellaneous Chores

- use boltz-core library (#25) - ([35cd8cb](https://github.com/BoltzExchange/boltz-backend/commit/35cd8cb6a8d11549bd0982e99f6dbc4411a5504d))
- add NPM badge (#27) - ([27064fe](https://github.com/BoltzExchange/boltz-backend/commit/27064fe73ccaa0a50a39bcb61de5f9d08077cc6f))
- update Go versions in Docker images (#32) - ([14076d4](https://github.com/BoltzExchange/boltz-backend/commit/14076d449542eb6eebafe70b61000ee5c2617f6f))
- minor style improvements - ([df98dd3](https://github.com/BoltzExchange/boltz-backend/commit/df98dd37dcfda5729c6c3065964165753f4812a4))
- disallow unused variables - ([4d570b1](https://github.com/BoltzExchange/boltz-backend/commit/4d570b15a7db5fbc39a27d186e5f2a4927ed22f4))
- update boltz-core to version 0.0.5 (#56) - ([cc5bb86](https://github.com/BoltzExchange/boltz-backend/commit/cc5bb86426d96bcbfaa43db613f3cd8dfacc024a))
- update dependencies - ([32e5f4a](https://github.com/BoltzExchange/boltz-backend/commit/32e5f4a0f7649a654113fedc7d5d83f82bba2d92))
- move TODOs to issues (#55) - ([3838a59](https://github.com/BoltzExchange/boltz-backend/commit/3838a59281e6d8aab5477095f8f946f65cb316ce))
- cleanup of timeout naming scheme - ([4efcaef](https://github.com/BoltzExchange/boltz-backend/commit/4efcaefd58bb0d0750f7d1232985f7c9fffbf771))
- remove unnecessary log statement (#74) - ([f596149](https://github.com/BoltzExchange/boltz-backend/commit/f5961491e20e518dc5315e9e891310b74afde6e0))
- integrate CircleCI (#77) - ([a24aa87](https://github.com/BoltzExchange/boltz-backend/commit/a24aa87bcaa43fccdca01723f1c0392de249f1cd))
- update node version of CircleCI - ([3b38e42](https://github.com/BoltzExchange/boltz-backend/commit/3b38e42393b26b6baf4328062734d4eba2b2e6ee))
- move Berkeley DB build into own container (#87) - ([5fa620a](https://github.com/BoltzExchange/boltz-backend/commit/5fa620a9e0a5981240ba0a646e6397f96efad074))
- update boltz-core dependency to v0.0.6 (#91) - ([de7b64c](https://github.com/BoltzExchange/boltz-backend/commit/de7b64cefcdfb6e0e2eaabead6d55f4159359ead))
- update dependencies - ([21eca3e](https://github.com/BoltzExchange/boltz-backend/commit/21eca3eb4dcfbd57f7365d6f74c54386853bc274))
- update Go alpine version (#107) - ([94c69af](https://github.com/BoltzExchange/boltz-backend/commit/94c69af626e4d6e7068e60cbfa09a0d44d8b0180))
- update LND protobuf to version 0.6-beta - ([0eaafee](https://github.com/BoltzExchange/boltz-backend/commit/0eaafee527fac3860848fd987f2c32f11894997b))
- release v1.0.0-beta (#114) - ([48e5a12](https://github.com/BoltzExchange/boltz-backend/commit/48e5a129f84e3e80462c8d8b42617052152d53cd))

### Performance

- more efficient handling of gRPC subscriptions - ([402c764](https://github.com/BoltzExchange/boltz-backend/commit/402c764a88f759264ab6f65d5507fbb63fee5c2a))

### Refactoring

- remove concept of trading pairs (#28) - ([5250753](https://github.com/BoltzExchange/boltz-backend/commit/5250753dd7b2c632decd364a090a34a24fdb52ab))
- update integration for new image - ([92c4cb4](https://github.com/BoltzExchange/boltz-backend/commit/92c4cb423f1466e23fd9499264715169e7fb30eb))
- remove generation of BIP21 payment requests (#39) - ([2405678](https://github.com/BoltzExchange/boltz-backend/commit/2405678d30ca166f169aad3f1c6634c9b4c5ed15))
- custom fee for sendToAddress method of wallet (#61) - ([0e9e937](https://github.com/BoltzExchange/boltz-backend/commit/0e9e93706c16e385b6032bafbd4f9ed5c0770618))
- parse currencies from config (#29) - ([947bcbc](https://github.com/BoltzExchange/boltz-backend/commit/947bcbcc2846149a20d02e749c504f85af877247))
- update sequelize to v5 (#105) - ([3b16e2d](https://github.com/BoltzExchange/boltz-backend/commit/3b16e2d0bfd79020aae0e9527b01ae210080d5c6))

### Tests

- unit tests for chain and zmq clients (#98) - ([8abeeba](https://github.com/BoltzExchange/boltz-backend/commit/8abeeba7878a973dcec9e5841789a38cded75ecb))

---
## [0.0.2](https://github.com/BoltzExchange/boltz-backend/compare/v0.0.1..v0.0.2) - 2018-12-03

### Bug Fixes

- database error on startup (#5) - ([2113989](https://github.com/BoltzExchange/boltz-backend/commit/2113989276df56d30924d87e122cb47cf620d138))
- export detectSwap method (#22) - ([6b4f211](https://github.com/BoltzExchange/boltz-backend/commit/6b4f2110f31afb65dccf5bf5f1e25fd81aaab319))

### Features

- **(grpc)** add broadcasting of transactions (#6) - ([5950bad](https://github.com/BoltzExchange/boltz-backend/commit/5950bad1e9948ef11f9aa25f7debafb58b1f44ce))
- **(grpc)** add retrieving transaction from its hash (#20) - ([cb5d54c](https://github.com/BoltzExchange/boltz-backend/commit/cb5d54c47c2dcfd2de14117319944e27d14c4b01))
- **(grpc)** add timeout to createswap (#21) - ([bf4e1d9](https://github.com/BoltzExchange/boltz-backend/commit/bf4e1d92f24e74a5485fb26a2177d85c84d6637c))
- fee estimation for claim and refund transactions (#4) - ([75afad8](https://github.com/BoltzExchange/boltz-backend/commit/75afad840d801eb087f2a6229f5b3f8d87e5232a))

### Miscellaneous Chores

- bump version to 0.0.2 (#23) - ([a1fecd7](https://github.com/BoltzExchange/boltz-backend/commit/a1fecd789c290e2204a4026ea486a2854fd7d448))

---
## [0.0.1] - 2018-11-26

### Miscellaneous Chores

- add Travis badge to README.md - ([e709ca8](https://github.com/BoltzExchange/boltz-backend/commit/e709ca89dfa4237bd793cdd341f2daceb813cca4))
- preparations for NPM package (#2) - ([5d44183](https://github.com/BoltzExchange/boltz-backend/commit/5d44183f2d65326b74445eef51533127e607ae7c))
- export claim and refund transaction in NPM module (#3) - ([253544d](https://github.com/BoltzExchange/boltz-backend/commit/253544d017ad60bdeb8e6eb83e9c11cd30165ff6))

<!-- generated by git-cliff -->
