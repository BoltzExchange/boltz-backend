import fs from 'fs';
import { providers } from 'ethers';
import { Network } from 'bitcoinjs-lib';
import { BIP32Interface, fromSeed } from 'bip32';
import { mnemonicToSeedSync, validateMnemonic } from 'bip39';
import Errors from './Errors';
import Wallet from './Wallet';
import Logger from '../Logger';
import { splitDerivationPath } from '../Utils';
import ChainClient from '../chain/ChainClient';
import LndClient from '../lightning/LndClient';
import { CurrencyType } from '../consts/Enums';
import KeyRepository from '../db/KeyRepository';
import EthereumManager from './ethereum/EthereumManager';
import ChainTipRepository from '../db/ChainTipRepository';
import { KeyProviderType } from '../db/models/KeyProvider';
import LndWalletProvider from './providers/LndWalletProvider';

type CurrencyLimits = {
  maxSwapAmount: number;
  minSwapAmount: number;

  minWalletBalance: number;

  minLocalBalance?: number;
  minRemoteBalance?: number;

  maxZeroConfAmount?: number;
};

type Currency = {
  symbol: string;
  type: CurrencyType,
  limits: CurrencyLimits;

  // Needed for UTXO based coins
  network?: Network;
  lndClient?: LndClient;
  chainClient?: ChainClient;

  // Needed for Ether and tokens on Ethereum
  provider?: providers.Provider;
};

/**
 * WalletManager creates wallets instances that generate keys derived from the seed and
 * interact with the wallet of LND to send and receive onchain coins
 */
class WalletManager {
  public wallets = new Map<string, Wallet>();

  public ethereumManager?: EthereumManager;

  private mnemonic: string;
  private masterNode: BIP32Interface;
  private keyRepository: KeyRepository;

  private readonly derivationPath = 'm/0';

  constructor(private logger: Logger, mnemonicPath: string, private currencies: Currency[], ethereumManager?: EthereumManager) {
    this.mnemonic = this.loadMnemonic(mnemonicPath);
    this.masterNode = fromSeed(mnemonicToSeedSync(this.mnemonic));

    this.keyRepository = new KeyRepository();

    this.ethereumManager = ethereumManager;
  }

  /**
   * Initializes a new WalletManager with a mnemonic
   */
  public static fromMnemonic = (logger: Logger, mnemonic: string, mnemonicPath: string, currencies: Currency[], ethereumManager?: EthereumManager): WalletManager => {
    if (!validateMnemonic(mnemonic)) {
      throw(Errors.INVALID_MNEMONIC(mnemonic));
    }

    fs.writeFileSync(mnemonicPath, mnemonic);

    return new WalletManager(logger, mnemonicPath, currencies, ethereumManager);
  }

  public init = async (chainTipRepository: ChainTipRepository): Promise<void> => {
    const keyProviderMap = await this.getKeyProviderMap();

    for (const currency of this.currencies) {
      if (currency.type !== CurrencyType.BitcoinLike) {
        continue;
      }

      // The LND client is also used as onchain wallet for UTXO based chains
      if (currency.lndClient === undefined) {
        throw Errors.LND_NOT_FOUND(currency.symbol);
      }

      let keyProviderInfo = keyProviderMap.get(currency.symbol);

      // Generate a new KeyProvider if that currency does not have one yet
      if (!keyProviderInfo) {
        keyProviderInfo = {
          highestUsedIndex: 0,
          symbol: currency.symbol,
          derivationPath: `${this.derivationPath}/${this.getHighestDepthIndex(keyProviderMap, 2) + 1}`,
        };

        keyProviderMap.set(currency.symbol, keyProviderInfo);

        await this.keyRepository.addKeyProvider({
          ...keyProviderInfo,
          symbol: currency.symbol,
        });
      }

      const wallet = new Wallet(
        this.logger,
        new LndWalletProvider(this.logger, currency.lndClient, currency.chainClient!),
      );

      wallet.initKeyProvider(
        currency.network!,
        keyProviderInfo.derivationPath,
        keyProviderInfo.highestUsedIndex,
        this.masterNode,
        this.keyRepository,
      );

      this.wallets.set(currency.symbol, wallet);
    }

    if (this.ethereumManager) {
      const ethereumWallets = await this.ethereumManager.init(this.mnemonic, chainTipRepository);

      for (const [symbol, ethereumWallet] of ethereumWallets) {
        this.wallets.set(symbol, ethereumWallet);
      }
    }
  }

  private loadMnemonic = (filename: string) => {
    if (fs.existsSync(filename)) {
      return fs.readFileSync(filename, 'utf-8').trim();
    }

    throw(Errors.NOT_INITIALIZED());
  }

  private getKeyProviderMap = async () => {
    const map = new Map<string, KeyProviderType>();
    const keyProviders = await this.keyRepository.getKeyProviders();

    keyProviders.forEach((keyProvider) => {
      map.set(keyProvider.symbol, {
        symbol: keyProvider.symbol,
        derivationPath: keyProvider.derivationPath,
        highestUsedIndex: keyProvider.highestUsedIndex,
      });
    });

    return map;
  }

  private getHighestDepthIndex = (map: Map<string, KeyProviderType>, depth: number): number => {
    if (depth === 0) {
      throw(Errors.INVALID_DEPTH_INDEX(depth));
    }

    let highestIndex = -1;

    map.forEach((info) => {
      const split = splitDerivationPath(info.derivationPath);
      const index = split.sub[depth - 1];

      if (index > highestIndex) {
        highestIndex = index;
      }
    });

    return highestIndex;
  }
}

export default WalletManager;
export { Currency };
