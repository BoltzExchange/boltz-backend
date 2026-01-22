import type { Transaction } from 'liquidjs-lib';
import { confidential } from 'liquidjs-lib';
import type { ChainConfig } from '../Config';
import type Logger from '../Logger';
import { CurrencyType } from '../consts/Enums';
import type { AddressInfo, LiquidBalances } from '../consts/LiquidTypes';
import { liquidSymbol } from '../consts/LiquidTypes';
import type Sidecar from '../sidecar/Sidecar';
import type { AddressType, IChainClient } from './ChainClient';
import ChainClient from './ChainClient';

enum LiquidAddressType {
  Blech32 = 'blech32',
}

interface IElementsClient extends IChainClient {
  getAddressInfo(address: string): Promise<AddressInfo>;

  getBalances(): Promise<LiquidBalances>;
  getNewAddress(
    label: string,
    type?: AddressType | LiquidAddressType,
  ): Promise<string>;
  dumpBlindingKey(address: string): Promise<string>;
}

class ElementsClient extends ChainClient implements IElementsClient {
  public static readonly symbol = liquidSymbol;

  private static readonly elementsFeeFloor = 0.1;

  constructor(
    logger: Logger,
    sidecar: Sidecar,
    network: string,
    config: ChainConfig,
    public readonly isLowball = false,
  ) {
    if (config.wallet) {
      logger.debug(
        `Using wallet "${config.wallet}" for ${ElementsClient.symbol} ${isLowball ? 'lowball' : 'public'} RPC`,
      );
    }

    super(
      logger,
      sidecar,
      network,
      {
        ...config,
        feeFloor: config.feeFloor ?? ElementsClient.elementsFeeFloor,
      },
      ElementsClient.symbol,
    );
    this.currencyType = CurrencyType.Liquid;
  }

  public static needsLowball = (tx: Transaction): boolean => {
    const feeOutput = tx.outs.find((out) => out.script.length === 0);
    if (feeOutput === undefined) {
      return false;
    }

    return (
      confidential.confidentialValueToSatoshi(feeOutput.value) /
        tx.virtualSize(true) <
      ElementsClient.elementsFeeFloor
    );
  };

  public serviceName = (): string => {
    return 'Elements';
  };

  public getBalances = async () => {
    const res = await this.client.request<LiquidBalances>(
      'getbalances',
      undefined,
      true,
    );

    for (const balanceType of Object.values(res.mine)) {
      for (const [key, value] of Object.entries(balanceType)) {
        balanceType[key] = Math.floor(value * ChainClient.decimals);
      }
    }

    return res;
  };

  public getNewAddress = (
    label: string,
    type: AddressType | LiquidAddressType = LiquidAddressType.Blech32,
  ): Promise<string> => {
    return this.client.request<string>('getnewaddress', [label, type], true);
  };

  public override sendToAddress = (
    address: string,
    amount: number,
    satPerVbyte: number | undefined,
    subtractFeeFromAmount = false,
    label: string,
  ): Promise<string> => {
    return this.client.request<string>(
      'sendtoaddress',
      [
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
      ],
      true,
    );
  };

  public override estimateFee = async (): Promise<number> => {
    return this.feeFloor;
  };

  public getAddressInfo = (address: string): Promise<AddressInfo> => {
    return this.client.request<AddressInfo>('getaddressinfo', [address], true);
  };

  public dumpBlindingKey = (address: string): Promise<string> => {
    return this.client.request<string>('dumpblindingkey', [address], true);
  };
}

export default ElementsClient;
export { LiquidAddressType, IElementsClient };
