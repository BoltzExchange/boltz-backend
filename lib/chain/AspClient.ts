import { Transaction } from '@scure/btc-signer';
import axios from 'axios';

class AspClient {
  constructor(private readonly url: string) {
    if (this.url === undefined || this.url === '') {
      throw new Error('ASP is not set');
    }

    this.url = this.url.replace(/\/$/, '');
  }

  public getInfo = async (): Promise<{ pubkey: string }> => {
    const res = await axios.get<{ pubkey: string }>(`${this.url}/v1/info`);
    return res.data;
  };

  public getTx = async (txId: string): Promise<Transaction> => {
    const res = await axios.get<{ txs: string[] }>(
      `${this.url}/v1/virtualTx/${txId}`,
    );
    if (res.data.txs.length === 0) {
      throw new Error('transaction not found');
    }

    return Transaction.fromPSBT(Buffer.from(res.data.txs[0], 'base64'));
  };
}

export default AspClient;
