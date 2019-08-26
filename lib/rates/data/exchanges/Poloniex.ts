import Exchange, { makeRequest } from '../Exchange';

class Poloniex implements Exchange {
  private static readonly API = 'https://poloniex.com/public';

  public async getPrice(baseAsset: string, quoteAsset: string): Promise<number> {
    const response = await makeRequest(`${Poloniex.API}?command=returnTicker`);
    const pairData = response[`${quoteAsset.toUpperCase()}_${baseAsset.toUpperCase()}`];

    return Number(pairData.last);
  }
}

export default Poloniex;
