import { getJson } from '../../../Http';
import type Exchange from '../Exchange';
import { requestTimeout } from '../Exchange';

type CoinbaseProTickerResponse = {
  price: string;
};

class CoinbasePro implements Exchange {
  private static readonly API = 'https://api.exchange.coinbase.com';

  public async getPrice(
    baseAsset: string,
    quoteAsset: string,
  ): Promise<number> {
    const data = await getJson<CoinbaseProTickerResponse>(
      `${CoinbasePro.API}/products/${baseAsset}-${quoteAsset}/ticker`,
      { timeout: requestTimeout },
    );
    return Number(data.price);
  }
}

export default CoinbasePro;
