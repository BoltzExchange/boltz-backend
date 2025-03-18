import { trace } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { GrpcInstrumentation } from '@opentelemetry/instrumentation-grpc';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { WinstonInstrumentation } from '@opentelemetry/instrumentation-winston';
import { CompressionAlgorithm } from '@opentelemetry/otlp-exporter-base';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import process from 'process';
import packageJson from '../package.json';

const instrumentations = [
  new HttpInstrumentation(),
  new ExpressInstrumentation(),
  new GrpcInstrumentation(),
  new PgInstrumentation(),
  new WinstonInstrumentation(),
];

class Tracing {
  public tracer = trace.getTracer(packageJson.name);

  private sdk?: NodeSDK;

  public init = (endpoint: string, network: string) => {
    this.sdk = new NodeSDK({
      instrumentations,
      resource: resourceFromAttributes({
        ['process.pid']: process.pid,
        ['service.version']: packageJson.version,
        ['service.name']: `${packageJson.name}-${network}`,
      }),
      traceExporter: new OTLPTraceExporter({
        url: endpoint,
        concurrencyLimit: 2_000,
        compression: CompressionAlgorithm.GZIP,
      }),
    });

    this.sdk.start();
  };

  public stop = async () => {
    await this.sdk?.shutdown();
  };
}

export default new Tracing();
