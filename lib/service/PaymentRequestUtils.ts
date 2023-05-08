import { encode } from 'querystring';
import { getAssetHash } from '../Core';
import { CurrencyType } from '../consts/Enums';
import { Currency } from '../wallet/WalletManager';
import { satoshisToCoins } from '../DenominationConverter';

class PaymentRequestUtils {
  private static prefixes = new Map<string, string>([
    ['BTC', 'bitcoin'],
    ['L-BTC', 'liquidnetwork'],
    ['LTC', 'litecoin'],
  ]);

  private readonly lbtcAssetHash?: string;

  constructor(liquid?: Currency) {
    if (liquid) {
      this.lbtcAssetHash = getAssetHash(CurrencyType.Liquid, liquid.network!);
    }
  }

  /**
   * Encode a BIP21 payment request
   */
  public encodeBip21 = (
    symbol: string,
    address: string,
    satoshis: number,
    label?: string,
  ): string | undefined => {
    const prefix = this.getBip21Prefix(symbol);
    const isLbtc = symbol === 'L-BTC';

    if (prefix === undefined || (isLbtc && this.lbtcAssetHash === undefined)) {
      return;
    }

    const params: Record<string, string> = {
      amount: `${satoshisToCoins(satoshis)}`,
    };

    if (label) {
      params['label'] = label;
    }

    if (isLbtc) {
      params['assetid'] = this.lbtcAssetHash!;
    }

    return `${prefix}:${address}?${encode(params)}`;
  };

  /**
   * Get the BIP21 prefix for a currency
   */
  private getBip21Prefix = (symbol: string): string | undefined => {
    return PaymentRequestUtils.prefixes.get(symbol);
  };
}

export default PaymentRequestUtils;
