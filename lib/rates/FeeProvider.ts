import { BigNumber } from 'ethers';
import Logger from '../Logger';
import { PairConfig } from '../consts/Types';
import DataAggregator from './data/DataAggregator';
import { BaseFeeType, OrderSide } from '../consts/Enums';
import { etherDecimals, gweiDecimals } from '../consts/Consts';
import { getChainCurrency, getPairId, mapToObject, splitPairId, stringify } from '../Utils';

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

  // TODO: query those estimations from the provider
  public static gasUsage = {
    EtherSwap: {
      lockup: 46460,
      claim: 24924,
      refund: 23372,
    },
    ERC20Swap: {
      lockup: 86980,
      claim: 24522,
      refund: 23724,
    },
  };

  constructor(
    private logger: Logger,
    private dataAggregator: DataAggregator,
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
    type: BaseFeeType,
  ): {
    baseFee: number,
    percentageFee: number,
  } => {
    let percentageFee = this.getPercentageFee(pair);

    if (percentageFee !== 0) {
      percentageFee = percentageFee * amount * rate;
    }

    const { base, quote } = splitPairId(pair);
    const chainCurrency = getChainCurrency(base, quote, orderSide, type !== BaseFeeType.NormalClaim);

    const minerFeeMap = this.minerFees.get(chainCurrency)!;

    let baseFee: number;

    switch (type) {
      case BaseFeeType.NormalClaim:
        baseFee = minerFeeMap.normal;
        break;

      case BaseFeeType.ReverseClaim:
        baseFee = minerFeeMap.reverse.claim;
        break;

      case BaseFeeType.ReverseLockup:
        baseFee = minerFeeMap.reverse.lockup;
        break;
    }

    return {
      baseFee: baseFee,
      percentageFee: Math.ceil(percentageFee),
    };
  }

  public updateMinerFees = async (chainCurrency: string): Promise<void> => {
    const feeMap = await this.getFeeEstimation(chainCurrency);

    // TODO: avoid hard coding symbols
    switch (chainCurrency) {
      case 'BTC':
      case 'LTC': {
        const relativeFee = feeMap.get(chainCurrency)!;

        this.minerFees.set(chainCurrency, {
          normal: relativeFee * FeeProvider.transactionSizes.normalClaim,
          reverse: {
            claim: relativeFee * FeeProvider.transactionSizes.reverseClaim,
            lockup: relativeFee * FeeProvider.transactionSizes.reverseLockup,
          },
        });

        break;
      }

      case 'ETH': {
        const relativeFee = feeMap.get(chainCurrency)!;
        const claimCost = this.calculateEtherGasCost(relativeFee, FeeProvider.gasUsage.EtherSwap.claim);

        this.minerFees.set(chainCurrency, {
          normal: claimCost,
          reverse: {
            claim: claimCost,
            lockup: this.calculateEtherGasCost(relativeFee, FeeProvider.gasUsage.EtherSwap.lockup),
          },
        });

        break;
      }

      // If it is not BTC, LTC or ETH, it is an ERC20 token
      default: {
        const relativeFee = feeMap.get('ETH')!;
        const rate = this.dataAggregator.latestRates.get(getPairId({ base: 'ETH', quote: chainCurrency }))!;

        const claimCost = this.calculateTokenGasCosts(
          rate,
          relativeFee,
          FeeProvider.gasUsage.ERC20Swap.claim,
        );

        this.minerFees.set(chainCurrency, {
          normal: claimCost,
          reverse: {
            claim: claimCost,
            lockup: this.calculateTokenGasCosts(
              rate,
              relativeFee,
              FeeProvider.gasUsage.ERC20Swap.lockup,
            )
          }
        });
        break;
      }
    }
  }

  private calculateTokenGasCosts = (rate: number, gasPrice: number, gasUsage: number) => {
    return Math.ceil(rate * this.calculateEtherGasCost(gasPrice, gasUsage));
  }

  private calculateEtherGasCost = (gasPrice: number, gasUsage: number) => {
    return BigNumber.from(gasPrice).mul(gweiDecimals).mul(gasUsage).div(etherDecimals).toNumber();
  }
}

export default FeeProvider;
export { ReverseMinerFees, MinerFees };
