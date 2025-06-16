import type { ConfigType } from '../Config';
import type Logger from '../Logger';
import {
  formatError,
  getChainCurrency,
  getHexString,
  getLightningCurrency,
  getPairId,
  splitPairId,
  stringify,
} from '../Utils';
import ElementsClient from '../chain/ElementsClient';
import {
  OrderSide,
  SwapType,
  SwapVersion,
  swapTypeToPrettyString,
} from '../consts/Enums';
import type { PairConfig } from '../consts/Types';
import type Swap from '../db/models/Swap';
import ReverseSwapRepository from '../db/repositories/ReverseSwapRepository';
import { msatToSat } from '../lightning/ChannelUtils';
import type { LightningClient } from '../lightning/LightningClient';
import { InvoiceFeature } from '../lightning/LightningClient';
import LndClient from '../lightning/LndClient';
import type DecodedInvoice from '../sidecar/DecodedInvoice';
import { InvoiceType } from '../sidecar/DecodedInvoice';
import type Sidecar from '../sidecar/Sidecar';
import type NodeSwitch from '../swap/NodeSwitch';
import type { Currency } from '../wallet/WalletManager';
import type EthereumManager from '../wallet/ethereum/EthereumManager';
import { Ethereum, Rsk } from '../wallet/ethereum/EvmNetworks';
import Errors from './Errors';
import RoutingOffsets from './RoutingOffsets';

type PairTimeoutBlocksDelta = {
  chain: number;
  reverse: number;

  swapMinimal: number;
  swapMaximal: number;

  swapTaproot: number;
};

type PairTimeoutBlockDeltas = {
  base: PairTimeoutBlocksDelta;
  quote: PairTimeoutBlocksDelta;
};

class TimeoutDeltaProvider {
  public static readonly noRoutes = -1;

  // A map of the symbols of currencies and their block times in minutes
  public static blockTimes = new Map<string, number>([
    ['BTC', 10],
    ['LTC', 2.5],
    [Rsk.symbol, 0.5],
    [Ethereum.symbol, 0.2],
    [ElementsClient.symbol, 1],
  ]);

  public timeoutDeltas = new Map<string, PairTimeoutBlockDeltas>();

  private routingOffsets: RoutingOffsets;

  constructor(
    private readonly logger: Logger,
    config: ConfigType,
    private readonly sidecar: Sidecar,
    private readonly currencies: Map<string, Currency>,
    private readonly nodeSwitch: NodeSwitch,
  ) {
    this.routingOffsets = new RoutingOffsets(this.logger, config);
  }

  public static convertBlocks = (
    fromSymbol: string,
    toSymbol: string,
    blocks: number,
  ): number => {
    const minutes = blocks * TimeoutDeltaProvider.blockTimes.get(fromSymbol)!;

    // In the context this function is used, we calculate the timeout of the first leg of a
    // reverse swap which has to be longer than the second one
    return Math.ceil(minutes / TimeoutDeltaProvider.blockTimes.get(toSymbol)!);
  };

  public init = (
    pairs: PairConfig[],
    ethereumManagers: EthereumManager[],
  ): void => {
    // Set the block time of the chain for its tokens
    ethereumManagers.forEach((manager) => {
      const blockTime = TimeoutDeltaProvider.blockTimes.get(
        manager.networkDetails.symbol,
      )!;

      for (const token of manager.tokenAddresses.keys()) {
        TimeoutDeltaProvider.blockTimes.set(token, blockTime);
      }
    });

    for (const pair of pairs) {
      const pairId = getPairId(pair);

      if (pair.timeoutDelta !== undefined) {
        // Compatibility mode with legacy config
        if (typeof pair.timeoutDelta === 'number') {
          pair.timeoutDelta = {
            chain: pair.timeoutDelta,
            reverse: pair.timeoutDelta,
            swapMaximal: pair.timeoutDelta,
            swapMinimal: pair.timeoutDelta,
            swapTaproot: pair.timeoutDelta,
          };
        }

        if (pair.timeoutDelta.chain === undefined) {
          this.logger.warn(
            `${swapTypeToPrettyString(SwapType.Chain)} Swap timeout delta not set for ${pairId}; falling back to ${swapTypeToPrettyString(SwapType.ReverseSubmarine)} Swap`,
          );
          pair.timeoutDelta.chain = pair.timeoutDelta.reverse;
        }

        this.logger.debug(
          `Setting timeout block delta of ${pairId} to minutes: ${stringify(
            pair.timeoutDelta,
          )}`,
        );
        this.timeoutDeltas.set(
          pairId,
          this.minutesToBlocks(pairId, pair.timeoutDelta),
        );
      } else {
        throw Errors.NO_TIMEOUT_DELTA(pairId);
      }
    }
  };

  public getCltvLimit = async (swap: Swap): Promise<number> => {
    const { base, quote } = splitPairId(swap.pair);
    const chainCurrency = this.currencies.get(
      getChainCurrency(base, quote, swap.orderSide, false),
    )!;

    const currentBlock = chainCurrency.chainClient
      ? (await chainCurrency.chainClient.getBlockchainInfo()).blocks
      : await chainCurrency.provider!.getBlockNumber();

    const blocksLeft = TimeoutDeltaProvider.convertBlocks(
      chainCurrency.symbol,
      getLightningCurrency(base, quote, swap.orderSide, false),
      swap.timeoutBlockHeight - currentBlock,
    );

    return Math.floor(blocksLeft - 20);
  };

  public getTimeout = async (
    pairId: string,
    orderSide: OrderSide,
    type: SwapType,
    version: SwapVersion,
    invoice?: string,
    referralId?: string,
  ): Promise<[number, boolean]> => {
    const timeouts = this.timeoutDeltas.get(pairId);

    if (!timeouts) {
      throw Errors.PAIR_NOT_FOUND(pairId);
    }

    if (type !== SwapType.Submarine) {
      const deltas =
        orderSide === OrderSide.BUY ? timeouts.base : timeouts.quote;

      return [
        type === SwapType.ReverseSubmarine ? deltas.reverse : deltas.chain,
        false,
      ];
    } else {
      const { base, quote } = splitPairId(pairId);
      const chain = getChainCurrency(base, quote, orderSide, false);
      const lightning = getLightningCurrency(base, quote, orderSide, false);

      const chainDeltas =
        orderSide === OrderSide.BUY ? timeouts.quote : timeouts.base;
      const lightningDeltas =
        orderSide === OrderSide.BUY ? timeouts.base : timeouts.quote;

      return invoice
        ? await this.getTimeoutInvoice(
            pairId,
            chain,
            lightning,
            chainDeltas,
            lightningDeltas,
            version,
            invoice,
            referralId,
          )
        : [
            version === SwapVersion.Taproot
              ? chainDeltas.swapTaproot
              : chainDeltas.swapMinimal,
            true,
          ];
    }
  };

  public checkRoutability = async (
    lightningClient: LightningClient,
    decodedInvoice: DecodedInvoice,
    cltvLimit: number,
  ) => {
    try {
      if (decodedInvoice.paymentHash !== undefined) {
        const reverseSwap = await ReverseSwapRepository.getReverseSwap({
          preimageHash: getHexString(decodedInvoice.paymentHash),
        });

        if (reverseSwap !== null && reverseSwap !== undefined) {
          const reverseDecoded = await this.sidecar.decodeInvoiceOrOffer(
            reverseSwap.invoice,
          );

          return Math.max(reverseDecoded.minFinalCltv, 144);
        }
      }

      if (decodedInvoice.type === InvoiceType.Bolt12Invoice) {
        return Math.max(decodedInvoice.minFinalCltv, 144);
      }

      // Check whether the receiving side supports MPP and if so,
      // query a route for the number of sats of the invoice divided
      // by the max payment parts we tell to LND to use
      const supportsMpp = decodedInvoice.features.has(InvoiceFeature.MPP);

      const amountSat = msatToSat(decodedInvoice.amountMsat);
      const amountToQuery = Math.max(
        supportsMpp
          ? Math.ceil(amountSat / LndClient.paymentMaxParts)
          : amountSat,
        1,
      );

      const routes = await lightningClient.queryRoutes(
        getHexString(decodedInvoice.payee!),
        amountToQuery,
        cltvLimit,
        decodedInvoice.minFinalCltv,
        decodedInvoice.routingHints,
      );

      return routes.reduce(
        (highest, r) => (highest > r.ctlv ? highest : r.ctlv),
        TimeoutDeltaProvider.noRoutes,
      );
    } catch (error) {
      this.logger.debug(`Could not query routes: ${formatError(error)}`);
      return TimeoutDeltaProvider.noRoutes;
    }
  };

  private getTimeoutInvoice = async (
    pair: string,
    chainCurrency: string,
    lightningCurrency: string,
    chainTimeout: PairTimeoutBlocksDelta,
    lightningTimeout: PairTimeoutBlocksDelta,
    version: SwapVersion,
    invoice: string,
    referralId?: string,
  ): Promise<[number, boolean]> => {
    const currency = this.currencies.get(lightningCurrency)!;

    const decodedInvoice = await this.sidecar.decodeInvoiceOrOffer(invoice);
    const amountSat = msatToSat(decodedInvoice.amountMsat);

    const lightningClient = await this.nodeSwitch.getSwapNode(
      currency,
      decodedInvoice,
      {
        referral: referralId,
      },
    );

    const lightningCltv =
      version === SwapVersion.Taproot
        ? lightningTimeout.swapTaproot
        : lightningTimeout.swapMaximal;

    const [routeTimeLock, chainInfo] = await Promise.all([
      this.checkRoutability(lightningClient, decodedInvoice, lightningCltv),
      currency.chainClient!.getBlockchainInfo(),
    ]);

    if (routeTimeLock === TimeoutDeltaProvider.noRoutes) {
      return [chainTimeout.swapMaximal, false];
    }

    const routeDeltaRelative =
      lightningClient instanceof LndClient
        ? routeTimeLock - chainInfo.blocks
        : routeTimeLock;
    this.logger.debug(
      `CLTV needed to route: ${routeDeltaRelative} ${lightningCurrency} blocks`,
    );

    if (version === SwapVersion.Taproot) {
      return [
        Math.ceil(
          (lightningCltv *
            TimeoutDeltaProvider.blockTimes.get(lightningCurrency)!) /
            TimeoutDeltaProvider.blockTimes.get(chainCurrency)!,
        ),
        true,
      ];
    }

    // Add some buffer to make sure we have enough limit when the transaction confirms
    const routeDeltaMinutes = Math.ceil(
      routeDeltaRelative *
        TimeoutDeltaProvider.blockTimes.get(lightningCurrency)!,
    );

    const routingOffset = this.routingOffsets.getOffset(
      pair,
      amountSat,
      lightningCurrency,
      [getHexString(decodedInvoice.payee!)].concat(
        decodedInvoice.routingHints.map((hints) => hints[0].nodeId),
      ),
    );
    const finalExpiry = routeDeltaMinutes + routingOffset;

    const minTimeout = Math.ceil(
      finalExpiry / TimeoutDeltaProvider.blockTimes.get(chainCurrency)!,
    );

    if (minTimeout > chainTimeout.swapMaximal) {
      throw Errors.MIN_EXPIRY_TOO_BIG(
        Math.ceil(
          chainTimeout.swapMaximal *
            TimeoutDeltaProvider.blockTimes.get(chainCurrency)!,
        ),
        routeDeltaMinutes,
        routingOffset,
      );
    }

    const cltv = Math.max(chainTimeout.swapMinimal, minTimeout);
    this.logger.debug(`Using timeout of: ${cltv} ${chainCurrency} blocks`);
    return [cltv, true];
  };

  private minutesToBlocks = (
    pair: string,
    newDeltas: PairTimeoutBlocksDelta,
  ) => {
    const calculateBlocks = (symbol: string, minutes: number) => {
      const minutesPerBlock = TimeoutDeltaProvider.blockTimes.get(symbol)!;
      const blocks = minutes / minutesPerBlock;

      // Sanity checks to make sure no impossible deltas are set
      if (blocks % 1 !== 0 || blocks < 1) {
        throw Errors.INVALID_TIMEOUT_BLOCK_DELTA();
      }

      return blocks;
    };

    const convertToBlocks = (symbol: string): PairTimeoutBlocksDelta => {
      return {
        chain: calculateBlocks(symbol, newDeltas.chain),
        reverse: calculateBlocks(symbol, newDeltas.reverse),
        swapMinimal: calculateBlocks(symbol, newDeltas.swapMinimal),
        swapMaximal: calculateBlocks(symbol, newDeltas.swapMaximal),
        swapTaproot: calculateBlocks(symbol, newDeltas.swapTaproot),
      };
    };

    const { base, quote } = splitPairId(pair);

    return {
      base: convertToBlocks(base),
      quote: convertToBlocks(quote),
    };
  };
}

export default TimeoutDeltaProvider;
export { PairTimeoutBlocksDelta };
