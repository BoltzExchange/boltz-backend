import type { BTC_NETWORK } from '@scure/btc-signer/utils.js';
import { Networks as CoreNetworks } from 'boltz-core';

export type BitcoinNetwork = BTC_NETWORK;

const aliases: Record<string, BitcoinNetwork> = {
  // boltz-core v4 canonical names
  bitcoin: CoreNetworks.bitcoin,
  testnet: CoreNetworks.testnet,
  regtest: CoreNetworks.regtest,

  // boltz-core v3 legacy names — kept for backwards compatibility with
  // existing operator configs that say network = "bitcoinRegtest" etc
  bitcoinMainnet: CoreNetworks.bitcoin,
  bitcoinTestnet: CoreNetworks.testnet,
  bitcoinSignet: CoreNetworks.testnet,
  bitcoinRegtest: CoreNetworks.regtest,
};

export const resolveBitcoinNetwork = (
  name: string | undefined,
): BitcoinNetwork | undefined =>
  name === undefined ? undefined : aliases[name];
