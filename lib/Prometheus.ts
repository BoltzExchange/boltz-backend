import express, { Response } from 'express';
import { collectDefaultMetrics, Gauge, Registry } from 'prom-client';
import Logger from './Logger';
import StatsRepository from './db/repositories/StatsRepository';

type PrometheusConfig = {
  host?: string;
  port?: number;
};

class Prometheus {
  private static readonly metric_prefix = 'boltz_';

  private readonly nodeRegistry?: Registry;
  private readonly swapRegistry?: Registry;

  constructor(
    private readonly logger: Logger,
    private readonly config?: PrometheusConfig,
  ) {
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
          const counts = await StatsRepository.getVolumePerPairType();

          counts.forEach((volume) =>
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

          counts.forEach((volume) =>
            this.set({ pair: volume.pair, type: volume.type }, volume.count),
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

          lockedFunds.forEach((locked) =>
            this.set({ pair: locked.pair, type: 'reverse' }, locked.locked),
          );
        },
      }),
    );
  };
}

export default Prometheus;
export { PrometheusConfig };
