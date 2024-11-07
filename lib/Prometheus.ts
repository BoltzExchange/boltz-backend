import express, { Response } from 'express';
import { Gauge, Registry, collectDefaultMetrics } from 'prom-client';
import Logger from './Logger';
import { getPairId } from './Utils';
import Api from './api/Api';
import { PairConfig } from './consts/Types';
import StatsRepository, { SwapType } from './db/repositories/StatsRepository';
import Service from './service/Service';

type PrometheusConfig = {
  host?: string;
  port?: number;
};

class Prometheus {
  private static readonly gaugeUpdateInterval = 1_000;
  private static readonly metric_prefix = 'boltz_';

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

    const setDefaults = (gauge: Gauge, defaultValue: number) => {
      defaults.forEach((defaultLabels) => {
        gauge.set(defaultLabels, defaultValue);
      });
    };

    this.swapRegistry!.registerMetric(
      new Gauge({
        name: `${Prometheus.metric_prefix}swap_counts`,
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
        name: `${Prometheus.metric_prefix}swap_volume`,
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
        name: `${Prometheus.metric_prefix}swap_pending_counts`,
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
        name: `${Prometheus.metric_prefix}swap_locked_funds`,
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

    this.registerGauge(
      this.swapRegistry!,
      'swap_status_cache_count',
      'number of swap status messages cached',
      () => this.api.swapInfos.cacheSize,
    );

    const service = this.service;

    this.swapRegistry!.registerMetric(
      new Gauge({
        name: `${Prometheus.metric_prefix}zeroconf_risk`,
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
        name: `${Prometheus.metric_prefix}zeroconf_risk_max`,
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
  };

  private registerGauge = (
    registry: Registry,
    name: string,
    help: string,
    cb: () => number,
  ) => {
    const gauge = new Gauge({
      help,
      name: `${Prometheus.metric_prefix}${name}`,
    });
    setInterval(() => gauge.set(cb()), Prometheus.gaugeUpdateInterval);
    registry.registerMetric(gauge);
  };
}

export default Prometheus;
export { PrometheusConfig };
