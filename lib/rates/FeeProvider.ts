import Logger from '../Logger';
import { PairConfig } from '../consts/Types';
import { OrderSide, SwapType } from '../consts/Enums';
import { mapToObject, getPairId, stringify, getChainCurrency, splitPairId, getSendingReceivingCurrency } from '../Utils';

class FeeProvider {
  // A map between the symbols of the pairs and their percentage fees
  public percentageFees = new Map<string, number>();

  public static transactionSizes = {
    normalClaim: 170,

    reverseLockup: 153,
    reverseClaim: 138,
  };

  constructor(
    private logger: Logger,
    private getFeeEstimation: (symbol: string) => Promise<Map<string, number>>,
  ) {}

  public init = (pairs: PairConfig[]) => {
    pairs.forEach((pair) => {
      // Set the configured fee or fallback to 1% if it is not defined
      const percentage = pair.fee !== undefined ? pair.fee : 1;

      if (pair.fee === undefined) {
        this.logger.warn(`Setting default fee of ${percentage}% for pair ${pair.base}/${pair.quote} because none was specified`);
      }

      this.percentageFees.set(getPairId(pair), percentage / 100);
    });

    this.logger.debug(`Prepared data for fee estimations: ${stringify(mapToObject(this.percentageFees))}`);
  }

  public getFees = async (
    pair: string,
    rate: number,
    orderSide: OrderSide,
    amount: number,
    type: SwapType,
  ) => {
    const percentageFee = this.getPercentageFee(pair, amount, rate);

    const { base, quote } = splitPairId(pair);

    let baseFee = 0;

    if (type !== SwapType.ChainToChain) {
      const isReverse = type === SwapType.ReverseSubmarine;

      const chainCurrency = getChainCurrency(base, quote, orderSide, isReverse);
      baseFee = await this.getBaseFee(chainCurrency, isReverse);
    } else {
      const { sending, receiving } = getSendingReceivingCurrency(base, quote, orderSide);

      baseFee = await this.getBaseFee(receiving, false);
      baseFee += await this.getBaseFee(sending, true) * rate;
    }

    return {
      baseFee,
      percentageFee,
    };
  }

  public getBaseFee = async (chainCurrency: string, isLockup: boolean) => {
    const feeMap = await this.getFeeEstimation(chainCurrency);

    return this.calculateBaseFee(feeMap.get(chainCurrency)!, isLockup);
  }

  private getPercentageFee = (pair: string, amount: number, rate: number) => {
    let percentageFee = this.percentageFees.get(pair) || 0;

    if (percentageFee !== 0) {
      percentageFee = percentageFee * amount * rate;
    }

    return Math.ceil(percentageFee);
  }

  private calculateBaseFee = (satPerVbyte: number, isLockup: boolean) => {
    if (isLockup) {
      // The lockup transaction which spends a P2WPKH output (possibly more but we assume a best case scenario here),
      // locks up funds in a P2WSH swap and sends the change back to a P2WKH output has about 153 vbytes
      return satPerVbyte * FeeProvider.transactionSizes.reverseLockup;
    } else {
      // The claim transaction which spends a nested SegWit swap output and
      // sends it to a P2WPKH address has about 170 vbytes
      return satPerVbyte * FeeProvider.transactionSizes.normalClaim;
    }
  }
}

export default FeeProvider;
