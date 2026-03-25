import axios from 'axios';
import type Exchange from '../Exchange';
import { requestTimeout } from '../Exchange';

class Kraken implements Exchange {
  private static readonly API = 'https://api.kraken.com/0/public';

  public async getPrice(
    baseAsset: string,
    quoteAsset: string,
  ): Promise<number> {
    const pair = `${this.parseAsset(baseAsset)}${this.parseAsset(quoteAsset)}`;
    const { data } = await axios.get(`${Kraken.API}/Ticker?pair=${pair}`, {
      timeout: requestTimeout,
    });
    const lastTrade = (
      Object.values(data['result'])[0] as Record<string, string[]>
    )['c'];

    return Number(lastTrade[0]);
  }

  private parseAsset = (asset: string) => {
    const assetUpperCase = asset.toUpperCase();

    switch (assetUpperCase) {
      case 'BTC':
        return 'XBT';
      default:
        return assetUpperCase;
    }
  };
}

export default Kraken;
