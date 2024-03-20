import Logger from '../Logger';
import {
  getChainCurrency,
  getPairId,
  getReceivingChain,
  getSendingChain,
  mapToObject,
  splitPairId,
  stringify,
} from '../Utils';
import ElementsClient from '../chain/ElementsClient';
import { etherDecimals, gweiDecimals } from '../consts/Consts';
import {
  BaseFeeType,
  CurrencyType,
  OrderSide,
  SwapType,
  SwapVersion,
  swapTypeToString,
} from '../consts/Enums';
import { PairConfig } from '../consts/Types';
import WalletManager from '../wallet/WalletManager';
import { Ethereum, Rsk } from '../wallet/ethereum/EvmNetworks';
import DataAggregator from './data/DataAggregator';

type TransactionSizesForVersion = {
  normalClaim: number;

  reverseLockup: number;
  reverseClaim: number;
};

type TransactionSizes = {
  [SwapVersion.Legacy]: TransactionSizesForVersion;
  [SwapVersion.Taproot]: TransactionSizesForVersion;
};

type PercentageFees = {
  [SwapType.Chain]: number;
  [SwapType.Submarine]: number;
  [SwapType.ReverseSubmarine]: number;
};

type ReverseMinerFees = {
  lockup: number;
  claim: number;
};

type MinerFeesForVersion = {
  normal: number;
  reverse: ReverseMinerFees;
};

type ChainSwapMinerFees = {
  server: number;
  user: ReverseMinerFees;
};

type MinerFees = {
  [SwapVersion.Legacy]: MinerFeesForVersion;
  [SwapVersion.Taproot]: MinerFeesForVersion;
};

class FeeProvider {
  public static transactionSizes: {
    [CurrencyType.BitcoinLike]: TransactionSizes;
    [CurrencyType.Liquid]: TransactionSizes;
  } = {
    [CurrencyType.BitcoinLike]: {
      [SwapVersion.Taproot]: {
        normalClaim: 151,

        reverseLockup: 154,
        reverseClaim: 111,
      },
      [SwapVersion.Legacy]: {
        // The claim transaction which spends a nested SegWit swap output and sends it to a P2WPKH address has about 170 vbytes
        normalClaim: 170,

        // We cannot know what kind of address the user will claim to, so we just assume the worst case: P2PKH
        // Claiming a P2WSH to a P2PKH address is about 138 bytes
        reverseClaim: 138,

        // The lockup transaction which spends a P2WPKH output (possibly more, but we assume a best case scenario here),
        // locks up funds in a P2WSH swap and sends the change back to a P2WKH output has about 153 vbytes
        reverseLockup: 153,
      },
    },
    [CurrencyType.Liquid]: {
      [SwapVersion.Taproot]: {
        normalClaim: 1337,
        reverseLockup: 2503,
        reverseClaim: 1297,
      },
      [SwapVersion.Legacy]: {
        normalClaim: 1333,
        reverseLockup: 2503,
        reverseClaim: 1378,
      },
    },
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

  // A map between the symbols of the pairs and their percentage fees
  public percentageFees = new Map<string, PercentageFees>();

  public minerFees = new Map<string, MinerFees>();

  constructor(
    private logger: Logger,
    private walletManager: WalletManager,
    private dataAggregator: DataAggregator,
    private getFeeEstimation: (symbol: string) => Promise<Map<string, number>>,
  ) {}

  public init = (pairs: PairConfig[]): void => {
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

      this.percentageFees.set(pairId, {
        [SwapType.ReverseSubmarine]: percentage / 100,
        [SwapType.Chain]: (pair.chainSwapFee || percentage) / 100,
        [SwapType.Submarine]: (pair.swapInFee || percentage) / 100,
      });
    });

    this.logger.debug(
      `Using fees: ${stringify(
        mapToObject(
          new Map<string, any>(
            Array.from(this.percentageFees.keys()).map((pair) => {
              const fees = this.getPercentageFees(pair);
              return [
                pair,
                {
                  [swapTypeToString(SwapType.Chain)]: fees[SwapType.Chain],
                  [swapTypeToString(SwapType.Submarine)]:
                    fees[SwapType.Submarine],
                  [swapTypeToString(SwapType.ReverseSubmarine)]:
                    fees[SwapType.ReverseSubmarine],
                },
              ];
            }),
          ),
        ),
      )}`,
    );
  };

  public getPercentageFees = (pairId: string): PercentageFees => {
    const percentages = this.percentageFees.get(pairId)!;

    return {
      [SwapType.Chain]: percentages[SwapType.Chain] * 100,
      [SwapType.Submarine]: percentages[SwapType.Submarine] * 100,
      [SwapType.ReverseSubmarine]: percentages[SwapType.ReverseSubmarine] * 100,
    };
  };

  public getPercentageFee = (pair: string, type: SwapType): number => {
    const percentages = this.percentageFees.get(pair);
    return percentages ? percentages[type] : 0;
  };

  public getFees = (
    pair: string,
    swapVersion: SwapVersion,
    rate: number,
    orderSide: OrderSide,
    amount: number,
    type: SwapType,
    feeType: BaseFeeType,
  ): {
    baseFee: number;
    percentageFee: number;
  } => {
    let percentageFee = this.getPercentageFee(pair, type);

    if (percentageFee !== 0) {
      percentageFee = percentageFee * amount * rate;
    }

    const { base, quote } = splitPairId(pair);
    const chainCurrency = getChainCurrency(
      base,
      quote,
      orderSide,
      type === SwapType.ReverseSubmarine,
    );

    return {
      percentageFee: Math.ceil(percentageFee),
      baseFee: this.getBaseFee(chainCurrency, swapVersion, feeType),
    };
  };

  public getBaseFee = (
    chainCurrency: string,
    swapVersion: SwapVersion,
    type: BaseFeeType,
  ): number => {
    const minerFees = this.minerFees.get(chainCurrency)![swapVersion];

    switch (type) {
      case BaseFeeType.NormalClaim:
        return minerFees.normal;

      case BaseFeeType.ReverseClaim:
        return minerFees.reverse.claim;

      case BaseFeeType.ReverseLockup:
        return minerFees.reverse.lockup;
    }
  };

  public getSwapBaseFees = <
    T extends number | ReverseMinerFees | ChainSwapMinerFees,
  >(
    pairId: string,
    orderSide: OrderSide,
    type: SwapType,
    version: SwapVersion,
  ): T => {
    const { base, quote } = splitPairId(pairId);

    if (type === SwapType.Chain) {
      const sendingMinerfees = this.minerFees.get(
        getSendingChain(base, quote, orderSide),
      )![SwapVersion.Taproot].reverse;
      const receivingMinerFees = this.minerFees.get(
        getReceivingChain(base, quote, orderSide),
      )![SwapVersion.Taproot].reverse;

      return {
        server: sendingMinerfees.lockup + receivingMinerFees.claim,
        user: {
          claim: sendingMinerfees.claim,
          lockup: receivingMinerFees.lockup,
        },
      } as ChainSwapMinerFees as T;
    } else {
      const isReverse = type === SwapType.ReverseSubmarine;

      const minerFeesObj = this.minerFees.get(
        getChainCurrency(base, quote, orderSide, isReverse),
      )![version];
      return (isReverse ? minerFeesObj.reverse : minerFeesObj.normal) as T;
    }
  };

  public updateMinerFees = async (chainCurrency: string): Promise<void> => {
    const feeMap = await this.getFeeEstimation(chainCurrency);

    // TODO: avoid hard coding symbols
    switch (chainCurrency) {
      case 'BTC':
      case 'LTC':
      case ElementsClient.symbol: {
        const relativeFee = feeMap.get(chainCurrency)!;

        const calculateMinerFeesForVersion = (
          sizes: TransactionSizesForVersion,
        ): MinerFeesForVersion => ({
          normal: Math.ceil(relativeFee * sizes.normalClaim),
          reverse: {
            claim: Math.ceil(relativeFee * sizes.reverseClaim),
            lockup: Math.ceil(relativeFee * sizes.reverseLockup),
          },
        });

        const sizes =
          chainCurrency === ElementsClient.symbol
            ? FeeProvider.transactionSizes[CurrencyType.Liquid]
            : FeeProvider.transactionSizes[CurrencyType.BitcoinLike];

        this.minerFees.set(chainCurrency, {
          [SwapVersion.Taproot]: calculateMinerFeesForVersion(
            sizes[SwapVersion.Taproot],
          ),
          [SwapVersion.Legacy]: calculateMinerFeesForVersion(
            sizes[SwapVersion.Legacy],
          ),
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

        const fees = {
          normal: claimCost,
          reverse: {
            claim: claimCost,
            lockup: FeeProvider.calculateEtherGasCost(
              relativeFee,
              FeeProvider.gasUsage.EtherSwap.lockup,
            ),
          },
        };

        this.minerFees.set(chainCurrency, {
          [SwapVersion.Legacy]: fees,
          [SwapVersion.Taproot]: fees,
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

        const fees = {
          normal: claimCost,
          reverse: {
            claim: claimCost,
            lockup: FeeProvider.calculateTokenGasCosts(
              rate,
              relativeFee,
              FeeProvider.gasUsage.ERC20Swap.lockup,
            ),
          },
        };

        this.minerFees.set(chainCurrency, {
          [SwapVersion.Legacy]: fees,
          [SwapVersion.Taproot]: fees,
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
export {
  MinerFees,
  PercentageFees,
  ReverseMinerFees,
  ChainSwapMinerFees,
  MinerFeesForVersion,
};
