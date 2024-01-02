import Logger from '../Logger';
import { getChainCurrency, getPairId, splitPairId, stringify } from '../Utils';
import ElementsClient from '../chain/ElementsClient';
import { etherDecimals, gweiDecimals } from '../consts/Consts';
import { BaseFeeType, OrderSide } from '../consts/Enums';
import { PairConfig } from '../consts/Types';
import WalletManager from '../wallet/WalletManager';
import { Ethereum, Rsk } from '../wallet/ethereum/EvmNetworks';
import DataAggregator from './data/DataAggregator';

type PercentageFees = {
  percentage: number;
  percentageSwapIn: number;
};

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
  public percentageSwapInFees = new Map<string, number>();

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

  public static transactionSizesLiquid = {
    normalClaim: 1333,
    reverseLockup: 2503,
    reverseClaim: 1378,
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

  private static readonly defaultFee = 1;

  constructor(
    private logger: Logger,
    private walletManager: WalletManager,
    private dataAggregator: DataAggregator,
    private getFeeEstimation: (symbol: string) => Promise<Map<string, number>>,
  ) {}

  public init = (pairs: PairConfig[]): void => {
    const feesToPrint = {};

    pairs.forEach((pair) => {
      const pairId = getPairId(pair);

      // Set the configured fee or fallback to 1% if it is not defined
      let percentage = pair.fee;

      if (percentage === undefined) {
        percentage = FeeProvider.defaultFee;
        this.logger.warn(
          `Setting default fee of ${percentage}% for pair ${pairId} because none was specified`,
        );
      }

      this.percentageFees.set(pairId, percentage / 100);

      if (pair.swapInFee) {
        this.percentageSwapInFees.set(pairId, pair.swapInFee / 100);
      }

      feesToPrint[pairId] = this.getPercentageFees(pairId);
    });

    this.logger.debug(
      `Prepared data for fee estimations: ${stringify(feesToPrint)}`,
    );
  };

  public getPercentageFees = (pairId: string): PercentageFees => {
    const percentage = this.percentageFees.get(pairId)!;
    const percentageSwapIn =
      this.percentageSwapInFees.get(pairId) || percentage;

    return {
      percentage: percentage * 100,
      percentageSwapIn: percentageSwapIn * 100,
    };
  };

  public getPercentageFee = (pair: string, isReverse: boolean): number => {
    if (!isReverse && this.percentageSwapInFees.has(pair)) {
      return this.percentageSwapInFees.get(pair)!;
    }

    return this.percentageFees.get(pair) || 0;
  };

  public getFees = (
    pair: string,
    rate: number,
    orderSide: OrderSide,
    amount: number,
    type: BaseFeeType,
  ): {
    baseFee: number;
    percentageFee: number;
  } => {
    const isReverse = type !== BaseFeeType.NormalClaim;

    let percentageFee = this.getPercentageFee(pair, isReverse);

    if (percentageFee !== 0) {
      percentageFee = percentageFee * amount * rate;
    }

    const { base, quote } = splitPairId(pair);
    const chainCurrency = getChainCurrency(base, quote, orderSide, isReverse);

    return {
      percentageFee: Math.ceil(percentageFee),
      baseFee: this.getBaseFee(chainCurrency, type),
    };
  };

  public getBaseFee = (chainCurrency: string, type: BaseFeeType): number => {
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

    return baseFee;
  };

  public updateMinerFees = async (chainCurrency: string): Promise<void> => {
    const feeMap = await this.getFeeEstimation(chainCurrency);

    // TODO: avoid hard coding symbols
    switch (chainCurrency) {
      case 'BTC':
      case 'LTC':
      case ElementsClient.symbol: {
        const relativeFee = feeMap.get(chainCurrency)!;

        const sizes =
          chainCurrency === ElementsClient.symbol
            ? FeeProvider.transactionSizesLiquid
            : FeeProvider.transactionSizes;

        this.minerFees.set(chainCurrency, {
          normal: Math.ceil(relativeFee * sizes.normalClaim),
          reverse: {
            claim: Math.ceil(relativeFee * sizes.reverseClaim),
            lockup: Math.ceil(relativeFee * sizes.reverseLockup),
          },
        });

        break;
      }

      case Ethereum.symbol:
      case Rsk.symbol: {
        const relativeFee = feeMap.get(chainCurrency)!;
        const claimCost = FeeProvider.calculateEtherGasCost(
          relativeFee,
          FeeProvider.gasUsage.EtherSwap.claim,
        );

        this.minerFees.set(chainCurrency, {
          normal: claimCost,
          reverse: {
            claim: claimCost,
            lockup: FeeProvider.calculateEtherGasCost(
              relativeFee,
              FeeProvider.gasUsage.EtherSwap.lockup,
            ),
          },
        });

        break;
      }

      // If it is not BTC, LTC or ETH, it is an ERC20 token
      default: {
        const networkSymbol = this.walletManager.ethereumManagers.find(
          (manager) => manager.hasSymbol(chainCurrency),
        )!.networkDetails.symbol;
        const relativeFee = feeMap.get(networkSymbol)!;
        const rate = this.dataAggregator.latestRates.get(
          getPairId({ base: networkSymbol, quote: chainCurrency }),
        )!;

        const claimCost = FeeProvider.calculateTokenGasCosts(
          rate,
          relativeFee,
          FeeProvider.gasUsage.ERC20Swap.claim,
        );

        this.minerFees.set(chainCurrency, {
          normal: claimCost,
          reverse: {
            claim: claimCost,
            lockup: FeeProvider.calculateTokenGasCosts(
              rate,
              relativeFee,
              FeeProvider.gasUsage.ERC20Swap.lockup,
            ),
          },
        });
        break;
      }
    }
  };

  private static calculateTokenGasCosts = (
    rate: number,
    gasPrice: number,
    gasUsage: number,
  ) => {
    return Math.ceil(
      rate * FeeProvider.calculateEtherGasCost(gasPrice, gasUsage),
    );
  };

  private static calculateEtherGasCost = (
    gasPrice: number,
    gasUsage: number,
  ) => {
    return Number(
      (BigInt(Math.round(gasPrice * Number(gweiDecimals))) * BigInt(gasUsage)) /
        etherDecimals,
    );
  };
}

export default FeeProvider;
export { ReverseMinerFees, MinerFees, PercentageFees };
