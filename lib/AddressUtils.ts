import { Address, OutScript } from '@scure/btc-signer/payment.js';
import type { Network as LiquidNetwork } from 'liquidjs-lib/src/networks';
import ElementsClient from './chain/ElementsClient';
import type { BitcoinNetwork } from './consts/BitcoinNetworks';
import { CurrencyType } from './consts/Enums';
import type Sidecar from './sidecar/Sidecar';

type AddressEncodable = Parameters<ReturnType<typeof Address>['encode']>[0];

const isBitcoin = (type: CurrencyType) => type === CurrencyType.BitcoinLike;

export const outputScriptFromAddress = async (
  type: CurrencyType,
  toDecode: string,
  network: BitcoinNetwork | LiquidNetwork,
  sidecar?: Sidecar,
): Promise<Buffer> => {
  if (isBitcoin(type)) {
    const decoded = Address(network as BitcoinNetwork).decode(toDecode);
    if (decoded === undefined) {
      throw new Error('invalid address');
    }
    try {
      return Buffer.from(OutScript.encode(decoded));
    } catch (err) {
      throw new Error(`could not encode output script: ${err}`);
    }
  }
  if (sidecar === undefined) {
    throw new Error('sidecar required for Liquid address decoding');
  }
  return (await sidecar.decodeAddress(ElementsClient.symbol, toDecode))
    .scriptPubkey;
};

export const addressFromOutputScript = async (
  type: CurrencyType,
  outputScript: Uint8Array,
  network: BitcoinNetwork | LiquidNetwork,
  blindingKey?: Uint8Array,
  sidecar?: Sidecar,
): Promise<string> => {
  if (isBitcoin(type)) {
    const decoded = OutScript.decode(outputScript);
    if (decoded === undefined) {
      throw new Error('invalid output script');
    }
    try {
      return Address(network as BitcoinNetwork).encode(
        decoded as AddressEncodable,
      );
    } catch (err) {
      throw new Error(
        `could not encode address for script type ${decoded.type}: ${err}`,
      );
    }
  }
  if (sidecar === undefined) {
    throw new Error('sidecar required for Liquid address encoding');
  }
  return sidecar.encodeAddress(
    ElementsClient.symbol,
    Buffer.from(outputScript),
    blindingKey && blindingKey.length > 0 ? Buffer.from(blindingKey) : undefined,
  );
};
