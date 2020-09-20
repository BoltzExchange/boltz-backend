import Logger from '../../Logger';
import { BigNumber, BigNumberish, providers, utils } from 'ethers';
import { BlockWithTransactions } from '@ethersproject/abstract-provider';
import PendingEthereumTransactionRepository from '../../db/PendingEthereumTransactionRepository';

// TODO: infura or alchemy fallback
/**
 * This provider is a wrapper for the WebSocketProvider from ethers but it writes sent transactions to the database
 */
class InjectedProvider implements providers.Provider {
  public _isProvider = true;

  private websocketProvider: providers.WebSocketProvider;
  private pendingEthereumTransactionRepository = new PendingEthereumTransactionRepository();

  constructor(
    private logger: Logger,
    providerEndpoint: string,
  ) {
    this.websocketProvider = new providers.WebSocketProvider(providerEndpoint);
  }

  public addListener = (eventName: providers.EventType, listener: providers.Listener): providers.Provider => {
    return this.websocketProvider.addListener(eventName, listener);
  }

  public call = (
    transaction: utils.Deferrable<providers.TransactionRequest>,
    blockTag?: providers.BlockTag | Promise<providers.BlockTag>,
  ): Promise<string> => {
    return this.websocketProvider.call(transaction, blockTag);
  }

  public emit = (eventName: providers.EventType, ...args: Array<any>): boolean => {
    return this.websocketProvider.emit(eventName, args);
  }

  public estimateGas = (transaction: utils.Deferrable<providers.TransactionRequest>): Promise<BigNumber> => {
    return this.websocketProvider.estimateGas(transaction);
  }

  public getBalance = (addressOrName: string | Promise<string>, blockTag?: providers.BlockTag | Promise<providers.BlockTag>): Promise<BigNumber> => {
    return this.websocketProvider.getBalance(addressOrName, blockTag);
  }

  public getBlock = (blockHashOrBlockTag: providers.BlockTag | string | Promise<providers.BlockTag | string>): Promise<providers.Block> => {
    return this.websocketProvider.getBlock(blockHashOrBlockTag);
  }

  public getBlockNumber = (): Promise<number> => {
    return this.websocketProvider.getBlockNumber();
  }

  public getBlockWithTransactions = (blockHashOrBlockTag: providers.BlockTag | string | Promise<providers.BlockTag | string>): Promise<BlockWithTransactions> => {
    return this.websocketProvider.getBlockWithTransactions(blockHashOrBlockTag);
  }

  public getCode = (addressOrName: string | Promise<string>, blockTag?: providers.BlockTag | Promise<providers.BlockTag>): Promise<string> => {
    return this.websocketProvider.getCode(addressOrName, blockTag);
  }

  public getGasPrice = (): Promise<BigNumber> => {
    return this.websocketProvider.getGasPrice();
  }

  public getLogs = (filter: providers.Filter): Promise<Array<providers.Log>> => {
    return this.websocketProvider.getLogs(filter);
  }

  public getNetwork = (): Promise<providers.Network> => {
    return this.websocketProvider.getNetwork();
  }

  public getStorageAt = (
    addressOrName: string | Promise<string>,
    position: BigNumberish | Promise<BigNumberish>,
    blockTag?: providers.BlockTag | Promise<providers.BlockTag>,
  ): Promise<string> => {
    return this.websocketProvider.getStorageAt(addressOrName, position, blockTag);
  }

  public getTransaction = (transactionHash: string): Promise<providers.TransactionResponse> => {
    return this.websocketProvider.getTransaction(transactionHash);
  }

  public getTransactionCount = (
    addressOrName: string | Promise<string>,
    blockTag?: providers.BlockTag | Promise<providers.BlockTag>,
  ): Promise<number> => {
    return this.websocketProvider.getTransactionCount(addressOrName, blockTag);
  }

  public getTransactionReceipt = (transactionHash: string): Promise<providers.TransactionReceipt> => {
    return this.websocketProvider.getTransactionReceipt(transactionHash);
  }

  public listenerCount = (eventName?: providers.EventType): number => {
    return this.websocketProvider.listenerCount(eventName);
  }

  public listeners = (eventName?: providers.EventType): Array<providers.Listener> => {
    return this.websocketProvider.listeners(eventName);
  }

  public lookupAddress = (address: string | Promise<string>): Promise<string> => {
    return this.websocketProvider.lookupAddress(address);
  }

  public off = (eventName: providers.EventType, listener?: providers.Listener): providers.Provider => {
    return this.websocketProvider.off(eventName, listener);
  }

  public on = (eventName: providers.EventType, listener: providers.Listener): providers.Provider => {
    return this.websocketProvider.on(eventName, listener);
  }

  public once = (eventName: providers.EventType, listener: providers.Listener): providers.Provider => {
    return this.websocketProvider.once(eventName, listener);
  };

  public removeAllListeners = (eventName?: providers.EventType): providers.Provider => {
    return this.websocketProvider.removeAllListeners(eventName);
  }

  public removeListener = (eventName: providers.EventType, listener: providers.Listener): providers.Provider => {
    return this.websocketProvider.removeListener(eventName, listener);
  }

  public resolveName = (name: string | Promise<string>): Promise<string> => {
    return this.websocketProvider.resolveName(name);
  }

  public sendTransaction = async (signedTransaction: string | Promise<string>): Promise<providers.TransactionResponse> => {
    const transaction = utils.parseTransaction(await signedTransaction);

    this.logger.debug(`Sending Ethereum transaction: ${transaction.hash}`);
    await this.pendingEthereumTransactionRepository.addTransaction(
      transaction.hash!,
      transaction.nonce,
    );
    return this.websocketProvider.sendTransaction(signedTransaction);
  }

  public waitForTransaction = (transactionHash: string, confirmations?: number, timeout?: number): Promise<providers.TransactionReceipt> => {
    return this.websocketProvider.waitForTransaction(transactionHash, confirmations, timeout);
  }
}

export default InjectedProvider;
