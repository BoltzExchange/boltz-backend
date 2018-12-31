import { expect } from 'chai';
import path from 'path';
import { ECPair, TransactionBuilder, Transaction, Network } from 'bitcoinjs-lib';
import { Networks } from 'boltz-core';
import Logger from '../../../lib/Logger';
import ChainClient from '../../../lib/chain/ChainClient';

describe('ChainClient', () => {
  it('ChainClients should connect', async () => {
    await Promise.all([
      btcdClient.connect(),
      ltcdClient.connect(),
    ]);
  });

  it('should update address subscriptions', async () => {
    await btcdClient.loadTxFiler(true, [btcAddress], []);
  });

  after(async () => {
    await Promise.all([
      btcdClient.disconnect(),
      ltcdClient.disconnect(),
    ]);
  });
});

type Utxo = {
  hash: string;
  vout: number;
  value: number;
};

export class UtxoManager {
  private keys: ECPair;

  constructor(private chainClient: ChainClient, private network: Network, private utxo: Utxo) {
    this.keys = network === Networks.bitcoinSimnet ? btcKeys : ltcKeys;
  }

  public constructTransaction = (destinationAddress: string, value: number): Transaction => {
    const tx = new TransactionBuilder(this.network);

    // Value of the new UTXO
    const utxoValue = (this.utxo.value - value) - 500;

    tx.addInput(this.utxo.hash, this.utxo.vout);
    tx.addOutput(btcAddress, utxoValue);

    tx.addOutput(destinationAddress, value);

    tx.sign(0, this.keys);

    const transaction = tx.build();

    this.utxo = {
      hash: transaction.getId(),
      vout: 0,
      value: utxoValue,
    };

    return transaction;
  }

  public broadcastAndMine = async (txHex: string) => {
    await this.chainClient.sendRawTransaction(txHex);
    await this.chainClient.generate(1);
  }
}

export const btcKeys = ECPair.fromWIF('Fpzo4qxGBizwddWz6hGgjgmKCVniWAWU1iPMHQuV8cgQHmxsRBB9', Networks.bitcoinSimnet);
export const btcAddress = 'SbVnjfHyqqSJLd7eaEKKmw3xwsRLHG9cuh';

export const ltcKeys = ECPair.fromWIF('FsTTuNURWqFsMpSLUXEkciAzYuBYibZB3r8ZoatdSpAjTznFUhnd', Networks.litecoinSimnet);
export const ltcAddress = 'SSGEBiUF9kNdTR6wNqY8h7zgmacKo7PN6f';

const certpath = path.join('docker', 'simnet', 'data', 'certs', 'btcd', 'rpc.cert');
const host = process.platform === 'win32' ? '192.168.99.100' : 'localhost';

export const btcdClient = new ChainClient(Logger.disabledLogger, {
  host,
  certpath,
  port: 18556,
  rpcuser: 'user',
  rpcpass: 'user',
}, 'BTC');

export const ltcdClient = new ChainClient(Logger.disabledLogger, {
  host,
  certpath,
  port: 19556,
  rpcpass: 'user',
  rpcuser: 'user',
}, 'LTC');

export let btcManager: UtxoManager;
export let ltcManager: UtxoManager;

export const setBtcManager = (manager: UtxoManager) => {
  btcManager = manager;
};

export const setLtcManager = (manager: UtxoManager) => {
  ltcManager = manager;
};
