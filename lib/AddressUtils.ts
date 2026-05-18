import { Address, OutScript } from '@scure/btc-signer/payment.js';
import { address as liquidAddress } from 'liquidjs-lib';
import type { Network as LiquidNetwork } from 'liquidjs-lib/src/networks';
import type { BitcoinNetwork } from './consts/BitcoinNetworks';
import { CurrencyType } from './consts/Enums';

type AddressEncodable = Parameters<ReturnType<typeof Address>['encode']>[0];

const isBitcoin = (type: CurrencyType) => type === CurrencyType.BitcoinLike;

export const outputScriptFromAddress = (
  type: CurrencyType,
  toDecode: string,
  network: BitcoinNetwork | LiquidNetwork,
): Buffer => {
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
  return liquidAddress.toOutputScript(toDecode, network as LiquidNetwork);
};

export const addressFromOutputScript = (
  type: CurrencyType,
  outputScript: Uint8Array,
  network: BitcoinNetwork | LiquidNetwork,
  blindingKey?: Uint8Array,
): string => {
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
  const addr = liquidAddress.fromOutputScript(
    Buffer.from(outputScript),
    network as LiquidNetwork,
  );
  if (blindingKey && blindingKey.length > 0) {
    return liquidAddress.toConfidential(addr, Buffer.from(blindingKey));
  }
  return addr;
};
