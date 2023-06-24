import { encode } from 'querystring';
import { networks as networksLiquid } from 'liquidjs-lib';
import { getAssetHash } from '../Core';
import { CurrencyType } from '../consts/Enums';
import { Currency } from '../wallet/WalletManager';
import ElementsClient from '../chain/ElementsClient';
import { satoshisToCoins } from '../DenominationConverter';

class PaymentRequestUtils {
  private prefixes = new Map<string, string>([
    ['BTC', 'bitcoin'],
    ['LTC', 'litecoin'],
    [ElementsClient.symbol, 'liquidnetwork'],
  ]);

  private readonly lbtcAssetHash?: string;

  constructor(liquid?: Currency) {
    if (liquid) {
      this.lbtcAssetHash = getAssetHash(CurrencyType.Liquid, liquid.network!);

      if (liquid.network! === networksLiquid.testnet) {
        this.prefixes.set(ElementsClient.symbol, 'liquidtestnet');
      }
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
    const isLbtc = symbol === ElementsClient.symbol;

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
    return this.prefixes.get(symbol);
  };
}

export default PaymentRequestUtils;
