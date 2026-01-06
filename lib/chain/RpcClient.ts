import { SpanKind, SpanStatusCode, context, trace } from '@opentelemetry/api';
import { existsSync, readFileSync } from 'fs';
import http from 'http';
import type { ChainConfig } from '../Config';
import type Logger from '../Logger';
import Tracing from '../Tracing';
import { formatError } from '../Utils';
import Errors from './Errors';

class RpcClient {
  private readonly auth: string;
  private readonly options = {};
  private readonly walletOptions = {};

  constructor(
    logger: Logger,
    private readonly symbol: string,
    config: ChainConfig,
  ) {
    this.options = {
      host: config.host,
      port: config.port,
      path: '/',
      method: 'POST',
    };
    this.walletOptions = {
      ...this.options,
      path: config.wallet ? `/wallet/${config.wallet}` : '/',
    };

    if (config.wallet) {
      logger.info(`Using wallet "${config.wallet}" for ${this.symbol} RPC`);
    }

    // If a cookie is configured, it will be preferred
    if (config.cookie && config.cookie !== '') {
      if (!existsSync(config.cookie)) {
        throw Errors.INVALID_COOKIE_FILE(config.cookie);
      }

      const cookieFile = readFileSync(config.cookie, 'utf-8').trim();
      this.auth = Buffer.from(cookieFile).toString('base64');
    } else if (config.user && config.password) {
      this.auth = Buffer.from(`${config.user}:${config.password}`).toString(
        'base64',
      );
    } else {
      throw Errors.NO_AUTHENTICATION();
    }
  }

  public request = async <T>(
    method: string,
    params?: any[],
    walletRelated: boolean = false,
  ): Promise<T> => {
    const span = Tracing.tracer.startSpan(`${this.symbol} RPC ${method}`, {
      kind: SpanKind.CLIENT,
      attributes: {
        'rpc.method': method,
        params: params?.map((p) => (p ? p.toString() : 'undefined')),
        walletRelated,
      },
    });
    const ctx = trace.setSpan(context.active(), span);

    try {
      return await context.with(
        ctx,
        this.sendRequest<T>,
        this,
        method,
        walletRelated,
        params,
      );
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: formatError(error),
      });
      throw error;
    } finally {
      span.end();
    }
  };

  private sendRequest = <T>(
    method: string,
    walletRelated: boolean,
    params?: any[],
  ): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const serializedRequest = JSON.stringify({
        method,
        params,
      });

      const request = http.request(
        walletRelated ? this.walletOptions : this.options,
        (response) => {
          let buffer = '';

          response.on('data', (chunk) => {
            buffer += chunk.toString();
          });

          response.on('end', () => {
            if (response.statusCode === 401) {
              reject('401 unauthorized');
              return;
            }

            if (response.statusCode === 403) {
              reject('403 forbidden');
              return;
            }

            const parsedResponse = JSON.parse(buffer);

            if (parsedResponse.error) {
              reject(parsedResponse.error);
            }

            resolve(parsedResponse.result);
          });
        },
      );

      request.on('error', (error) => {
        reject(error);
      });

      request.setHeader('Content-Length', serializedRequest.length);
      request.setHeader('Authorization', `Basic ${this.auth}`);

      request.write(serializedRequest);
      request.end();
    });
  };
}

export default RpcClient;
