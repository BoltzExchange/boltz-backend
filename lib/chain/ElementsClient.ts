import Logger from '../Logger';
import ChainClient from './ChainClient';
import { ChainConfig } from '../Config';
import { CurrencyType } from '../consts/Enums';
import { AddressInfo, LiquidBalances } from '../consts/LiquidTypes';

class ElementsClient extends ChainClient {
  constructor(logger: Logger, config: ChainConfig, readonly symbol: string) {
    super(logger, config, symbol);
    this.currencyType = CurrencyType.Liquid;
    this.feeFloor = 0.11;
  }

  public getBalances = async () => {
    const res = await this.client.request<LiquidBalances>('getbalances');

    for (const balanceType of Object.values(res.mine)) {
      for (const [key, value] of Object.entries(balanceType)) {
        balanceType[key] = value * ChainClient.decimals;
      }
    }

    return res;
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
      undefined,
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
