import axios from 'axios';
import type Exchange from '../Exchange';
import { requestTimeout } from '../Exchange';

class Binance implements Exchange {
  private static readonly API = 'https://api.binance.com/api/v3';

  public async getPrice(
    baseAsset: string,
    quoteAsset: string,
  ): Promise<number> {
    const { data } = await axios.get(
      `${Binance.API}/ticker/price?symbol=${baseAsset.toUpperCase()}${quoteAsset.toUpperCase()}`,
      { timeout: requestTimeout },
    );
    return Number(data.price);
  }
}

export default Binance;
