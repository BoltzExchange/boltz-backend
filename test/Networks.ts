import type { BTC_NETWORK } from '@scure/btc-signer/utils.js';
import { NETWORK, TEST_NETWORK } from '@scure/btc-signer/utils.js';

export type BitcoinNetwork = BTC_NETWORK;

export const bitcoin: BitcoinNetwork = NETWORK;
export const testnet: BitcoinNetwork = TEST_NETWORK;

export const regtest: BitcoinNetwork = {
  bech32: 'bcrt',
  pubKeyHash: 0x6f,
  scriptHash: 0xc4,
  wif: 0xef,
};
