import axios from 'axios';
import type Exchange from '../Exchange';
import { requestTimeout } from '../Exchange';

class Bitfinex implements Exchange {
  private static readonly API = 'https://api.bitfinex.com/v2';

  public async getPrice(
    baseAsset: string,
    quoteAsset: string,
  ): Promise<number> {
    const { data } = await axios.get(
      `${Bitfinex.API}/ticker/t${this.replaceUSDT(baseAsset)}${this.replaceUSDT(quoteAsset)}`,
      { timeout: requestTimeout },
    );
    return Number(data[6]);
  }

  /**
   * Bitfinex calls USDT "UST" internally
   */
  private replaceUSDT = (asset: string) => {
    return asset === 'USDT' ? 'UST' : asset;
  };
}

export default Bitfinex;
