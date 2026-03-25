import axios from 'axios';
import type Exchange from '../Exchange';
import { requestTimeout } from '../Exchange';

class CoinbasePro implements Exchange {
  private static readonly API = 'https://api.exchange.coinbase.com';

  public async getPrice(
    baseAsset: string,
    quoteAsset: string,
  ): Promise<number> {
    const { data } = await axios.get(
      `${CoinbasePro.API}/products/${baseAsset}-${quoteAsset}/ticker`,
      { timeout: requestTimeout },
    );
    return Number(data.price);
  }
}

export default CoinbasePro;
