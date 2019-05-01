import chai, { expect } from 'chai';
import zmq, { Socket } from 'zeromq';
import { randomBytes } from 'crypto';
import { OutputType } from 'boltz-core';
import chaiAsPromised from 'chai-as-promised';
import { Transaction, crypto } from 'bitcoinjs-lib';
import Logger from '../../../lib/Logger';
import Errors from '../../../lib/chain/Errors';
import { getHexString, reverseBuffer } from '../../../lib/Utils';
import { generateAddress, waitForFunctionToBeTrue, wait } from '../../Utils';
import { Block, BlockchainInfo, RawTransaction } from '../../../lib/consts/Types';
import ZmqClient, { ZmqNotification, filters } from '../../../lib/chain/ZmqClient';

chai.use(chaiAsPromised);

type RawBlock = {
  height: number;
  hash: Buffer;
  block: Buffer;
};

class ZmqPublisher {
  public address: string;

  private socket: Socket;
  private filter: string;

  constructor(port: number, filter: string) {
    this.address = `tcp://127.0.0.1:${port}`;
    this.filter = filter.replace('pub', '');

    this.socket = zmq.socket('pub');
    this.socket.bindSync(this.address);
  }

  public close = () => {
    this.socket.close();
  }

  public sendMessage = (message: Buffer) => {
    this.socket.send([this.filter, message]);
  }
}

describe('ZmqClient', () => {
  // ZMQ publisher
  const rawTx = new ZmqPublisher(3000, filters.rawTx);

  const rawBlock = new ZmqPublisher(3001, filters.rawBlock);
  const hashBlock = new ZmqPublisher(3002, filters.hashBlock);

  const sendHashBlock = (height?: number, orphan = false) => {
    const { hash } = generateBlock(height, orphan);
    hashBlock.sendMessage(reverseBuffer(hash));
  };

  // Variables and functions related to transactions
  const { outputScript } = generateAddress(OutputType.Bech32);
  const transactions = new Map<string, { transaction: Transaction, isConfirmed: boolean }>();

  const generateTransaction = (isConfirmed: boolean): Transaction => {
    const transaction = new Transaction();

    transaction.addOutput(outputScript, 1);
    transaction.addInput(crypto.hash256(randomBytes(32)), 0);

    transactions.set(transaction.getId(), {
      transaction,
      isConfirmed,
    });

    return transaction;
  };

  // Variables and functions related to blocks
  const genesisBlock = {
    height: 0,
    hash: crypto.sha256(randomBytes(32)),
    block: randomBytes(80),
  };

  // Number of blocks that should be generated for each block test
  const blocksToGenerate = 10;

  let bestBlockHeight = 0;

  const blockIndex = new Map<number, string>([
    [0, getHexString(genesisBlock.hash)],
  ]);
  const blocks = new Map<string, RawBlock>([
    [getHexString(genesisBlock.hash), genesisBlock],
  ]);

  // A map between the hashes of the blocks and the transactions that blocks contains
  const blockTransactions = new Map<string, string[]>();

  const generateBlock = (height?: number, orphan = false): RawBlock => {
    const previousBlockHeight = height !== undefined ? height : bestBlockHeight;

    // Note that generating orphan works just if there were blocks mined after genesis
    const previousBlock = blocks.get(blockIndex.get(previousBlockHeight)!)!;

    const data = Buffer.concat([randomBytes(4), previousBlock.hash, randomBytes(44)], 80);
    const hash = crypto.sha256(crypto.sha256(data));

    if (!orphan) {
      bestBlockHeight = previousBlockHeight + 1;
    }

    const block = {
      hash,
      block: data,
      height: orphan ? previousBlockHeight + 1 : bestBlockHeight,
    };

    const hashHex = getHexString(reverseBuffer(hash));

    blocks.set(hashHex, block);

    if (!orphan) {
      blockIndex.set(bestBlockHeight, hashHex);
    }

    return block;
  };

  // Functions for the ZMQ client
  const getBlock = async (hash: string): Promise<Block> => {
    const block = blocks.get(hash)!;
    const previousBlockHash = blockIndex.get(block.height - 1)!;
    const transactions = blockTransactions.get(getHexString(block.hash));

    return {
      hash,
      height: block.height,
      tx: transactions || [],
      previousblockhash: previousBlockHash,

      nTx: 0,
      time: 0,
      size: 0,
      nonce: 0,
      bits: '',
      weight: 0,
      version: 0,
      chainwork: '',
      difficulty: 0,
      merkleroot: '',
      versionHex: '',
      strippedsize: 0,
      confirmations: 0,
    };
  };

  const getBlockChainInfo = async (): Promise<BlockchainInfo> => {
    const bestBlock = blocks.get(blockIndex.get(bestBlockHeight)!)!;

    return {
      blocks: bestBlockHeight,
      bestblockhash: getHexString(
        reverseBuffer(bestBlock.hash),
      ),

      chain: '',
      headers: 0,
      difficulty: 0,
      mediantime: 0,
      pruned: false,
      chainwork: '',
      size_on_disk: 0,
      verificationprogress: 0,
      initialblockdownload: '',
    };
  };

  const getTransaction = async (id: string, verbose?: boolean): Promise<string | RawTransaction> => {
    const data = transactions.get(id);

    if (data) {
      if (verbose) {
        const confirmations = data.isConfirmed ? 1 : 0;

        return {
          confirmations,

          hex: '',
          vin: [],
          size: 0,
          time: 0,
          vout: [],
          vsize: 0,
          txid: '',
          hash: '',
          weight: 0,
          version: 0,
          locktime: 0,
          blocktime: 0,
          blockhash: '',
        };
      } else {
        return data.transaction.toHex();
      }
    }

    return '';
  };

  const zmqClient = new ZmqClient('BTC', Logger.disabledLogger, getBlock, getBlockChainInfo, getTransaction);

  it('should not init without needed subscriptions', async () => {
    const rejectZmqClient = new ZmqClient('BTC', Logger.disabledLogger, getBlock, getBlockChainInfo, getTransaction);
    const notifications: ZmqNotification[] = [];

    expect(rejectZmqClient.init(notifications)).to.eventually.be.rejectedWith(Errors.NO_BLOCK_NOTIFICATIONS().message)
      .and.notify(rejectZmqClient.close);

    notifications.push({
      type: filters.rawTx,
      address: rawTx.address,
    });

    expect(rejectZmqClient.init(notifications)).to.eventually.be.rejectedWith(Errors.NO_BLOCK_NOTIFICATIONS().message)
      .and.notify(rejectZmqClient.close);
  });

  it('should init', async () => {
    const notifications: ZmqNotification[] = [
      {
        type: filters.rawTx,
        address: rawTx.address,
      },
      {
        type: filters.rawBlock,
        address: rawBlock.address,
      },
      {
        type: filters.hashBlock,
        address: hashBlock.address,
      },
    ];

    await zmqClient.init(notifications);

    zmqClient.relevantOutputs.add(getHexString(outputScript));
  });

  it('should rescan blocks', async () => {
    // Setup some data for the rescan test
    for (let i = 0; i < blocksToGenerate; i += 1) {
      const { hash } = generateBlock();

      const transactions: string[] = [];

      for (let tx = 0; tx < blocksToGenerate; tx += 1) {
        const transaction = generateTransaction(true);
        transactions.push(transaction.getId());
      }

      blockTransactions.set(getHexString(hash), transactions);
    }

    zmqClient['blockHeight'] = bestBlockHeight;
    zmqClient['bestBlockHash'] = blockIndex.get(bestBlockHeight)!;

    let transactionsFound = 0;

    zmqClient.on('transaction.relevant.block', () => {
      transactionsFound += 1;
    });

    await zmqClient.rescanChain(0);

    await waitForFunctionToBeTrue(() => {
      return transactionsFound === transactions.size;
    });
  });

  it('should handle raw transactions', async () => {
    let mempoolAcceptance = false;
    let blockAcceptance  = false;

    zmqClient.on('transaction.relevant.mempool', () => {
      mempoolAcceptance = true;
    });

    zmqClient.on('transaction.relevant.block', () => {
      blockAcceptance = true;
    });

    // Flow of a transaction that gets added to the mempool and afterwards included in a block
    const mempoolTransaction = generateTransaction(false);

    rawTx.sendMessage(mempoolTransaction.toBuffer());

    await waitForFunctionToBeTrue(() => {
      return mempoolAcceptance;
    });

    await waitForFunctionToBeTrue(() => {
      return !blockAcceptance;
    });

    expect(zmqClient.utxos.has(mempoolTransaction.getId())).to.be.true;

    rawTx.sendMessage(mempoolTransaction.toBuffer());

    await waitForFunctionToBeTrue(() => {
      return blockAcceptance;
    });

    expect(zmqClient.utxos.has(mempoolTransaction.getId())).to.be.false;

    blockAcceptance = false;

    // Flow of a transaction that is added to a block directly
    const blockTransaction = generateTransaction(true);

    rawTx.sendMessage(blockTransaction.toBuffer());

    await waitForFunctionToBeTrue(() => {
      return blockAcceptance;
    });
  });

  it('should handle rawblock notifications', async () => {
    let blockHeight = 0;

    zmqClient.on('block', (height) => {
      blockHeight = height;
    });

    for (let i = 0; i < blocksToGenerate; i += 1) {
      const { block } = generateBlock();
      rawBlock.sendMessage(block);
    }

    await waitForFunctionToBeTrue(() => {
      return blockHeight === bestBlockHeight;
    });

    // Generate an orphan and make sure that the blockHeight did not increase
    const { block } = generateBlock(0, true);
    rawBlock.sendMessage(block);

    await wait(10);

    expect(blockHeight).to.be.equal(bestBlockHeight);
  });

  it('should handle rawblock reorganizations', async () => {
    let blockHeight = bestBlockHeight;

    zmqClient.on('block', (height) => {
      expect(height).to.be.equal(blockHeight + 1);
      blockHeight = height;
    });

    const reorgHeight = bestBlockHeight - 5;
    for (let i = 0; i < blocksToGenerate; i += 1) {
      const { block } = generateBlock(reorgHeight + i);
      rawBlock.sendMessage(block);
    }

    await waitForFunctionToBeTrue(() => {
      return blockHeight === bestBlockHeight;
    });

    expect(blockHeight).to.be.equal(reorgHeight + blocksToGenerate);
  });

  it('should fallback to hashblock notifications', async () => {
    rawBlock.close();

    // Wait until there are three sockets in the ZmqClient which
    // means that the client connected to the hashblock fallback
    await waitForFunctionToBeTrue(() => {
      return zmqClient['sockets'].length === 3;
    });

    // Wait a little more to make sure the socket is connected
    await wait(10);
  });

  it('should handle hashblock notifications', async () => {
    let blockHeight = 0;

    zmqClient.on('block', (height) => {
      blockHeight = height;
    });

    for (let i = 9; i < blocksToGenerate; i += 1) {
      sendHashBlock();
    }

    await waitForFunctionToBeTrue(() => {
      return blockHeight === bestBlockHeight;
    });

    // Generate an orphan and make sure that the blockHeight did not increase
    sendHashBlock(0, true);

    await wait(10);

    expect(blockHeight).to.be.equal(bestBlockHeight);
  });

  it('should handle rawblock reorganizations', async () => {
    let blockHeight = bestBlockHeight;

    zmqClient.on('block', (height) => {
      expect(height).to.be.equal(blockHeight + 1);
      blockHeight = height;
    });

    const reorgHeight = bestBlockHeight - 5;
    for (let i = 0; i < blocksToGenerate; i += 1) {
      sendHashBlock(reorgHeight + i);
    }

    await waitForFunctionToBeTrue(() => {
      return blockHeight === bestBlockHeight;
    });

    expect(blockHeight).to.be.equal(reorgHeight + blocksToGenerate);
  });
});
