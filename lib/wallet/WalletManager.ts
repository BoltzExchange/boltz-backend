import fs from 'fs';
import { Provider } from 'ethers';
import * as ecc from 'tiny-secp256k1';
import { Network } from 'bitcoinjs-lib';
import BIP32Factory, { BIP32Interface } from 'bip32';
import { SLIP77Factory, Slip77Interface } from 'slip77';
import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from 'bip39';
import Errors from './Errors';
import Wallet from './Wallet';
import Logger from '../Logger';
import WalletLiquid from './WalletLiquid';
import { CurrencyConfig } from '../Config';
import { splitDerivationPath } from '../Utils';
import ChainClient from '../chain/ChainClient';
import { CurrencyType } from '../consts/Enums';
import ClnClient from '../lightning/ClnClient';
import LndClient from '../lightning/LndClient';
import ElementsClient from 'lib/chain/ElementsClient';
import EthereumManager from './ethereum/EthereumManager';
import { KeyProviderType } from '../db/models/KeyProvider';
import KeyRepository from '../db/repositories/KeyRepository';
import LndWalletProvider from './providers/LndWalletProvider';
import CoreWalletProvider from './providers/CoreWalletProvider';
import ElementsWalletProvider from './providers/ElementsWalletProvider';
import WalletProviderInterface from './providers/WalletProviderInterface';

type CurrencyLimits = {
  minWalletBalance: number;

  minLocalBalance?: number;
  minRemoteBalance?: number;

  maxZeroConfAmount?: number;
};

type Currency = {
  symbol: string;
  type: CurrencyType;
  limits: CurrencyLimits;

  // Needed for UTXO based coins
  network?: Network;
  lndClient?: LndClient;
  clnClient?: ClnClient;
  chainClient?: ChainClient;

  // Needed for Ether and tokens on Ethereum
  provider?: Provider;
};

const bip32 = BIP32Factory(ecc);
const slip77 = SLIP77Factory(ecc);

/**
 * WalletManager creates wallets instances that generate keys derived from the seed and
 * interact with the wallet of LND to send and receive onchain coins
 */
class WalletManager {
  public wallets = new Map<string, Wallet>();

  private readonly mnemonic: string;
  private readonly slip77: Slip77Interface;
  private readonly masterNode: BIP32Interface;

  private readonly derivationPath = 'm/0';

  constructor(
    private logger: Logger,
    mnemonicPath: string,
    private currencies: Currency[],
    public ethereumManagers: EthereumManager[],
  ) {
    if (!fs.existsSync(mnemonicPath)) {
      this.logger.info('Generated new mnemonic');

      fs.writeFileSync(mnemonicPath, generateMnemonic());
    }

    this.mnemonic = this.loadMnemonic(mnemonicPath);
    this.masterNode = bip32.fromSeed(mnemonicToSeedSync(this.mnemonic));
    this.slip77 = slip77.fromSeed(this.mnemonic);
  }

  public init = async (configCurrencies: CurrencyConfig[]): Promise<void> => {
    const keyProviderMap = await this.getKeyProviderMap();

    for (const currency of this.currencies) {
      if (
        currency.type !== CurrencyType.BitcoinLike &&
        currency.type !== CurrencyType.Liquid
      ) {
        continue;
      }

      let walletProvider: WalletProviderInterface | undefined = undefined;

      // The LND client is also used as onchain wallet for UTXO based chains if available
      if (
        configCurrencies.find((config) => config.symbol === currency.symbol)
          ?.preferredWallet !== 'core' &&
        currency.lndClient
      ) {
        walletProvider = new LndWalletProvider(
          this.logger,
          currency.lndClient,
          currency.chainClient!,
        );
      } else {
        // Else the Bitcoin Core wallet is used
        if (currency.type === CurrencyType.BitcoinLike) {
          walletProvider = new CoreWalletProvider(
            this.logger,
            currency.chainClient!,
          );
        } else {
          walletProvider = new ElementsWalletProvider(
            this.logger,
            currency.chainClient! as ElementsClient,
          );
        }

        // Sanity check that wallet support is compiled in
        try {
          await walletProvider.getBalance();
        } catch (error) {
          // No wallet support is compiled in
          if ((error as any).message === 'Method not found') {
            throw Errors.NO_WALLET_SUPPORT(currency.symbol);
          } else {
            throw error;
          }
        }
      }

      let keyProviderInfo = keyProviderMap.get(currency.symbol);

      // Generate a new KeyProvider if that currency does not have one yet
      if (!keyProviderInfo) {
        keyProviderInfo = {
          highestUsedIndex: 0,
          symbol: currency.symbol,
          derivationPath: `${this.derivationPath}/${
            this.getHighestDepthIndex(keyProviderMap, 2) + 1
          }`,
        };

        keyProviderMap.set(currency.symbol, keyProviderInfo);

        await KeyRepository.addKeyProvider({
          ...keyProviderInfo,
          symbol: currency.symbol,
        });
      }

      const wallet =
        currency.type !== CurrencyType.Liquid
          ? new Wallet(this.logger, currency.type, walletProvider)
          : new WalletLiquid(this.logger, walletProvider, this.slip77);

      wallet.initKeyProvider(
        currency.network!,
        keyProviderInfo.derivationPath,
        keyProviderInfo.highestUsedIndex,
        this.masterNode,
      );

      this.wallets.set(currency.symbol, wallet);
    }

    for (const manager of this.ethereumManagers) {
      const ethereumWallets = await manager.init(this.mnemonic);

      for (const [symbol, ethereumWallet] of ethereumWallets) {
        this.wallets.set(symbol, ethereumWallet);
      }
    }
  };

  private loadMnemonic = (filename: string) => {
    if (!fs.existsSync(filename)) {
      throw Errors.NOT_INITIALIZED();
    }

    const mnemonic = fs.readFileSync(filename, 'utf-8').trim();
    if (!validateMnemonic(mnemonic)) {
      throw Errors.INVALID_MNEMONIC(mnemonic);
    }

    return mnemonic;
  };

  private getKeyProviderMap = async () => {
    const map = new Map<string, KeyProviderType>();
    const keyProviders = await KeyRepository.getKeyProviders();

    keyProviders.forEach((keyProvider) => {
      map.set(keyProvider.symbol, {
        symbol: keyProvider.symbol,
        derivationPath: keyProvider.derivationPath,
        highestUsedIndex: keyProvider.highestUsedIndex,
      });
    });

    return map;
  };

  private getHighestDepthIndex = (
    map: Map<string, KeyProviderType>,
    depth: number,
  ): number => {
    if (depth === 0) {
      throw Errors.INVALID_DEPTH_INDEX(depth);
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
  };
}

export default WalletManager;
export { Currency };
