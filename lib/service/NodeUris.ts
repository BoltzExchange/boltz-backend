import { Currency } from '../wallet/WalletManager';

type LndNodeInfo = {
  nodeKey: string;
  uris: string[];
};

class NodeUris {
  private uris = new Map<string, LndNodeInfo>();

  constructor(private currencies: Map<string, Currency>) {}

  public init = async () => {
    for (const [symbol, currency] of this.currencies) {
      if (currency.lndClient) {
        const lndInfo = await currency.lndClient.getInfo();
        this.uris.set(symbol, {
          uris: lndInfo.urisList,
          nodeKey: lndInfo.identityPubkey,
        });
      }
    }
  };

  public getNodes = () => {
    return this.uris;
  };
}

export { LndNodeInfo };
export default NodeUris;
