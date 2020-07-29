import Exchange, { makeRequest } from '../Exchange';

class Kraken implements Exchange {
  private static readonly API = 'https://api.kraken.com/0/public';

  public async getPrice(baseAsset: string, quoteAsset: string): Promise<number> {
    const pair = `${this.parseAsset(baseAsset)}${this.parseAsset(quoteAsset)}`;
    const response = await makeRequest(`${Kraken.API}/Ticker?pair=${pair}`);
    const lastTrade = Object.values(response['result'])[0] as Record<string, string[]>['c'];

    return Number(lastTrade[0]);
  }

  private parseAsset = (asset: string) => {
    const assetUpperCase = asset.toUpperCase();

    switch (assetUpperCase) {
      case 'BTC': return 'XBT';
      default: return assetUpperCase;
    }
  }
}

export default Kraken;
