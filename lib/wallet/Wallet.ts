import { Network, address, BIP32Interface } from 'bitcoinjs-lib';
import Errors from './Errors';
import Logger from '../Logger';
import { CurrencyType } from '../consts/Enums';
import KeyRepository from '../db/repositories/KeyRepository';
import WalletProviderInterface, { SentTransaction, WalletBalance } from './providers/WalletProviderInterface';

class Wallet {
  public readonly symbol: string;

  private network?: Network;
  private derivationPath?: string;
  private highestUsedIndex?: number;
  private masterNode?: BIP32Interface;
  private keyRepository?: KeyRepository;

  /**
   * Wallet is a hierarchical deterministic wallet for a currency
   */
  constructor(
    private logger: Logger,
    public type: CurrencyType,
    public walletProvider: WalletProviderInterface,
  ) {
    this.symbol = this.walletProvider.symbol;
  }

  /**
   * In case the Wallet should also provide keys and de/encode addresses
   * This is only required (and possible) for UTXO based chains like Bitcoin
   */
  public initKeyProvider = (
    network: Network,
    derivationPath: string,
    highestUsedIndex: number,
    masterNode: BIP32Interface,
    keyRepository: KeyRepository,
  ): void => {
    this.network = network;
    this.derivationPath = derivationPath;
    this.highestUsedIndex = highestUsedIndex;
    this.masterNode = masterNode;
    this.keyRepository = keyRepository;
  }

  /**
   * Gets a specific pair of keys
   *
   * @param index index of the keys to get
   */
  public getKeysByIndex = (index: number): BIP32Interface => {
    if (this.masterNode === undefined || this.derivationPath === undefined) {
      throw Errors.NOT_SUPPORTED_BY_WALLET(this.symbol, 'getKeysByIndex');
    }

    return this.masterNode.derivePath(`${this.derivationPath}/${index}`);
  }

  /**
   * Gets a new pair of keys
   */
  public getNewKeys = (): { keys: BIP32Interface, index: number } => {
    if (this.highestUsedIndex === undefined || this.keyRepository === undefined) {
      throw Errors.NOT_SUPPORTED_BY_WALLET(this.symbol, 'getNewKeys');
    }

    this.highestUsedIndex += 1;
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
    if (this.network === undefined) {
      throw Errors.NOT_SUPPORTED_BY_WALLET(this.symbol, 'encodeAddress');
    }

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
    if (this.network === undefined) {
      throw Errors.NOT_SUPPORTED_BY_WALLET(this.symbol, 'decodeAddress');
    }

    return address.toOutputScript(
      toDecode,
      this.network,
    );
  }

  public getAddress = (): Promise<string> => {
    return this.walletProvider.getAddress();
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
