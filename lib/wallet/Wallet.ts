import { Network, address, BIP32Interface } from 'bitcoinjs-lib';
import Logger from '../Logger';
import KeyRepository from '../db/KeyRepository';
import WalletProviderInterface, { SentTransaction, WalletBalance } from './providers/WalletProviderInterface';

class Wallet {
  public readonly symbol: string;

  /**
   * Wallet is a hierarchical deterministic wallet for a single currency
   *
   * @param network the network of the wallet
   * @param derivationPath path from which the keys are derived; should be in the format "m/0/<index of the wallet>"
   * @param highestUsedIndex the highest index of a used key of the wallet
   * @param logger Logger
   * @param masterNode the master node from which generated keys are derived
   * @param keyRepository database repository storing the highest used key index
   * @param walletProvider actual wallet which is handling the coins
   */
  constructor(
    public readonly network: Network,
    public readonly derivationPath: string,
    public highestUsedIndex: number,
    private logger: Logger,
    private masterNode: BIP32Interface,
    private keyRepository: KeyRepository,
    private walletProvider: WalletProviderInterface,
  ) {
    this.symbol = this.walletProvider.symbol;
  }

  /**
   * Gets a specific pair of keys
   *
   * @param index index of the keys to get
   */
  public getKeysByIndex = (index: number): BIP32Interface => {
    return this.masterNode.derivePath(`${this.derivationPath}/${index}`);
  }

  /**
   * Gets a new pair of keys
   */
  public getNewKeys = (): { keys: BIP32Interface, index: number } => {
    this.highestUsedIndex += 1;

    // tslint:disable-next-line no-floating-promises
    this.keyRepository.setHighestUsedIndex(this.symbol, this.highestUsedIndex).then();

    return {
      keys: this.getKeysByIndex(this.highestUsedIndex),
      index: this.highestUsedIndex,
    };
  }

  /**
   * Encodes an address
   *
   * @param outputScript the output script to encode
   */
  public encodeAddress = (outputScript: Buffer): string => {
    try {
      return address.fromOutputScript(
        outputScript,
        this.network,
      );
    } catch (error) {
      if (error.toString().includes('OP_RETURN')) {
        return '';
      }

      throw error;
    }
  }

  /**
   * Decodes an address
   */
  public decodeAddress = (toDecode: string): Buffer => {
    return address.toOutputScript(
      toDecode,
      this.network,
    );
  }

  public newAddress = (): Promise<string> => {
    return this.walletProvider.newAddress();
  }

  public getBalance = (): Promise<WalletBalance> => {
    return this.walletProvider.getBalance();
  }

  public sendToAddress = (address: string, amount: number, satPerVbyte?: number): Promise<SentTransaction> => {
    this.logger.info(`Sending ${amount} ${this.symbol} to ${address}`);

    return this.walletProvider.sendToAddress(address, amount, satPerVbyte);
  }

  public sweepWallet = (address: string, satPerVbyte?: number): Promise<SentTransaction> => {
    this.logger.warn(`Sweeping ${this.symbol} wallet to ${address}`);

    return this.walletProvider.sweepWallet(address, satPerVbyte);
  }
}

export default Wallet;
