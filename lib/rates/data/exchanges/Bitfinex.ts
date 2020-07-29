import Exchange, { makeRequest } from '../Exchange';

class Bitfinex implements Exchange {
  private static readonly API = 'https://api.bitfinex.com/v2/';

  public async getPrice(baseAsset: string, quoteAsset: string): Promise<number> {
    const response = await makeRequest(`${Bitfinex.API}/ticker/t${this.replaceUSDT(baseAsset)}${this.replaceUSDT(quoteAsset)}`);
    return Number(response[6]);
  }

  /**
   * Bitfinex calls USDT "UST" internally
   */
  private replaceUSDT = (asset: string) => {
    return asset === 'USDT' ? 'UST' : asset;
  }
}

export default Bitfinex;
