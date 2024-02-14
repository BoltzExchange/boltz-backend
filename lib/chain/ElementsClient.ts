import { ChainConfig } from '../Config';
import Logger from '../Logger';
import { CurrencyType } from '../consts/Enums';
import {
  AddressInfo,
  LiquidBalances,
  liquidSymbol,
} from '../consts/LiquidTypes';
import ChainClient, { AddressType } from './ChainClient';

enum LiquidAddressType {
  Blech32 = 'blech32',
}

class ElementsClient extends ChainClient {
  public static readonly symbol = liquidSymbol;

  constructor(logger: Logger, config: ChainConfig) {
    super(logger, config, ElementsClient.symbol);
    this.currencyType = CurrencyType.Liquid;
    this.feeFloor = 0.11;
  }

  public serviceName = (): string => {
    return 'Elements';
  };

  public getBalances = async () => {
    const res = await this.client.request<LiquidBalances>('getbalances');

    for (const balanceType of Object.values(res.mine)) {
      for (const [key, value] of Object.entries(balanceType)) {
        balanceType[key] = value * ChainClient.decimals;
      }
    }

    return res;
  };

  public getNewAddress = (
    type: AddressType | LiquidAddressType = LiquidAddressType.Blech32,
  ): Promise<string> => {
    return this.client.request<string>('getnewaddress', [undefined, type]);
  };

  public override sendToAddress = (
    address: string,
    amount: number,
    satPerVbyte?: number,
    subtractFeeFromAmount = false,
  ): Promise<string> => {
    return this.client.request<string>('sendtoaddress', [
      address,
      amount / ChainClient.decimals,
      undefined,
      undefined,
      subtractFeeFromAmount,
      false,
      undefined,
      undefined,
      undefined,
      undefined,
      false,
      satPerVbyte,
    ]);
  };

  public override estimateFee = async (): Promise<number> => {
    return 0.11;
  };

  public getAddressInfo = (address: string): Promise<AddressInfo> => {
    return this.client.request<AddressInfo>('getaddressinfo', [address]);
  };

  public dumpBlindingKey = (address: string): Promise<string> => {
    return this.client.request<string>('dumpblindingkey', [address]);
  };
}

export default ElementsClient;
export { LiquidAddressType };
