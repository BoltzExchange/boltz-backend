import { Currency } from '../wallet/WalletManager';

/**
 * Get the BIP21 prefix for a currency
 */
export const getBip21Prefix = (currency: Currency) => {
  return currency.symbol === 'BTC' ? 'bitcoin' : 'litecoin';
};

/**
 * Encode a BIP21 payment request
 */
export const encodeBip21 = (prefix: string, address: string, satoshis: number, label?: string) => {
  let request = `${prefix}:${address}?value=${satoshis / 100000000}`;

  if (label) {
    request += `&label=${label.replace(/ /g, '%20')}`;
  }

  return request;
};
