import path from 'path';
import bip39 from 'bip39';
import bip32 from 'bip32';
import Logger from '../../../lib/Logger';
import DataBase from '../../../lib/db/Database';
import WalletManager, { Currency } from '../../../lib/wallet/WalletManager';
import SwapManager from '../../../lib/swap/SwapManager';
import { Networks } from 'boltz-core';
import { litecoinClient, bitcoinClient } from '../chain/ChainClient.spec';
import LndClient from '../../../lib/lightning/LndClient';

describe('Swap Manager', () => {
  const currencies: Currency[] = [
    {
      symbol: 'LTC',
      network: Networks.litecoinRegtest,
      chainClient: litecoinClient,
      lndClient: litecoinLNDClient,
    },
    {
      symbol: 'BTC',
      network: Networks.bitcoinRegtest,
      chainClient: bitcoinClient,
      lndClient: bitcoinLNDClient,
    },
  ];
  const dataBase = new DataBase(Logger.disabledLogger, ':memory:');

  let walletManager: WalletManager;
  let swapManager: SwapManager;
  before(async () => {
    const mnemonic = bip39.generateMnemonic();
    const mnemonicBase58 = bip32.fromSeed(bip39.mnemonicToSeed(mnemonic)).toBase58();
    await dataBase.init();
    walletManager = new WalletManager(Logger.disabledLogger, currencies, dataBase, mnemonicBase58, true);
    await walletManager.init();
    swapManager = new SwapManager(Logger.disabledLogger, walletManager, currencies);
  });

  it('has currencies', () => {
    console.log(swapManager.currencies.has('BTC'));
  });

  it('create swap', async () => {
    console.log('create swap');
  });

  it('create reverse swap', async () => {
    console.log('create reverse swap');
  });
});

const certpath = path.join('docker', 'regtest', 'data', 'lnd', 'certificates', 'tls.cert');
const macaroonpath = path.join('docker', 'regtest', 'data', 'lnd', 'macaroons', 'admin.macaroon');

export const litecoinLNDClient = new LndClient(Logger.disabledLogger, {
  certpath,
  macaroonpath,
  host: '127.0.0.1',
  port: 11009,
}, 'LTC');

export const bitcoinLNDClient = new LndClient(Logger.disabledLogger, {
  certpath,
  macaroonpath,
  host: '127.0.0.1',
  port: 10009,
}, 'BTC');
