import fs from 'fs';
import { Network } from 'bitcoinjs-lib';
import { BIP32Interface, fromSeed, fromBase58 } from 'bip32';
import { mnemonicToSeedSync, validateMnemonic } from 'bip39';
import Errors from './Errors';
import Wallet from './Wallet';
import Logger from '../Logger';
import { CurrencyConfig } from '../Config';
import { WalletInfo } from '../consts/Types';
import UtxoRepository from './UtxoRepository';
import { splitDerivationPath } from '../Utils';
import ChainClient from '../chain/ChainClient';
import LndClient from '../lightning/LndClient';
import WalletRepository from './WalletRepository';
import OutputRepository from './OutputRepository';

type Currency = {
  symbol: string;
  network: Network;
  config: CurrencyConfig;
  chainClient: ChainClient;
  lndClient: LndClient;
};

class WalletManager {
  public wallets = new Map<string, Wallet>();

  private masterNode: BIP32Interface;
  private repository: WalletRepository;

  private utxoRepository: UtxoRepository;
  private outputResository: OutputRepository;

  private readonly derivationPath = 'm/0';

  /**
   * WalletManager initiates multiple HD wallets
   */
  constructor(private logger: Logger, private currencies: Currency[], mnemonicPath: string) {
    this.masterNode = fromBase58(this.loadMnemonic(mnemonicPath));

    this.repository = new WalletRepository();
    this.utxoRepository = new UtxoRepository();
    this.outputResository = new OutputRepository();
  }

  /**
   * Initiates a new WalletManager with a mnemonic
   */
  public static fromMnemonic = (logger: Logger, mnemonic: string, mnemonicPath: string, currencies: Currency[]) => {
    if (!validateMnemonic(mnemonic)) {
      throw(Errors.INVALID_MNEMONIC(mnemonic));
    }

    fs.writeFileSync(mnemonicPath, fromSeed(mnemonicToSeedSync(mnemonic)).toBase58());

    return new WalletManager(logger, currencies, mnemonicPath);
  }

  public init = async () => {
    const walletsMap = await this.getWalletsMap();

    for (const currency of this.currencies) {
      let walletInfo = walletsMap.get(currency.symbol);

      const { blocks } = await currency.chainClient.getBlockchainInfo();

      // Generate a new sub-wallet if that currency does not have one yet
      if (!walletInfo) {
        walletInfo = {
          derivationPath: `${this.derivationPath}/${this.getHighestDepthIndex(2, walletsMap) + 1}`,
          highestUsedIndex: 0,
          blockHeight: blocks,
        };

        walletsMap.set(currency.symbol, walletInfo);

        await this.repository.addWallet({
          ...walletInfo,
          blockHeight: 0,
          symbol: currency.symbol,
        });
      }

      const wallet = new Wallet(
        this.logger,
        this.repository,
        this.outputResository,
        this.utxoRepository,
        this.masterNode,
        currency.network,
        currency.chainClient,
        walletInfo.derivationPath,
        walletInfo.highestUsedIndex,
      );

      await wallet.init(walletInfo.blockHeight);

      this.wallets.set(currency.symbol, wallet);
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
        blockHeight: wallet.blockHeight,
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
