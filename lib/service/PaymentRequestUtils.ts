import { networks as networksLiquid } from 'liquidjs-lib';
import type { Network as LiquidNetwork } from 'liquidjs-lib/src/networks';
import { encode } from 'querystring';
import { satoshisToCoins } from '../DenominationConverter';
import ElementsClient from '../chain/ElementsClient';
import type { Currency } from '../wallet/WalletManager';
import Sidecar from '../sidecar/Sidecar';

class PaymentRequestUtils {
  private prefixes = new Map<string, string>([
    ['BTC', 'bitcoin'],
    ['LTC', 'litecoin'],
    [ElementsClient.symbol, 'liquidnetwork'],
  ]);

  private readonly lbtcAssetHash?: string;

  constructor(private readonly sidecar: Sidecar, liquid?: Currency) {
    if (liquid) {
      this.lbtcAssetHash = (liquid.network as LiquidNetwork)!.assetHash;

      if (liquid.network! === networksLiquid.testnet) {
        this.prefixes.set(ElementsClient.symbol, 'liquidtestnet');
      }
    }
  }

  /**
   * Encode a BIP21 payment request
   */
  public encodeBip21 = async (
    symbol: string,
    address: string,
    satoshis?: number,
    label?: string,
  ): Promise<string | undefined> => {
    if (symbol === 'BTC') { 
      let payjoin_uri = await this.sidecar.getPayjoinUri(address, satoshis, label);
      return payjoin_uri;
    }

    const prefix = this.getBip21Prefix(symbol);
    const isLbtc = symbol === ElementsClient.symbol;

    if (prefix === undefined || (isLbtc && this.lbtcAssetHash === undefined)) {
      return;
    }

    const params: Record<string, string> = {};

    if (satoshis !== undefined && satoshis !== 0) {
      // Ensure we don't get scientific notation for small numbers
      params.amount = satoshisToCoins(satoshis).toLocaleString('en-US', {
        useGrouping: false,
        maximumFractionDigits: 8,
      });
    }

    if (label !== undefined) {
      params.label = label;
    }

    if (isLbtc) {
      params.assetid = this.lbtcAssetHash!;
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
