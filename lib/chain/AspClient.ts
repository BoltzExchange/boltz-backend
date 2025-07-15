import { Transaction } from '@scure/btc-signer';
import type {
  TransactionInput,
  TransactionOutput,
} from '@scure/btc-signer/psbt';
import axios from 'axios';

class AspClient {
  constructor(private readonly url: string) {
    if (this.url === undefined || this.url === '') {
      throw new Error('ASP is not set');
    }

    this.url = this.url.replace(/\/$/, '');

    if (!this.url.startsWith('http://') && !this.url.startsWith('https://')) {
      this.url = `http://${this.url}`;
    }
  }

  public static mapInputs = (tx: Transaction) => {
    const inputs: TransactionInput[] = [];

    for (let i = 0; i < tx.inputsLength; i++) {
      inputs.push(tx.getInput(i));
    }

    return inputs;
  };

  public static mapOutputs = (tx: Transaction) => {
    const outputs: TransactionOutput[] = [];

    for (let i = 0; i < tx.outputsLength; i++) {
      outputs.push(tx.getOutput(i));
    }

    return outputs;
  };

  public getInfo = async (): Promise<{ signerPubkey: string }> => {
    const res = await axios.get<{ signerPubkey: string }>(
      `${this.url}/v1/info`,
    );
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
