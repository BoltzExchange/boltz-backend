import Axios from 'axios';
import WebSocket from 'ws';
import { BigNumber, providers } from 'ethers';
import Logger from '../../Logger';
import { formatError } from '../../Utils';

class GasNow {
  private static readonly gasNowApiUrl = 'https://gasnow.org/api/v3';
  private static readonly gasNowWebSocket = 'wss://www.gasnow.org/ws/gasprice';

  private static readonly webSocketTimeout = 30000;

  public static latestGasPrice = BigNumber.from(0);

  private webSocket?: WebSocket;
  private webSocketTimeout?: any;

  constructor(
    private logger: Logger,
    private network: providers.Network,
  ) {}

  public init = async (): Promise<void> => {
    // Only use GasNow on mainnet
    if (this.network.chainId === 1) {
      this.logger.info('Enabling GasNow gas price oracle');
      await this.updateGasPrice();

      this.start();
    } else {
      this.logger.info('Disabling GasNow gas price oracle because chain is not mainnet');
    }
  }

  public stop = (): Promise<void> => {
    return new Promise<void>((resolve) => {
      const closeTimeout = () => {
        if (this.webSocketTimeout) {
          clearTimeout(this.webSocketTimeout);
          this.webSocketTimeout = undefined;
        }
      };

      if (this.webSocket) {
        this.webSocket.close();
        this.webSocket.on('close', () => {
          this.webSocket!.removeAllListeners();

          this.webSocket = undefined;

          closeTimeout();
          resolve();
        });
      } else {
        closeTimeout();
        resolve();
      }
    });
  }

  private start = () => {
    this.webSocket = new WebSocket(GasNow.gasNowWebSocket);

    this.listenToWebSocket();
    this.startTimeout();
  }

  private listenToWebSocket = () => {
    this.webSocket!.on('message', (event) => {
      this.startTimeout();

      try {
        const data = JSON.parse(event as string);

        if (data.type === 'gasprice_s') {
          GasNow.latestGasPrice = BigNumber.from(data.data.fast);
          this.logger.silly(`Got updated GasNow gas price from WebSocket: ${GasNow.latestGasPrice}`);
        }
      } catch (error) {
        this.logger.warn(`Could not parse GasNow WebSocket message: ${formatError(error)}`);
      }
    });

    this.webSocket!.on('error', async (error) => {
      this.logger.error(`GasNow WebSocket errored: ${error.name}: ${error.message}`);
      await this.init();
    });
  }

  private startTimeout = () => {
    if (this.webSocketTimeout) {
      clearTimeout(this.webSocketTimeout);
    }

    this.webSocketTimeout = setTimeout(async () => {
      this.logger.warn(`Restarting GasNow WebSocket because no update was sent in the last ${GasNow.webSocketTimeout} ms`);

      await this.stop();
      this.start();
    }, GasNow.webSocketTimeout);
  }

  private updateGasPrice = async () => {
    try {
      const response = await Axios.get(`${GasNow.gasNowApiUrl}/gas/price`);
      GasNow.latestGasPrice = BigNumber.from(response.data.data.fast);

      this.logger.silly(`Got updated GasNow gas price: ${GasNow.latestGasPrice}`);
    } catch (error) {
      this.logger.warn(`Could not fetch gas price from GasNow: ${formatError(error)}`);
    }
  }
}

export default GasNow;
