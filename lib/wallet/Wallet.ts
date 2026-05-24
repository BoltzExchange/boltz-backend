import type { HDKey } from '@scure/bip32';
import type { Network as LiquidNetwork } from 'liquidjs-lib/src/networks';
import {
  addressFromOutputScript,
  outputScriptFromAddress,
} from '../AddressUtils';
import type Logger from '../Logger';
import type { BitcoinNetwork } from '../consts/BitcoinNetworks';
import type { CurrencyType } from '../consts/Enums';
import KeyRepository from '../db/repositories/KeyRepository';
import type Sidecar from '../sidecar/Sidecar';
import Errors from './Errors';
import type {
  BalancerFetcher,
  SentTransaction,
  WalletBalance,
} from './providers/WalletProviderInterface';
import type WalletProviderInterface from './providers/WalletProviderInterface';

export type WalletKeys = {
  publicKey: Buffer;
  privateKey: Buffer;
};

class Wallet implements BalancerFetcher {
  public readonly symbol: string;

  private derivationPath?: string;
  private masterNode?: HDKey;

  /**
   * Wallet is a hierarchical deterministic wallet for a currency
   */
  constructor(
    protected readonly logger: Logger,
    public type: CurrencyType,
    public walletProvider: WalletProviderInterface,
    public readonly network?: BitcoinNetwork | LiquidNetwork,
    public readonly sidecar?: Sidecar,
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
    masterNode: HDKey,
  ): void => {
    this.derivationPath = derivationPath;
    this.masterNode = masterNode;
  };

  /**
   * Gets a specific pair of keys
   *
   * @param index index of the keys to get
   */
  public getKeysByIndex = (index: number): WalletKeys => {
    if (this.masterNode === undefined || this.derivationPath === undefined) {
      throw Errors.NOT_SUPPORTED_BY_WALLET(this.symbol, 'getKeysByIndex');
    }

    const node = this.masterNode.derive(`${this.derivationPath}/${index}`);
    return {
      publicKey: Buffer.from(node.publicKey!),
      privateKey: Buffer.from(node.privateKey!),
    };
  };

  /**
   * Gets a new pair of keys
   */
  public getNewKeys = async (): Promise<{
    keys: WalletKeys;
    index: number;
  }> => {
    const index = await KeyRepository.incrementHighestUsedIndex(this.symbol);
    if (index === undefined) {
      throw Errors.NOT_SUPPORTED_BY_WALLET(this.symbol, 'getNewKeys');
    }

    return {
      keys: this.getKeysByIndex(index),
      index: index,
    };
  };

  /**
   * Encodes an address
   *
   * @param outputScript the output script to encode
   */
  public encodeAddress = async (outputScript: Buffer): Promise<string> => {
    if (this.network === undefined) {
      throw Errors.NOT_SUPPORTED_BY_WALLET(this.symbol, 'encodeAddress');
    }

    try {
      return await addressFromOutputScript(
        this.type,
        outputScript,
        this.network,
        undefined,
        this.sidecar,
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Ignore invalid addresses
      return '';
    }
  };

  /**
   * Decodes an address
   */
  public decodeAddress = (toDecode: string): Promise<Buffer> => {
    if (this.network === undefined) {
      throw Errors.NOT_SUPPORTED_BY_WALLET(this.symbol, 'decodeAddress');
    }

    return outputScriptFromAddress(
      this.type,
      toDecode,
      this.network,
      this.sidecar,
    );
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
