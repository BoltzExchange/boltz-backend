import {
  CurrencyType,
  SwapType,
  currencyTypeToString,
} from '../../../consts/Enums';
import type Swap from '../../../db/models/Swap';
import type { ChainSwapInfo } from '../../../db/repositories/ChainSwapRepository';
import type { Currency } from '../../../wallet/WalletManager';
import TimeoutDeltaProvider from '../../TimeoutDeltaProvider';
import SweepTrigger from './SweepTrigger';

class ExpiryTrigger extends SweepTrigger {
  constructor(
    private readonly currencies: Map<string, Currency>,
    private readonly expiryTolerance: number,
  ) {
    super();
  }

  public check = async (
    chainCurrency: string,
    swap: Swap | ChainSwapInfo,
  ): Promise<boolean> => {
    const timeoutBlockHeight =
      swap.type === SwapType.Submarine
        ? (swap as Swap).timeoutBlockHeight
        : (swap as ChainSwapInfo).receivingData.timeoutBlockHeight;

    const blockHeight = await this.getBlockHeight(chainCurrency);
    const minutesLeft =
      TimeoutDeltaProvider.blockTimes.get(chainCurrency)! *
      (timeoutBlockHeight - blockHeight);

    return minutesLeft <= this.expiryTolerance;
  };

  public close = () => {};

  private getBlockHeight = async (chainCurrency: string) => {
    const currency = this.currencies.get(chainCurrency);
    if (!currency) {
      throw new Error(`currency ${chainCurrency} not found`);
    }

    switch (currency.type) {
      case CurrencyType.BitcoinLike:
      case CurrencyType.Liquid:
        return (await currency.chainClient!.getBlockchainInfo()).blocks;

      case CurrencyType.Ether:
      case CurrencyType.ERC20:
        return await currency.provider!.getBlockNumber();

      case CurrencyType.Ark:
        throw new Error(
          `${currencyTypeToString(currency.type)} has no block height`,
        );
    }
  };
}

export default ExpiryTrigger;
