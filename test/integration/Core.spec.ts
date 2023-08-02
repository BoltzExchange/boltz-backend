import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import { SLIP77Factory } from 'slip77';
import { Networks } from 'boltz-core';
import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
import { networks, Transaction as TransactionLiquid } from 'liquidjs-lib';
import Logger from '../../lib/Logger';
import Database from '../../lib/db/Database';
import Wallet from '../../lib/wallet/Wallet';
import { CurrencyType } from '../../lib/consts/Enums';
import { bitcoinClient, elementsClient } from './Nodes';
import WalletLiquid from '../../lib/wallet/WalletLiquid';
import CoreWalletProvider from '../../lib/wallet/providers/CoreWalletProvider';
import ElementsWalletProvider from '../../lib/wallet/providers/ElementsWalletProvider';
import {
  fromOutputScript,
  getOutputValue,
  setup,
  toOutputScript,
} from '../../lib/Core';

describe('Core', () => {
  const bip32 = BIP32Factory(ecc);
  const slip77 = SLIP77Factory(ecc);

  const database = new Database(Logger.disabledLogger, ':memory:');

  let wallet: Wallet;
  let walletLiquid: WalletLiquid;

  beforeAll(async () => {
    await Promise.all([setup(), database.init()]);

    const initWallet = (w: Wallet, network: any) => {
      w.initKeyProvider(
        network,
        'm/0/0',
        0,
        bip32.fromSeed(mnemonicToSeedSync(generateMnemonic())),
      );
    };

    wallet = new Wallet(
      Logger.disabledLogger,
      CurrencyType.BitcoinLike,
      new CoreWalletProvider(Logger.disabledLogger, bitcoinClient),
    );
    initWallet(wallet, Networks.bitcoinRegtest);

    walletLiquid = new WalletLiquid(
      Logger.disabledLogger,
      new ElementsWalletProvider(Logger.disabledLogger, elementsClient),
      slip77.fromSeed(generateMnemonic()),
    );
    initWallet(walletLiquid, networks.regtest);

    await bitcoinClient.connect();
    await elementsClient.connect();

    // To have a blinded output in the Elements wallet
    await elementsClient.sendToAddress(
      await elementsClient.getNewAddress(),
      10 ** 8,
    );

    await Promise.all([bitcoinClient.generate(1), elementsClient.generate(1)]);
  });

  afterAll(async () => {
    await Promise.all([bitcoinClient.generate(1), elementsClient.generate(1)]);

    bitcoinClient.disconnect();
    elementsClient.disconnect();
  });

  test('should get output value of Bitcoin transactions', async () => {
    const outputAmount = 420234;
    const { transaction, vout } = await wallet.sendToAddress(
      await wallet.getAddress(),
      outputAmount,
    );

    expect(getOutputValue(wallet, transaction!.outs[vout!])).toEqual(
      outputAmount,
    );
  });

  test('should get output value of unblinded Liquid transactions', async () => {
    const outputAmount = 562312;
    const { transaction, vout } = await walletLiquid.sendToAddress(
      fromOutputScript(
        CurrencyType.Liquid,
        toOutputScript(
          CurrencyType.Liquid,
          await walletLiquid.getAddress(),
          networks.regtest,
        ),
        networks.regtest,
      ),
      outputAmount,
    );

    expect(
      getOutputValue(
        walletLiquid,
        (transaction as TransactionLiquid).outs[vout!],
      ),
    ).toEqual(outputAmount);

    // Wrong asset
    walletLiquid['network'] = networks.liquid;
    expect(
      getOutputValue(
        walletLiquid,
        (transaction as TransactionLiquid).outs[vout!],
      ),
    ).toEqual(0);
    walletLiquid['network'] = networks.regtest;
  });

  test('should get output value of blinded Liquid transactions', async () => {
    const script = toOutputScript(
      CurrencyType.Liquid,
      await walletLiquid.getAddress(),
      walletLiquid.network,
    );

    const outputAmount = 1245412;
    const { transaction, vout } = await walletLiquid.sendToAddress(
      walletLiquid.encodeAddress(script),
      outputAmount,
    );

    expect(
      getOutputValue(
        walletLiquid,
        (transaction as TransactionLiquid).outs[vout!],
      ),
    ).toEqual(outputAmount);

    // Wrong asset
    walletLiquid['network'] = networks.liquid;
    expect(
      getOutputValue(
        walletLiquid,
        (transaction as TransactionLiquid).outs[vout!],
      ),
    ).toEqual(0);
    walletLiquid['network'] = networks.regtest;
  });
});
