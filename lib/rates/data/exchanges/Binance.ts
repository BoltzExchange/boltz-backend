import Exchange, { makeRequest } from '../Exchange';

class Binance implements Exchange {
  private static readonly API = 'https://api.binance.com/api';

  public async getPrice(baseAsset: string, quoteAsset: string): Promise<number> {
    const response = await makeRequest(`${Binance.API}/v3/ticker/price?symbol=${baseAsset.toUpperCase()}${quoteAsset.toUpperCase()}`);

    return Number(response.price);
  }
}

export default Binance;
