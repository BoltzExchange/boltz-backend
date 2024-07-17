import { Transaction, confidential } from 'liquidjs-lib';
import { ChainConfig } from '../Config';
import Logger from '../Logger';
import { CurrencyType } from '../consts/Enums';
import {
  AddressInfo,
  LiquidBalances,
  liquidSymbol,
} from '../consts/LiquidTypes';
import ChainClient, { AddressType, IChainClient } from './ChainClient';

enum LiquidAddressType {
  Blech32 = 'blech32',
}

interface IElementsClient extends IChainClient<Transaction> {
  getAddressInfo(address: string): Promise<AddressInfo>;

  getBalances(): Promise<LiquidBalances>;
  getNewAddress(
    label: string,
    type?: AddressType | LiquidAddressType,
  ): Promise<string>;
  dumpBlindingKey(address: string): Promise<string>;
}

class ElementsClient
  extends ChainClient<Transaction>
  implements IElementsClient
{
  public static readonly symbol = liquidSymbol;

  private static readonly minNoLowBallFee = 0.1;

  constructor(
    logger: Logger,
    config: ChainConfig,
    public readonly isLowball = false,
  ) {
    super(logger, config, ElementsClient.symbol);
    this.currencyType = CurrencyType.Liquid;
    this.feeFloor = isLowball ? 0.01 : 0.11;
  }

  public static needsLowball = (tx: Transaction): boolean => {
    const feeOutput = tx.outs.find((out) => out.script.length === 0);
    if (feeOutput === undefined) {
      return false;
    }

    return (
      confidential.confidentialValueToSatoshi(feeOutput.value) /
        tx.virtualSize() <
      ElementsClient.minNoLowBallFee
    );
  };

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
    label: string,
    type: AddressType | LiquidAddressType = LiquidAddressType.Blech32,
  ): Promise<string> => {
    return this.client.request<string>('getnewaddress', [label, type]);
  };

  public override sendToAddress = (
    address: string,
    amount: number,
    satPerVbyte: number | undefined,
    subtractFeeFromAmount = false,
    label: string,
  ): Promise<string> => {
    return this.client.request<string>('sendtoaddress', [
      address,
      amount / ChainClient.decimals,
      label,
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
    return this.feeFloor;
  };

  public getAddressInfo = (address: string): Promise<AddressInfo> => {
    return this.client.request<AddressInfo>('getaddressinfo', [address]);
  };

  public dumpBlindingKey = (address: string): Promise<string> => {
    return this.client.request<string>('dumpblindingkey', [address]);
  };
}

export default ElementsClient;
export { LiquidAddressType, IElementsClient };
