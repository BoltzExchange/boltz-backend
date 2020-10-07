import http from 'http';
import { existsSync, readFileSync } from 'fs';
import Errors from './Errors';
import { ChainConfig } from '../Config';

class RpcClient {
  private readonly auth: string;
  private readonly options = {};

  constructor(config: ChainConfig) {
    if (config.cookie === '' || !existsSync(config.cookie)) {
      throw Errors.INVALID_COOKIE_FILE(config.cookie);
    }

    const cookieFile = readFileSync(config.cookie, 'utf-8');
    this.auth = Buffer.from(cookieFile).toString('base64');

    this.options = {
      host: config.host,
      port: config.port,
      path: '/',
      method: 'POST',
    };
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
          }

          if (response.statusCode === 403) {
            reject('403 forbidden');
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
  }
}

export default RpcClient;
