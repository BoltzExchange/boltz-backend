import type { Response } from 'express';
import express from 'express';
import { Gauge, Registry, collectDefaultMetrics } from 'prom-client';
import type Logger from './Logger';
import { getPairId } from './Utils';
import type Api from './api/Api';
import ElementsClient from './chain/ElementsClient';
import ElementsWrapper from './chain/ElementsWrapper';
import ZeroConfTool from './chain/elements/ZeroConfTool';
import { SwapType as ST, SwapVersion } from './consts/Enums';
import type { PairConfig } from './consts/Types';
import ReferralRepository from './db/repositories/ReferralRepository';
import StatsRepository, { SwapType } from './db/repositories/StatsRepository';
import type {
  SubmarinePairTypeTaproot,
  SwapTypes,
} from './rates/providers/RateProviderTaproot';
import type Service from './service/Service';

type PrometheusConfig = {
  host?: string;
  port?: number;
};

class Prometheus {
  private static readonly metricPrefix = 'boltz_';
  private static readonly defaultReferral = 'default';

  private readonly pairs = new Set<string>();

  private readonly nodeRegistry?: Registry;
  private readonly swapRegistry?: Registry;

  constructor(
    private readonly logger: Logger,
    private readonly service: Service,
    private readonly api: Api,
    private readonly config: PrometheusConfig | undefined,
    pairs: PairConfig[],
  ) {
    pairs.forEach((pair) => this.pairs.add(getPairId(pair)));

    if (
      this.config === undefined ||
      Object.values(this.config).some((value) => value === undefined)
    ) {
      this.logger.warn(
        'Disabling metrics server because of missing configuration',
      );
      return;
    }

    this.nodeRegistry = new Registry();
    this.swapRegistry = new Registry();
    this.registerMetrics();
  }

  public start = async (): Promise<void> => {
    if (
      [this.nodeRegistry, this.swapRegistry].some(
        (registry) => registry === undefined,
      )
    ) {
      return;
    }

    const respondMetrics = (registry: Registry) => {
      return async (_: unknown, res: Response) => {
        res.setHeader('Content-Type', registry.contentType);
        res.send(await registry.metrics());
      };
    };

    const app = express();

    app.route('/metrics').get(respondMetrics(this.nodeRegistry!));
    app.route('/swapMetrics').get(respondMetrics(this.swapRegistry!));

    new Promise<void>((resolve) => {
      app.listen(this.config!.port!, this.config!.host!, () => {
        this.logger.info(
          `Metrics server listening on: ${this.config!.host}:${
            this.config!.port
          }`,
        );
        resolve();
      });
    });
  };

  private registerMetrics = () => {
    collectDefaultMetrics({
      register: this.nodeRegistry,
    });

    const defaults = Array.from(this.pairs.values()).flatMap((pair) =>
      Object.values(SwapType).map((type) => ({
        pair,
        type,
      })),
    );

    // Needed because "this" in the collector refers to the function
    const api = this.api;
    const service = this.service;

    const iterateAllPairs = async <T = SwapTypes>(
      cb: (pair: T, pairId: string, type: SwapType, referral: string) => void,
      limitToType?: SwapType,
    ) => {
      const referrals = await ReferralRepository.getReferrals();
      const provider = service.rateProvider.providers[SwapVersion.Taproot];

      // Include "null" for the defaults
      for (const referral of [null, ...referrals]) {
        for (const [type, pairsForType] of [
          [SwapType.Swap, provider.getSubmarinePairs(referral)],
          [SwapType.Reverse, provider.getReversePairs(referral)],
          [SwapType.Chain, provider.getChainPairs(referral)],
        ] as [SwapType, Map<string, Map<string, SwapTypes>>][]) {
          if (limitToType !== undefined && type !== limitToType) {
            continue;
          }

          for (const [from, pairs] of pairsForType.entries()) {
            for (const [to, pair] of pairs.entries()) {
              const pairId = getPairId({ base: from, quote: to });
              cb(
                pair as T,
                pairId,
                type,
                referral?.id || Prometheus.defaultReferral,
              );
            }
          }
        }
      }
    };

    this.swapRegistry!.registerMetric(
      new Gauge({
        name: `${Prometheus.metricPrefix}pair_limits`,
        labelNames: ['pair', 'type', 'extrema', 'referral'],
        help: 'pair limits',
        collect: async function () {
          await iterateAllPairs((pair, pairId, type, referral) => {
            this.set(
              {
                type,
                referral,
                pair: pairId,
                extrema: 'minimal',
              },
              pair.limits.minimal,
            );

            this.set(
              {
                type,
                referral,
                pair: pairId,
                extrema: 'maximal',
              },
              pair.limits.maximal,
            );
          });
        },
      }),
    );

    this.swapRegistry!.registerMetric(
      new Gauge({
        name: `${Prometheus.metricPrefix}pair_fees`,
        labelNames: ['pair', 'type', 'referral'],
        help: 'pair fees',
        collect: async function () {
          await iterateAllPairs((pair, pairId, type, referral) => {
            this.set(
              {
                type,
                referral,
                pair: pairId,
              },
              pair.fees.percentage,
            );
          });
        },
      }),
    );

    this.swapRegistry!.registerMetric(
      new Gauge({
        name: `${Prometheus.metricPrefix}pair_max_routing_fee`,
        labelNames: ['pair', 'referral'],
        help: 'pair max routing fee',
        collect: async function () {
          await iterateAllPairs<SubmarinePairTypeTaproot>(
            (pair, pairId, _, referral) => {
              this.set(
                {
                  pair: pairId,
                  referral,
                },
                pair.fees.maximalRoutingFee || 0,
              );
            },
            SwapType.Swap,
          );
        },
      }),
    );

    const setDefaults = (gauge: Gauge, defaultValue: number) => {
      defaults.forEach((defaultLabels) => {
        gauge.set(defaultLabels, defaultValue);
      });
    };

    const setDefaultSymbols = (gauge: Gauge, defaultValue: number) => {
      service.currencies.forEach((currency) => {
        gauge.set({ symbol: currency.symbol }, defaultValue);
      });
    };

    this.swapRegistry!.registerMetric(
      new Gauge({
        name: `${Prometheus.metricPrefix}swap_counts`,
        labelNames: ['pair', 'type', 'status'],
        help: 'number of swaps',
        collect: async function () {
          const counts = await StatsRepository.getSwapCounts();

          counts.forEach((count) =>
            this.set(
              { pair: count.pair, type: count.type, status: count.status },
              count.count,
            ),
          );
        },
      }),
    );

    this.swapRegistry!.registerMetric(
      new Gauge({
        name: `${Prometheus.metricPrefix}swap_volume`,
        labelNames: ['pair', 'type'],
        help: 'volume of swaps',
        collect: async function () {
          const volumes = await StatsRepository.getVolumePerPairType();

          volumes.forEach((volume) =>
            this.set({ pair: volume.pair, type: volume.type }, volume.volume),
          );
        },
      }),
    );

    this.swapRegistry!.registerMetric(
      new Gauge({
        name: `${Prometheus.metricPrefix}swap_pending_counts`,
        labelNames: ['pair', 'type'],
        help: 'count of pending swaps',
        collect: async function () {
          const counts = await StatsRepository.getPendingSwapsCounts();

          setDefaults(this, 0);
          counts.forEach((count) =>
            this.set({ pair: count.pair, type: count.type }, count.count),
          );
        },
      }),
    );

    this.swapRegistry!.registerMetric(
      new Gauge({
        name: `${Prometheus.metricPrefix}swap_locked_funds`,
        labelNames: ['pair', 'type'],
        help: 'coins locked in pending swaps',
        collect: async function () {
          const lockedFunds = await StatsRepository.getLockedFunds();

          setDefaults(this, 0);
          lockedFunds.forEach((locked) =>
            this.set({ pair: locked.pair, type: locked.type }, locked.locked),
          );
        },
      }),
    );

    this.swapRegistry!.registerMetric(
      new Gauge({
        name: `${Prometheus.metricPrefix}swap_status_cache_count`,
        help: 'number of swap status messages cached',
        collect: async function () {
          this.set({}, await api.swapInfos.cache.size());
        },
      }),
    );

    this.swapRegistry!.registerMetric(
      new Gauge({
        name: `${Prometheus.metricPrefix}cln_amount_threshold`,
        labelNames: ['type'],
        help: 'CLN amount threshold for node switch',
        collect: function () {
          this.set(
            { type: 'swap' },
            service.nodeSwitch.clnAmountThreshold[ST.Submarine],
          );
          this.set(
            { type: 'reverse' },
            service.nodeSwitch.clnAmountThreshold[ST.ReverseSubmarine],
          );
        },
      }),
    );

    this.swapRegistry!.registerMetric(
      new Gauge({
        name: `${Prometheus.metricPrefix}pending_sweep_count`,
        labelNames: ['symbol'],
        help: 'number of pending sweeps',
        collect: function () {
          setDefaultSymbols(this, 0);

          const pendingSweeps = service.getPendingSweeps();
          for (const [symbol, swaps] of pendingSweeps.entries()) {
            this.set({ symbol }, swaps.length);
          }
        },
      }),
    );

    this.swapRegistry!.registerMetric(
      new Gauge({
        name: `${Prometheus.metricPrefix}pending_sweep_amount`,
        labelNames: ['symbol'],
        help: 'amount in pending sweeps',
        collect: function () {
          setDefaultSymbols(this, 0);

          const pendingSweeps = service.getPendingSweeps();
          for (const [symbol, swaps] of pendingSweeps.entries()) {
            this.set(
              { symbol },
              Number(
                swaps.reduce(
                  (acc, swap) => acc + BigInt(swap.onchainAmount),
                  0n,
                ),
              ),
            );
          }
        },
      }),
    );

    this.swapRegistry!.registerMetric(
      new Gauge({
        name: `${Prometheus.metricPrefix}zeroconf_risk`,
        labelNames: ['symbol'],
        help: '0-conf risk of a symbol',
        collect: function () {
          for (const {
            symbol,
            risk,
          } of service.lockupTransactionTracker.risks()) {
            this.set({ symbol }, Number(risk));
          }
        },
      }),
    );

    this.swapRegistry!.registerMetric(
      new Gauge({
        name: `${Prometheus.metricPrefix}zeroconf_risk_max`,
        labelNames: ['symbol'],
        help: 'max 0-conf risk of a symbol',
        collect: function () {
          for (const {
            symbol,
            maxRisk,
          } of service.lockupTransactionTracker.maxRisks()) {
            this.set({ symbol }, Number(maxRisk));
          }
        },
      }),
    );

    this.registerZeroConfToolMetrics();
  };

  private registerZeroConfToolMetrics = () => {
    const currency = this.service.currencies.get(ElementsClient.symbol);
    if (currency === undefined) {
      return;
    }

    if (!(currency.chainClient instanceof ElementsWrapper)) {
      return;
    }

    const zeroConfCheck = (currency.chainClient as ElementsWrapper)
      .zeroConfCheck;
    if (!(zeroConfCheck instanceof ZeroConfTool)) {
      return;
    }

    this.swapRegistry!.registerMetric(
      new Gauge({
        name: `${Prometheus.metricPrefix}zeroconf_tool_txs`,
        labelNames: ['symbol', 'type'],
        help: 'transactions checked by the 0-conf tool',
        collect: function () {
          const stats = zeroConfCheck.stats;

          this.set(
            { symbol: ElementsClient.symbol, type: 'pending' },
            Number(stats.pending),
          );
          this.set(
            { symbol: ElementsClient.symbol, type: 'accepted' },
            Number(stats.accepted),
          );
          this.set(
            { symbol: ElementsClient.symbol, type: 'rejected' },
            Number(stats.rejected),
          );
        },
      }),
    );

    this.swapRegistry!.registerMetric(
      new Gauge({
        name: `${Prometheus.metricPrefix}zeroconf_tool_txs_calls`,
        labelNames: ['symbol', 'type'],
        help: 'calls to the 0-conf tool',
        collect: function () {
          this.set(
            { symbol: ElementsClient.symbol, type: 'accepted' },
            Number(zeroConfCheck.stats.acceptedCalls),
          );
        },
      }),
    );
  };
}

export default Prometheus;
export { PrometheusConfig };
