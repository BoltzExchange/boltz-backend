import fs from 'fs';
import bip32, { BIP32 } from 'bip32';
import bip39 from 'bip39';
import Errors from './Errors';
import Wallet from './Wallet';
import { splitDerivationPath } from '../Utils';
import { Network } from 'bitcoinjs-lib';
import Logger from '../Logger';
import ChainClient from '../chain/ChainClient';
import LndClient from '../lightning/LndClient';
import Database from '../db/Database';
import WalletRepository from './WalletRepository';
import { WalletFactory } from '../consts/Database';
import { WalletInfo } from '../consts/Types';
import UtxoRepository from './UtxoRepository';

type Currency = {
  symbol: string;
  network: Network;
  chainClient: ChainClient;
  lndClient: LndClient;
};

// TODO: recovery with existing mnemonic
class WalletManager {
  public wallets = new Map<string, Wallet>();

  private masterNode: BIP32;
  private repository: WalletRepository;

  private utxoRepository: UtxoRepository;

  // TODO: support for BIP44
  private readonly derivationPath = 'm/0';

  /**
   * WalletManager initiates multiple HD wallets
   */
  constructor(private logger: Logger, private currencies: Currency[], db: Database, mnemonicPath: string) {
    this.masterNode = bip32.fromBase58(this.loadMnemonic(mnemonicPath));

    this.repository = new WalletRepository(db.models);
    this.utxoRepository = new UtxoRepository(db.models);
  }

  /**
   * Initiates a new WalletManager with a mnemonic
   */
  public static fromMnemonic = (logger: Logger, mnemonic: string, mnemonicPath: string, currencies: Currency[], db: Database) => {
    if (!bip39.validateMnemonic(mnemonic)) {
      throw(Errors.INVALID_MNEMONIC(mnemonic));
    }

    fs.writeFileSync(mnemonicPath, bip32.fromSeed(bip39.mnemonicToSeed(mnemonic)).toBase58());

    return new WalletManager(logger, currencies, db, mnemonicPath);
  }

  public init = async () => {
    const walletsToAdd: WalletFactory[] = [];
    const walletsMap = await this.getWalletsMap();

    this.currencies.forEach((currency) => {
      let walletInfo = walletsMap.get(currency.symbol);

      // Generate a new sub wallet if it doesn't exist
      if (!walletInfo) {
        walletInfo = {
          derivationPath: `${this.derivationPath}/${this.getHighestDepthIndex(2, walletsMap) + 1}`,
          highestUsedIndex: 0,
        };

        walletsMap.set(currency.symbol, walletInfo);
        walletsToAdd.push({ symbol: currency.symbol, ...walletInfo });
      }

      this.wallets.set(currency.symbol, new Wallet(
        this.logger,
        this.repository,
        this.utxoRepository,
        this.masterNode,
        currency.network,
        currency.chainClient,
        walletInfo.derivationPath,
        walletInfo.highestUsedIndex,
      ));
    });

    if (walletsToAdd.length !== 0) {
      await this.repository.addWallets(walletsToAdd);
    }
  }

  private loadMnemonic = (filename: string): string => {
    if (fs.existsSync(filename)) {
      return fs.readFileSync(filename, 'utf-8');
    }

    throw(Errors.NOT_INITIALIZED());
  }

  private getWalletsMap = async() => {
    const map = new Map<string, WalletInfo>();
    const wallets = await this.repository.getWallets();

    wallets.forEach((wallet) => {
      map.set(wallet.symbol, {
        derivationPath: wallet.derivationPath,
        highestUsedIndex: wallet.highestUsedIndex,
      });
    });

    return map;
  }

  private getHighestDepthIndex = (depth: number, map: Map<string, WalletInfo>): number => {
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
