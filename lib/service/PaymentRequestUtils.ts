import { networks as networksLiquid } from 'liquidjs-lib';
import type { Network as LiquidNetwork } from 'liquidjs-lib/src/networks';
import { encode } from 'querystring';
import { satoshisToCoins } from '../DenominationConverter';
import ArkClient from '../chain/ArkClient';
import ElementsClient from '../chain/ElementsClient';
import type { Currency } from '../wallet/WalletManager';

type PaymentInstruction = {
  key: string;
  value: string;
};

class PaymentRequestUtils {
  private prefixes = new Map<string, string>([
    ['BTC', 'bitcoin'],
    [ElementsClient.symbol, 'liquidnetwork'],
  ]);

  private readonly lbtcAssetHash?: string;

  constructor(liquid?: Currency) {
    if (liquid) {
      this.lbtcAssetHash = (liquid.network as LiquidNetwork)!.assetHash;

      if (liquid.network! === networksLiquid.testnet) {
        this.prefixes.set(ElementsClient.symbol, 'liquidtestnet');
      }
    }
  }

  /**
   * Encode a BIP-321 payment URI.
   */
  public encodePaymentUri = (
    symbol: string,
    address: string,
    satoshis?: number,
    label?: string,
  ): string | undefined => {
    return this.encodePaymentUriWithParams(
      symbol,
      address,
      this.encodeParams(symbol, satoshis, label),
    );
  };

  /**
   * Encode a BIP-321 payment URI with parameters.
   */
  public encodePaymentUriWithParams = (
    symbol: string,
    address: string,
    params?: string,
  ) => {
    const prefix = this.getPaymentUriPrefix(symbol);
    const isLbtc = symbol === ElementsClient.symbol;

    if (prefix === undefined || (isLbtc && this.lbtcAssetHash === undefined)) {
      return;
    }

    const paymentInstruction = this.getPaymentInstruction(symbol, address);
    const query = this.joinQueryParts(paymentInstruction, params);

    if (paymentInstruction !== undefined) {
      return `${prefix}:?${query}`;
    }

    if (query === undefined) {
      return `${prefix}:${address}`;
    }

    return `${prefix}:${address}?${query}`;
  };

  public encodeParams = (symbol: string, satoshis?: number, label?: string) => {
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
    if (symbol === ElementsClient.symbol) {
      params.assetid = this.lbtcAssetHash!;
    }
    return encode(params);
  };

  /**
   * Get the payment URI scheme for a currency.
   */
  private getPaymentUriPrefix = (symbol: string): string | undefined => {
    if (symbol === ArkClient.symbol) {
      return this.prefixes.get('BTC');
    }

    return this.prefixes.get(symbol);
  };

  private getPaymentInstruction = (
    symbol: string,
    address: string,
  ): PaymentInstruction | undefined => {
    if (symbol === ArkClient.symbol) {
      return {
        key: 'ark',
        value: encodeURIComponent(address),
      };
    }

    return undefined;
  };

  private joinQueryParts = (
    paymentInstruction?: PaymentInstruction,
    params?: string,
  ): string | undefined => {
    const queryParts: string[] = [];

    if (paymentInstruction !== undefined) {
      queryParts.push(`${paymentInstruction.key}=${paymentInstruction.value}`);
    }

    if (params !== undefined && params !== '') {
      queryParts.push(params);
    }

    return queryParts.length === 0 ? undefined : queryParts.join('&');
  };
}

export default PaymentRequestUtils;
