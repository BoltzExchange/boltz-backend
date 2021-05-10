import Axios, { AxiosResponse } from 'axios';
import Logger from '../Logger';
import { formatError, stringify } from '../Utils';

type RecommendedFees = {
  fastestFee?: number;
  halfHourFee?: number;
  hourFee?: number;
  minimumFee?: number;
}

class MempoolSpace {
  private static readonly fetchInterval = 30000;

  // Undefined in case the latest request failed
  public latestFee?: number;

  private fetchInterval?: any;

  constructor(
    private logger: Logger,
    private symbol: string,
    private apiUrl: string,
  ) {
    this.logger.info(`Enabling MempoolSpace fee estimations for ${this.symbol}: ${this.apiUrl}`);
  }

  public init = async (): Promise<void> => {
    await this.fetchRecommendedFees();

    this.fetchInterval = setInterval(async () => {
      await this.fetchRecommendedFees();
    }, MempoolSpace.fetchInterval);
  }

  public stop = (): void => {
    if (this.fetchInterval) {
      clearInterval(this.fetchInterval);
      this.fetchInterval = undefined;
    }

    this.latestFee = undefined;
  }

  private fetchRecommendedFees = async () => {
    try {
      const response = await Axios.get<any, AxiosResponse<RecommendedFees>>(`${this.apiUrl}/v1/fees/recommended`);

      if (typeof response.data.fastestFee !== 'number') {
        this.handleCouldNotFetch('invalid response');
        return;
      }

      this.logger.silly(`Fetched latest ${this.symbol} MempoolSpace fee estimations: ${stringify(response.data)}`);

      this.latestFee = response.data.fastestFee;
    } catch (error) {
      this.handleCouldNotFetch(error);
    }
  }

  private handleCouldNotFetch = (error: any) => {
    this.latestFee = undefined;
    this.logger.warn(`Could not fetch ${this.symbol} MempoolSpace fee estimations: ${formatError(error)}`);
  }
}

export default MempoolSpace;
