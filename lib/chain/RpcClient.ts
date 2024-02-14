import { existsSync, readFileSync } from 'fs';
import http from 'http';
import { ChainConfig } from '../Config';
import Errors from './Errors';

class RpcClient {
  private readonly auth: string;
  private readonly options = {};

  constructor(config: ChainConfig) {
    this.options = {
      host: config.host,
      port: config.port,
      path: '/',
      method: 'POST',
    };

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

  public request = <T>(method: string, params?: any[]): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const serializedRequest = JSON.stringify({
        method,
        params,
      });

      const request = http.request(this.options, (response) => {
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
      });

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
