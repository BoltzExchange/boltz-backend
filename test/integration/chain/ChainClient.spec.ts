import { expect } from 'chai';
import path from 'path';
import { ECPair, TransactionBuilder, Transaction, Network } from 'bitcoinjs-lib';
import { Networks } from 'boltz-core';
import Logger from '../../../lib/Logger';
import ChainClient from '../../../lib/chain/ChainClient';

describe('ChainClient', () => {
  it('BtcdClient should connect', async () => {
    await btcdClient.connect();
  });

  it('BtcdClient should activate SegWit', async () => {
    // 433 blocks are needed to active SegWit on the BTCD simnet network
    const blockHashes = await btcdClient.generate(433);

    const block = await btcdClient.getBlock(blockHashes[0]);
    const rawTransaction = await btcdClient.getRawTransaction(block.tx[0]);
    const transaction = Transaction.fromHex(rawTransaction);

    btcManager = new UtxoManager(btcdClient, Networks.bitcoinSimnet, {
      hash: transaction.getId(),
      value: transaction.outs[0].value,
    });
  });

  it('LtcdClient should connect', async () => {
    await ltcdClient.connect();
  });

  it('LtcdClient should activate SegWit', async () => {
    // 433 blocks are needed to active SegWit on the BTCD simnet network
    const blockHashes = await ltcdClient.generate(433);

    const block = await ltcdClient.getBlock(blockHashes[0]);
    const rawTransaction = await ltcdClient.getRawTransaction(block.tx[0]);
    const transaction = Transaction.fromHex(rawTransaction);

    ltcManager = new UtxoManager(ltcdClient, Networks.litecoinSimnet, {
      hash: transaction.getId(),
      value: transaction.outs[0].value,
    });
  });

  it('should update address subscriptions', async () => {
    await btcdClient.loadTxFiler(true, [btcAddress], []);
  });

  it('should emit an event when a transaction is sent to relevant address', async () => {
    const transaction = await btcManager.constructTransaction(btcAddress, 1);
    const relevantTxHex = transaction.toHex();

    let mempoolEventReceived = false;
    let blockEventReceived = false;

    btcdClient.on('transaction.relevant.mempool', (transactionHex) => {
      if (transactionHex === relevantTxHex) {
        mempoolEventReceived = true;
      }
    });

    btcdClient.on('transaction.relevant.block', (transactionHex) => {
      if (transactionHex === relevantTxHex) {
        blockEventReceived = true;
      }
    });

    await btcManager.broadcastAndMine(relevantTxHex);

    const eventPromise = new Promise<void>((resolve) => {
      const interval = setInterval(async () => {
        if (mempoolEventReceived && blockEventReceived) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });

    await eventPromise;

    expect(mempoolEventReceived).to.be.true;
    expect(blockEventReceived).to.be.true;
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

    tx.addInput(this.utxo.hash, 0);
    tx.addOutput(btcAddress, utxoValue);

    tx.addOutput(destinationAddress, value);

    tx.sign(0, this.keys);

    const transaction = tx.build();

    this.utxo = {
      hash: transaction.getId(),
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

const certpath = path.join('docker', 'data', 'certs', 'rpc.cert');
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
