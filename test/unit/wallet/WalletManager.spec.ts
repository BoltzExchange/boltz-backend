import fs from 'fs';
import { fromSeed } from 'bip32';
import { Networks } from 'boltz-core';
import { mnemonicToSeedSync, generateMnemonic } from 'bip39';
import Logger from '../../../lib/Logger';
import Database from '../../../lib/db/Database';
import { CurrencyConfig } from '../../../lib/Config';
import WalletErrors from '../../../lib/wallet/Errors';
import ChainClient from '../../../lib/chain/ChainClient';
import LndClient from '../../../lib/lightning/LndClient';
import WalletManager from '../../../lib/wallet/WalletManager';
import WalletRepository from '../../../lib/wallet/WalletRepository';

const blockchainInfo = {
  chain: '',
  blocks: 0,
  headers: 0,
  bestblockhash: '',
  difficulty: 0,
  mediantime: 0,
  verificationprogress: 0,
  initialblockdownload: '',
  chainwork: '',
  size_on_disk: 0,
  pruned: false,
};

jest.mock('../../../lib/chain/ChainClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      on: () => {},
      updateOutputFilter: () => {},
      getBlockchainInfo: () => Promise.resolve(blockchainInfo),
    };
  });
});

const mockedChainClient = <jest.Mock<ChainClient>><any>ChainClient;

jest.mock('../../../lib/lightning/LndClient');

const mockedLndClient = <jest.Mock<LndClient>><any>LndClient;

describe('WalletManager', () => {
  const mnemonicPath = 'seed.dat';

  const mnemonic = generateMnemonic();

  const database = new Database(Logger.disabledLogger, ':memory:');
  const repository = new WalletRepository();

  const btcClient = mockedChainClient();
  btcClient['symbol' as any] = 'BTC';

  const ltcClient = mockedChainClient();
  ltcClient['symbol' as any] = 'LTC';

  const lndClient = mockedLndClient();

  const currencies = [
    {
      lndClient,
      symbol: 'BTC',
      chainClient: btcClient,
      network: Networks.bitcoinRegtest,
      config: {} as any as CurrencyConfig,
    },
    {
      lndClient,
      symbol: 'LTC',
      chainClient: ltcClient,
      network: Networks.litecoinRegtest,
      config: {} as any as CurrencyConfig,
    },
  ];

  let walletManager: WalletManager;

  const cleanUp = () => {
    const deleteFile = (path: string) => {
      if (fs.existsSync(path)) {
        fs.unlinkSync(path);
      }
    };

    deleteFile(mnemonicPath);
  };

  beforeAll(async () => {
    cleanUp();

    await database.init();
  });

  test('should not initialize without seed file', () => {
    expect(() => new WalletManager(Logger.disabledLogger, currencies, mnemonicPath)).toThrow(WalletErrors.NOT_INITIALIZED().message);
  });

  test('should initialize a new wallet for each currency', async () => {
    walletManager = WalletManager.fromMnemonic(Logger.disabledLogger, mnemonic, mnemonicPath, currencies);
    await walletManager.init();

    let index = 0;

    for (const currency of currencies) {
      const wallet = walletManager.wallets.get(currency.symbol);
      expect(wallet).not.toBeUndefined();

      const { derivationPath, highestIndex } = wallet!;

      const dbWallet = await repository.getWallet(currency.symbol);

      // Compare with values in the database
      expect(derivationPath).toEqual(dbWallet!.derivationPath);
      expect(highestIndex).toEqual(dbWallet!.highestUsedIndex);

      // Compare with expected values
      expect(derivationPath).toEqual(`m/0/${index}`);
      expect(highestIndex).toEqual(0);

      index += 1;
    }
  });

  test('should write and read the mnemonic', () => {
    expect(fs.existsSync(mnemonicPath)).toBeTruthy;

    const mnemonicFile = walletManager['loadMnemonic'](mnemonicPath);
    expect(mnemonicFile).toEqual(fromSeed(mnemonicToSeedSync(mnemonic)).toBase58());
  });

  test('should not accept invalid mnemonics', () => {
    const invalidMnemonic = 'invalid';

    expect(() => WalletManager.fromMnemonic(Logger.disabledLogger, invalidMnemonic, '', []))
      .toThrow(WalletErrors.INVALID_MNEMONIC(invalidMnemonic).message);
  });

  afterAll(async () => {
    await database.close();

    cleanUp();
  });
});
