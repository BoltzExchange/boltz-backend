/**
 * Get the BIP21 prefix for a currency
 */
const getBip21Prefix = (symbol: string) => {
  return symbol === 'BTC' ? 'bitcoin' : 'litecoin';
};

/**
 * Encode a BIP21 payment request
 */
export const encodeBip21 = (symbol: string, address: string, satoshis: number, label?: string): string => {
  let request = `${getBip21Prefix(symbol)}:${address}?amount=${satoshis / 100000000}`;

  if (label) {
    request += `&label=${label.replace(/ /g, '%20')}`;
  }

  return request;
};
