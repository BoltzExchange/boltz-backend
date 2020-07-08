import { randomBytes } from 'crypto';
import { Transaction, crypto } from 'bitcoinjs-lib';
import { getHexString, reverseBuffer } from '../../../lib/Utils';
import {
  Block,
  BlockchainInfo,
  BlockVerbose,
  RawTransaction,
  Transaction as TransactionType
} from '../../../lib/consts/Types';

type RawBlock = {
  height: number;
  hash: Buffer;
  block: Buffer;
};

class FakedChainClient {
  // Required for testing the compatibility rescan logic
  public disableGetBlockVerbose = false;

  private blockIndex = new Map<number, string>([
    [0, getHexString(FakedChainClient.genesisBlock.hash)],
  ]);

  private blocks = new Map<string, RawBlock>([
    [getHexString(FakedChainClient.genesisBlock.hash), FakedChainClient.genesisBlock],
  ]);

  private blockTransactions = new Map<string, string[]>([
    [getHexString(FakedChainClient.genesisBlock.hash), []],
  ]);

  private transactions = new Map<string, Transaction>();
  private mempoolTransactions = new Map<string, Transaction>();

  private static genesisBlock = {
    height: 0,
    hash: crypto.sha256(randomBytes(32)),
    block: randomBytes(80),
  };

  public get bestBlockHeight(): number {
    return this.blockIndex.size - 1;
  }

  public getBlockchainInfo = async (): Promise<BlockchainInfo> => {
    const bestBlock = this.blocks.get(this.blockIndex.get(this.bestBlockHeight)!)!;

    return {
      blocks: this.bestBlockHeight,
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
  }

  public getBlockhash = async (height: number): Promise<string> => {
    const hash = this.blockIndex.get(height);

    if (hash !== undefined) {
      return hash;
    } else {
      throw 'could not find block';
    }
  }

  public getBlock = async (hash: string): Promise<Block> => {
    const block = this.blocks.get(hash);

    if (block !== undefined) {
      const previousBlockHash = this.blockIndex.get(block.height - 1)!;
      const transactionIds = this.blockTransactions.get(
        getHexString(reverseBuffer(block.hash)),
      );

      return {
        hash,
        height: block.height,
        tx: transactionIds || [],
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
    } else {
      throw 'could not find block';
    }
  }

  public getBlockVerbose = async (hash: string): Promise<BlockVerbose> => {
    if (this.disableGetBlockVerbose) {
      throw 'disabled';
    }

    const block = this.blocks.get(hash);

    if (block !== undefined) {
      const previousBlockHash = this.blockIndex.get(block.height - 1)!;
      const transactionIds = this.blockTransactions.get(
        getHexString(reverseBuffer(block.hash)),
      );

      const transactions: TransactionType[] = [];

      if (transactionIds) {
        for (const id of transactionIds) {
          transactions.push({
            hex: this.transactions.get(id)!.toHex(),
          } as any as TransactionType);
        }
      }

      return {
        hash,
        tx: transactions,
        height: block.height,
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

    } else {
      throw 'could not find block';
    }
  }

  public getRawTransaction = async (id: string): Promise<string> => {
    const transaction = this.transactions.get(id);

    if (transaction !== undefined) {
      return transaction.toHex();
    } else {
      const mempoolTransaction = this.mempoolTransactions.get(id);

      if (mempoolTransaction !== undefined) {
        return mempoolTransaction.toHex();
      } else {
        throw 'could not find transaction';
      }
    }
  }

  public getRawTransactionVerbose = async (id: string): Promise<RawTransaction> => {
    const verboseTransaction = {
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

    const transaction = this.transactions.get(id);

    if (transaction !== undefined) {
      return {
        ...verboseTransaction,

        confirmations: 1,
        hex: transaction.toHex(),
      };
    } else {
      const mempoolTransaction = this.mempoolTransactions.get(id);

      if (mempoolTransaction !== undefined) {
        return {
          confirmations: 0,
          ...verboseTransaction,
        };
      } else {
        throw 'could not find transaction';
      }
    }
  }

  public generateBlock = (height?: number, orphan = false): { hash: Buffer, block: Buffer, height: number } => {
    if (height !== undefined) {
      if (height > this.bestBlockHeight + 1) {
        throw 'cannot generate block greater than best block height';
      }
    }

    const previousBlockHeight = height !== undefined ? height - 1 : this.bestBlockHeight;
    const previousBlock = this.blocks.get(this.blockIndex.get(previousBlockHeight)!)!;

    const data = Buffer.concat([randomBytes(4), previousBlock.hash, randomBytes(44)], 80);
    const hash = crypto.sha256(crypto.sha256(data));

    const block = {
      hash,
      block: data,
      height: previousBlockHeight + 1,
    };

    const blockHash = getHexString(reverseBuffer(hash));

    if (height === undefined && !orphan) {
      const blockTransactions: string[] = [];

      this.mempoolTransactions.forEach((mempoolTransaction, id) => {
        this.transactions.set(id, mempoolTransaction);
        blockTransactions.push(id);
      });

      this.mempoolTransactions.clear();

      this.blockTransactions.set(blockHash, blockTransactions);
    }

    this.blocks.set(blockHash, block);

    if (!orphan) {
      this.blockIndex.set(block.height, blockHash);
    }

    return block;
  }

  public sendRawTransaction = (transaction: Transaction): void => {
    this.mempoolTransactions.set(transaction.getId(), transaction);
  }
}

export default FakedChainClient;
export { RawBlock };
