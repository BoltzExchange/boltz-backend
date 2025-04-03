import type { BIP32Interface } from 'bip32';
import type { Network } from 'bitcoinjs-lib';
import { fromOutputScript, toOutputScript } from '../Core';
import type Logger from '../Logger';
import type { CurrencyType } from '../consts/Enums';
import KeyRepository from '../db/repositories/KeyRepository';
import Errors from './Errors';
import type {
  BalancerFetcher,
  SentTransaction,
  WalletBalance,
} from './providers/WalletProviderInterface';
import type WalletProviderInterface from './providers/WalletProviderInterface';

class Wallet implements BalancerFetcher {
  public readonly symbol: string;

  private derivationPath?: string;
  private highestUsedIndex?: number;
  private masterNode?: BIP32Interface;

  /**
   * Wallet is a hierarchical deterministic wallet for a currency
   */
  constructor(
    protected readonly logger: Logger,
    public type: CurrencyType,
    public walletProvider: WalletProviderInterface,
    public readonly network?: Network,
  ) {
    this.symbol = this.walletProvider.symbol;
  }

  public serviceName = (): string => {
    return this.walletProvider.serviceName();
  };

  /**
   * In case the Wallet should also provide keys and de/encode addresses
   * This is only required (and possible) for UTXO based chains like Bitcoin
   */
  public initKeyProvider = (
    derivationPath: string,
    highestUsedIndex: number,
    masterNode: BIP32Interface,
  ): void => {
    this.derivationPath = derivationPath;
    this.highestUsedIndex = highestUsedIndex;
    this.masterNode = masterNode;
  };

  /**
   * Gets a specific pair of keys
   *
   * @param index index of the keys to get
   */
  public getKeysByIndex = (index: number): BIP32Interface => {
    if (this.masterNode === undefined || this.derivationPath === undefined) {
      throw Errors.NOT_SUPPORTED_BY_WALLET(this.symbol, 'getKeysByIndex');
    }

    const keys = this.masterNode.derivePath(`${this.derivationPath}/${index}`);
    return {
      ...keys,
      publicKey: Buffer.from(keys.publicKey),
      privateKey: Buffer.from(keys.privateKey!),
      sign: (hash: Buffer, lowR?: boolean) =>
        Buffer.from(keys.sign(hash, lowR)),
      signSchnorr: (hash: Buffer) => Buffer.from(keys.signSchnorr(hash)),
    };
  };

  /**
   * Gets a new pair of keys
   */
  public getNewKeys = (): { keys: BIP32Interface; index: number } => {
    if (this.highestUsedIndex === undefined) {
      throw Errors.NOT_SUPPORTED_BY_WALLET(this.symbol, 'getNewKeys');
    }

    this.highestUsedIndex += 1;
    KeyRepository.setHighestUsedIndex(
      this.symbol,
      this.highestUsedIndex,
    ).then();

    return {
      keys: this.getKeysByIndex(this.highestUsedIndex),
      index: this.highestUsedIndex,
    };
  };

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
      return fromOutputScript(this.type, outputScript, this.network);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Ignore invalid addresses
      return '';
    }
  };

  /**
   * Decodes an address
   */
  public decodeAddress = (toDecode: string): Buffer => {
    if (this.network === undefined) {
      throw Errors.NOT_SUPPORTED_BY_WALLET(this.symbol, 'decodeAddress');
    }

    return toOutputScript(this.type, toDecode, this.network);
  };

  public getAddress = (label: string): Promise<string> => {
    return this.walletProvider.getAddress(label);
  };

  public getBalance = (): Promise<WalletBalance> => {
    return this.walletProvider.getBalance();
  };

  public sendToAddress = (
    address: string,
    amount: number,
    satPerVbyte: number | undefined,
    label: string,
  ): Promise<SentTransaction> => {
    this.logger.info(
      `Sending ${amount} ${this.symbol} to ${address} for: ${label}`,
    );

    return this.walletProvider.sendToAddress(
      address,
      amount,
      satPerVbyte,
      label,
    );
  };

  public sweepWallet = (
    address: string,
    satPerVbyte: number | undefined,
    label: string,
  ): Promise<SentTransaction> => {
    this.logger.warn(
      `Sweeping ${this.symbol} wallet to ${address} for: ${label}`,
    );

    return this.walletProvider.sweepWallet(address, satPerVbyte, label);
  };
}

export default Wallet;
