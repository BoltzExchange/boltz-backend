import type Exchange from '../Exchange';
import { makeRequest } from '../Exchange';

class CoinbasePro implements Exchange {
  private static readonly API = 'https://api.exchange.coinbase.com';

  public async getPrice(
    baseAsset: string,
    quoteAsset: string,
  ): Promise<number> {
    const response = await makeRequest(
      `${CoinbasePro.API}/products/${baseAsset}-${quoteAsset}/ticker`,
    );
    return Number(response.price);
  }
}

export default CoinbasePro;
