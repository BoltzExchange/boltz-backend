import BaseClient from '../BaseClient';
import Logger from '../Logger';
import RpcClient, { RpcConfig } from '../RpcClient';
import { ClientStatus } from '../consts/Enums';
import ChainClientInterface, { Info, Block, BestBlock } from './ChainClientInterface';

class ChainClient extends BaseClient implements ChainClientInterface {
  private rpcClient: RpcClient;
  private uri: string;

  constructor(private logger: Logger, config: RpcConfig, public readonly symbol: string) {
    super();

    this.rpcClient = new RpcClient(config);
    this.uri = `${config.host}:${config.port}`;

    this.bindWs();
  }

  private bindWs = () => {
    this.rpcClient.on('error', error => this.emit('error', error));
    this.rpcClient.on('message.orphan', (data) => {
      switch (data.method) {
        // Emits an event on mempool acceptance
        case 'relevanttxaccepted':
          data.params.forEach((transaction: string) => {
            this.emit('transaction.relevant.mempool', transaction);
          });
          break;

        // Emits an event when a blocks gets added
        case 'filteredblockconnected':
          const params: any[] = data.params;

          this.emit('block.connected', params[0]);

          if (params[2] !== null) {
            const transactions = params[2] as string[];

            transactions.forEach((transaction) => {
              this.emit('transaction.relevant.block', transaction, params[0]);
            });
          }
          break;
      }
    });
  }

  public connect = async () => {
    if (this.isDisconnected) {
      try {
        await this.rpcClient.connect();
        const info = await this.getInfo();

        if (info.version) {
          await this.notifyBlocks();

          this.clearReconnectTimer();
          this.setClientStatus(ClientStatus.Connected);
        } else {
          this.setClientStatus(ClientStatus.Disconnected);
          this.logger.error(`${this.symbol} at ${this.uri} is not able to connect, retrying in ${this.RECONNECT_INTERVAL} ms`);
          this.reconnectionTimer = setTimeout(this.connect, this.RECONNECT_INTERVAL);
        }
      } catch (error) {
        this.setClientStatus(ClientStatus.Disconnected);
        this.logger.error(`could not verify connection to chain ${this.symbol} chain at ${this.uri} because: ${JSON.stringify(error)}` +
        ` retrying in ${this.RECONNECT_INTERVAL} ms`);
        this.reconnectionTimer = setTimeout(this.connect, this.RECONNECT_INTERVAL);
      }
    }
  }

  public disconnect = async () => {
    this.clearReconnectTimer();
    this.setClientStatus(ClientStatus.Disconnected);

    await this.rpcClient.close();
  }

  public getInfo = (): Promise<Info> => {
    return this.rpcClient.call<Info>('getinfo');
  }

  public getBestBlock = (): Promise<BestBlock> => {
    return this.rpcClient.call<BestBlock>('getbestblock');
  }

  public getBlock = (blockHash: string): Promise<Block> => {
    return this.rpcClient.call<Block>('getblock', blockHash);
  }

  public loadTxFiler = (reload: boolean, addresses: string[], outpoints: string[]): Promise<null> => {
    // tslint:disable-next-line no-null-keyword
    return this.rpcClient.call<null>('loadtxfilter', reload, addresses, outpoints);
  }

  public sendRawTransaction = (rawTransaction: string, allowHighFees = true): Promise<string> => {
    return this.rpcClient.call<string>('sendrawtransaction', rawTransaction, allowHighFees);
  }

  public getRawTransaction = (transactionHash: string, verbose = 0) => {
    return this.rpcClient.call<any>('getrawtransaction', transactionHash, verbose);
  }

  public estimateFee = async (numberBlocks = 2) => {
    const feeResponse = await this.rpcClient.call<number>('estimatefee', numberBlocks);
    const feePerKb = feeResponse * 100000000;

    return Math.round(feePerKb / 1000);
  }

  public generate = (blocks: number): Promise<string[]> => {
    return this.rpcClient.call<string[]>('generate', blocks);
  }

  /**
   * Call this function to get notifications about the block acceptance of relevant transactions
   */
  private notifyBlocks = () => {
    return this.rpcClient.call<void>('notifyblocks');
  }

}

export default ChainClient;
