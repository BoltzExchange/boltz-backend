import Logger from '../Logger';
import { OrderSide } from '../consts/Enums';
import { PairConfig } from '../consts/Types';
import { mapToObject, getPairId, stringify, getChainCurrency, splitPairId } from '../Utils';

type ReverseMinerFees = {
  lockup: number;
  claim: number;
};

type MinerFees = {
  normal: number;
  reverse: ReverseMinerFees;
};

class FeeProvider {
  // A map between the symbols of the pairs and their percentage fees
  public percentageFees = new Map<string, number>();

  public minerFees = new Map<string, MinerFees>();

  public static transactionSizes = {
    // The claim transaction which spends a nested SegWit swap output and sends it to a P2WPKH address has about 170 vbytes
    normalClaim: 170,

    // We cannot know what kind of address the user will claim to so we just assume the worst case: P2PKH
    // Claiming a P2WSH to a P2PKH address is about 138 bytes
    reverseClaim: 138,

    // The lockup transaction which spends a P2WPKH output (possibly more but we assume a best case scenario here),
    // locks up funds in a P2WSH swap and sends the change back to a P2WKH output has about 153 vbytes
    reverseLockup: 153,
  };

  constructor(
    private logger: Logger,
    private getFeeEstimation: (symbol: string) => Promise<Map<string, number>>,
  ) {}

  public init = (pairs: PairConfig[]): void => {
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

  public getPercentageFee = (pair: string): number => {
    return this.percentageFees.get(pair) || 0;
  }

  public getFees = (
    pair: string,
    rate: number,
    orderSide: OrderSide,
    amount: number,
    isReverse: boolean,
  ): {
    baseFee: number,
    percentageFee: number,
  } => {
    let percentageFee = this.getPercentageFee(pair);

    if (percentageFee !== 0) {
      percentageFee = percentageFee * amount * rate;
    }

    const { base, quote } = splitPairId(pair);
    const chainCurrency = getChainCurrency(base, quote, orderSide, isReverse);

    const minerFeeMap = this.minerFees.get(chainCurrency)!;

    return {
      percentageFee: Math.ceil(percentageFee),
      baseFee: isReverse ? minerFeeMap.reverse.lockup : minerFeeMap.normal,
    };
  }

  public updateMinerFees = async (chainCurrency: string): Promise<void> => {
    const satPerVbyte = (await this.getFeeEstimation(chainCurrency)).get(chainCurrency)!;

    this.minerFees.set(chainCurrency, {
      normal: satPerVbyte * FeeProvider.transactionSizes.normalClaim,
      reverse: {
        claim: satPerVbyte * FeeProvider.transactionSizes.reverseClaim,
        lockup: satPerVbyte * FeeProvider.transactionSizes.reverseLockup,
      },
    });
  }
}

export default FeeProvider;
export { ReverseMinerFees, MinerFees };
