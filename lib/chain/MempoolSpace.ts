import axios, { AxiosResponse } from 'axios';
import Logger from '../Logger';
import { formatError, stringify } from '../Utils';

type RecommendedFees = {
  fastestFee?: number;
  halfHourFee?: number;
  hourFee?: number;
  minimumFee?: number;
};

class MempoolSpaceClient {
  private static readonly factor = 1.1;
  private static readonly fetchInterval = 2.5 * 60 * 1000;

  // Undefined in case the latest request failed
  public latestFee?: number;

  private fetchInterval?: any;

  constructor(
    private logger: Logger,
    private symbol: string,
    private apiUrl: string,
  ) {}

  public init = async (): Promise<void> => {
    await this.fetchRecommendedFees();

    this.fetchInterval = setInterval(async () => {
      await this.fetchRecommendedFees();
    }, MempoolSpaceClient.fetchInterval);
  };

  public stop = (): void => {
    if (this.fetchInterval) {
      clearInterval(this.fetchInterval);
      this.fetchInterval = undefined;
    }

    this.latestFee = undefined;
  };

  private fetchRecommendedFees = async () => {
    try {
      const response = await axios.get<any, AxiosResponse<RecommendedFees>>(
        `${this.apiUrl}/v1/fees/recommended`,
      );

      if (typeof response.data.fastestFee !== 'number') {
        this.handleCouldNotFetch('invalid response');
        return;
      }

      this.logger.silly(
        `Fetched latest ${
          this.symbol
        } MempoolSpace fee estimations: ${stringify(response.data)}`,
      );

      this.latestFee = Math.ceil(
        response.data.fastestFee * MempoolSpaceClient.factor,
      );
    } catch (error) {
      this.handleCouldNotFetch(error);
    }
  };

  private handleCouldNotFetch = (error: any) => {
    this.latestFee = undefined;
    this.logger.warn(
      `Could not fetch ${this.symbol} MempoolSpace fee estimations from ${
        this.apiUrl
      }: ${formatError(error)}`,
    );
  };
}

class MempoolSpace {
  private apis: MempoolSpaceClient[] = [];

  constructor(
    private logger: Logger,
    private symbol: string,
    apiUrls: string,
  ) {
    const apis = apiUrls.split(',').map((apiUrl) => apiUrl.trim());
    this.logger.info(
      `Enabling MempoolSpace fee estimations for ${this.symbol}: ${stringify(
        apis,
      )}`,
    );

    apis.forEach((api) =>
      this.apis.push(new MempoolSpaceClient(this.logger, this.symbol, api)),
    );
  }

  public init = async (): Promise<void> => {
    await Promise.all(this.apis.map((api) => api.init()));
  };

  public latestFee = (): number | undefined => {
    const fees = this.apis
      .map((c) => c.latestFee)
      .filter((val): val is number => val !== undefined);

    if (fees.length === 0) {
      this.logger.warn(`All ${this.symbol} MempoolSpace endpoints failed`);
      return undefined;
    }

    return Math.max(...fees);
  };

  public stop = () => {
    this.apis.forEach((api) => api.stop());
  };
}

export default MempoolSpace;
export { MempoolSpaceClient };
