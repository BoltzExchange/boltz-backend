import fs from 'fs';
import { Networks } from 'boltz-core';
import { generateMnemonic } from 'bip39';
import Logger from '../../../lib/Logger';
import Database from '../../../lib/db/Database';
import { CurrencyConfig } from '../../../lib/Config';
import WalletErrors from '../../../lib/wallet/Errors';
import ChainClient from '../../../lib/chain/ChainClient';
import LndClient from '../../../lib/lightning/LndClient';
import KeyRepository from '../../../lib/db/KeyRepository';
import WalletManager, { Currency } from '../../../lib/wallet/WalletManager';

const symbol = 'BTC';

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
      symbol,

      getBlockchainInfo: () => Promise.resolve(blockchainInfo),
    };
  });
});

const mockedChainClient = <jest.Mock<ChainClient>><any>ChainClient;

jest.mock('../../../lib/lightning/LndClient', () => {
  return jest.fn().mockImplementation(() => {
    return {};
  });
});

const mockedLndClient = <jest.Mock<LndClient>><any>LndClient;

// TODO: test ethereum wallet initialization
describe('WalletManager', () => {
  const mnemonicPath = 'seed.dat';

  const mnemonic = generateMnemonic();

  const database = new Database(Logger.disabledLogger, ':memory:');
  const repository = new KeyRepository();

  const btcClient = mockedChainClient();
  btcClient['symbol' as any] = 'BTC';

  const ltcClient = mockedChainClient();
  ltcClient['symbol' as any] = 'LTC';

  const lndClient = mockedLndClient();

  const currencies: Currency[] = [
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

  const ethereumConfig = {
    tokens: [],
    providerEndpoint: '',
  };

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
    expect(() => new WalletManager(Logger.disabledLogger, mnemonicPath, currencies, ethereumConfig)).toThrow(WalletErrors.NOT_INITIALIZED().message);
  });

  test('should initialize with a new menmonic and write it to the disk', () => {
    WalletManager.fromMnemonic(Logger.disabledLogger, mnemonic, mnemonicPath, currencies, ethereumConfig);

    expect(fs.existsSync(mnemonicPath)).toBeTruthy();
  });

  test('should not initialize when a required LND cannot be found', async () => {
    const currenciesNoLnd: Currency[] = [
      {
        ...currencies[0],
        lndClient: undefined,
      },
    ];

    const nowLndWalletManager = new WalletManager(Logger.disabledLogger, mnemonicPath, currenciesNoLnd, ethereumConfig);

    await expect(nowLndWalletManager.init()).rejects.toEqual(WalletErrors.LND_NOT_FOUND(currenciesNoLnd[0].symbol));
  });

  test('should initialize with an existing mnemonic', async () => {
    walletManager = new WalletManager(Logger.disabledLogger, mnemonicPath, currencies, ethereumConfig);
    await walletManager.init();

    expect(walletManager.ethereumWallet).toBeUndefined();
  });

  test('should initialize a new wallet for each currency', async () => {
    let index = 0;

    for (const currency of currencies) {
      const wallet = walletManager.wallets.get(currency.symbol);
      expect(wallet).not.toBeUndefined();

      const { derivationPath, highestUsedIndex } = wallet!;

      const keyProvider = await repository.getKeyProvider(currency.symbol);

      // Compare with values in the database
      expect(derivationPath).toEqual(keyProvider!.derivationPath);
      expect(highestUsedIndex).toEqual(keyProvider!.highestUsedIndex);

      // Compare with expected values
      expect(derivationPath).toEqual(`m/0/${index}`);
      expect(highestUsedIndex).toEqual(0);

      index += 1;
    }
  });

  test('should write and read the mnemonic', () => {
    const mnemonicFile = walletManager['loadMenmonic'](mnemonicPath);
    expect(mnemonicFile).toEqual(mnemonic);
  });

  test('should not accept invalid mnemonics', () => {
    const invalidMnemonic = 'invalid';

    expect(() => WalletManager.fromMnemonic(Logger.disabledLogger, invalidMnemonic, '', [], ethereumConfig))
      .toThrow(WalletErrors.INVALID_MNEMONIC(invalidMnemonic).message);
  });

  afterAll(async () => {
    await database.close();

    cleanUp();
  });
});
