import Logger from '../Logger';
import { BigNumber } from 'ethers';
import { PairConfig } from '../consts/Types';
import DataAggregator from './data/DataAggregator';
import { BaseFeeType, OrderSide } from '../consts/Enums';
import { etherDecimals, gweiDecimals } from '../consts/Consts';
import { mapToObject, getPairId, stringify, getChainCurrency, splitPairId } from '../Utils';

class FeeProvider {
  // A map between the symbols of the pairs and their percentage fees
  public percentageFees = new Map<string, number>();

  public static transactionSizes = {
    normalClaim: 170,

    reverseLockup: 153,
    reverseClaim: 138,
  };

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

  public getFees = async (
    pair: string,
    rate: number,
    orderSide: OrderSide,
    amount: number,
    type: BaseFeeType,
  ): Promise<{
    baseFee: number,
    percentageFee: number,
  }> => {
    let percentageFee = this.getPercentageFee(pair);

    if (percentageFee !== 0) {
      percentageFee = percentageFee * amount * rate;
    }

    const { base, quote } = splitPairId(pair);
    const chainCurrency = getChainCurrency(base, quote, orderSide, type !== BaseFeeType.NormalClaim);

    return {
      percentageFee: Math.ceil(percentageFee),
      baseFee: await this.getBaseFee(chainCurrency, type),
    };
  }

  public getBaseFee = async (chainCurrency: string, type: BaseFeeType): Promise<number> => {
    const feeMap = await this.getFeeEstimation(chainCurrency);

    // TODO: avoid hard coding symbols
    switch (chainCurrency) {
      case 'BTC':
      case 'LTC': {
        const relativeFee = feeMap.get(chainCurrency)!;

        switch (type) {
          case BaseFeeType.NormalClaim:
            // The claim transaction which spends a nested SegWit (P2SH nested P2WSH) swap output and
            // sends it to a P2WPKH address has about 170 vbytes
            return relativeFee * FeeProvider.transactionSizes.normalClaim;

          case BaseFeeType.ReverseLockup:
            // The lockup transaction which spends a P2WPKH output (possibly more but we assume a best case scenario here),
            // locks up funds in a P2WSH swap and sends the change back to a P2WKH output has about 153 vbytes
            return relativeFee * FeeProvider.transactionSizes.reverseLockup;

          case BaseFeeType.ReverseClaim:
            // We cannot know what kind of address the user will claim to, so we just assume the worst case: P2PKH
            // Claiming a P2WSH swap output to a P2PKH address is about 138 vbytes
            return relativeFee * FeeProvider.transactionSizes.reverseClaim;
        }
        break;
      }

      case 'ETH':
        switch (type) {
          case BaseFeeType.NormalClaim:
          case BaseFeeType.ReverseClaim: {
            return this.calculateEtherGasCost(feeMap.get(chainCurrency)!, FeeProvider.gasUsage.EtherSwap.claim);
          }

          case BaseFeeType.ReverseLockup: {
            return this.calculateEtherGasCost(feeMap.get(chainCurrency)!, FeeProvider.gasUsage.EtherSwap.lockup);
          }
        }
        break;

      // If it is not BTC, LTC or ETH, it is an ERC20 token
      default:
        switch (type) {
          case BaseFeeType.NormalClaim:
          case BaseFeeType.ReverseClaim:
            return this.calculateTokenGasCosts(
              this.dataAggregator.latestRates.get(getPairId({ base: 'ETH', quote: chainCurrency }))!,
              feeMap.get('ETH')!,
              FeeProvider.gasUsage.ERC20Swap.claim,
            );

          case BaseFeeType.ReverseLockup:
            return this.calculateTokenGasCosts(
              this.dataAggregator.latestRates.get(getPairId({ base: 'ETH', quote: chainCurrency }))!,
              feeMap.get('ETH')!,
              FeeProvider.gasUsage.ERC20Swap.lockup,
            );
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
