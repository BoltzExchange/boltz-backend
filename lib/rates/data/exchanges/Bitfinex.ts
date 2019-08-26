import Exchange, { makeRequest } from '../Exchange';

class Bitfinex implements Exchange {
  private static readonly API = 'https://api.bitfinex.com/v1/';

  public async getPrice(baseAsset: string, quoteAsset: string): Promise<number> {
    const response = await makeRequest(`${Bitfinex.API}/pubticker/${baseAsset}${quoteAsset}`);

    return Number(response.last_price);
  }
}

export default Bitfinex;
