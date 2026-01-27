import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
import { Transaction, networks } from 'liquidjs-lib';
import { SLIP77Factory } from 'slip77';
import * as ecc from 'tiny-secp256k1';
import type { UnblindedOutput } from '../../../lib/Core';
import { setup } from '../../../lib/Core';
import Logger from '../../../lib/Logger';
import { getHexBuffer } from '../../../lib/Utils';
import ElementsClient from '../../../lib/chain/ElementsClient';
import ElementsService from '../../../lib/service/ElementsService';
import Errors from '../../../lib/service/Errors';
import type Wallet from '../../../lib/wallet/Wallet';
import WalletLiquid from '../../../lib/wallet/WalletLiquid';
import type { Currency } from '../../../lib/wallet/WalletManager';
import type WalletManager from '../../../lib/wallet/WalletManager';
import ElementsWalletProvider from '../../../lib/wallet/providers/ElementsWalletProvider';
import { bitcoinClient, elementsClient } from '../Nodes';

jest.mock('../../../lib/db/repositories/ChainTipRepository');

const slip77 = SLIP77Factory(ecc);

describe('ElementsService', () => {
  const wallet = new WalletLiquid(
    Logger.disabledLogger,
    new ElementsWalletProvider(Logger.disabledLogger, elementsClient),
    slip77.fromSeed(mnemonicToSeedSync(generateMnemonic())),
    networks.regtest,
  );

  const es = new ElementsService(
    new Map<string, Currency>([
      [
        ElementsClient.symbol,
        {
          chainClient: elementsClient,
        } as unknown as Currency,
      ],
    ]),
    {
      wallets: new Map<string, Wallet>([[ElementsClient.symbol, wallet]]),
    } as unknown as WalletManager,
  );

  beforeAll(async () => {
    await setup();
    await Promise.all(
      [bitcoinClient, elementsClient].map((c) => c.generate(1)),
    );
  });

  afterAll(() => {
    [bitcoinClient, elementsClient].map((client) => client.disconnect());
  });

  test('should unblind outputs that were blinded by known keys', async () => {
    const script = wallet.decodeAddress(await wallet.getAddress(''));
    const address = wallet.encodeAddress(script);
    const amount = 100_000;

    const tx = Transaction.fromHex(
      await elementsClient.getRawTransaction(
        await elementsClient.sendToAddress(
          address,
          amount,
          undefined,
          false,
          '',
        ),
      ),
    );

    const unblinded = await es.unblindOutputs(tx);

    expect(unblinded.every((out) => out.isLbtc)).toEqual(true);
    expect(unblinded.every((out) => out.value > 0)).toEqual(true);
    expect(
      unblinded.every((out) =>
        out.asset.equals(getHexBuffer(networks.regtest.assetHash)),
      ),
    ).toEqual(true);

    const output = unblinded.find((out) => out.script.equals(script))!;
    expect(output).not.toBeUndefined();
    expect(output.value).toEqual(amount);
  });

  test('should unblind outputs that were blinded by unknown keys', async () => {
    const secondWallet = new WalletLiquid(
      Logger.disabledLogger,
      new ElementsWalletProvider(Logger.disabledLogger, elementsClient),
      slip77.fromSeed(mnemonicToSeedSync(generateMnemonic())),
      networks.regtest,
    );

    const script = secondWallet.decodeAddress(
      await secondWallet.getAddress(''),
    );
    const address = secondWallet.encodeAddress(script);

    const tx = Transaction.fromHex(
      await elementsClient.getRawTransaction(
        await elementsClient.sendToAddress(
          address,
          50_000,
          undefined,
          false,
          '',
        ),
      ),
    );

    const unblinded = await es.unblindOutputs(tx);

    const isAddress = (out: UnblindedOutput) => out.script.equals(script);

    expect(
      unblinded.filter((out) => !isAddress(out)).every((out) => out.isLbtc),
    ).toEqual(true);
    expect(
      unblinded
        .filter((out) => !isAddress(out))
        .every((out) =>
          out.asset.equals(getHexBuffer(networks.regtest.assetHash)),
        ),
    ).toEqual(true);
    expect(
      unblinded.filter((out) => !isAddress(out)).every((out) => out.value > 0),
    ).toEqual(true);

    const output = unblinded.find(isAddress)!;
    expect(output).not.toBeUndefined();
    expect(output.value).toEqual(0);
    expect(output.isLbtc).toEqual(false);
    expect(output.asset).not.toEqual(getHexBuffer(networks.regtest.assetHash));
  });

  test('should unblind outputs by transactions id', async () => {
    const txId = await elementsClient.sendToAddress(
      await wallet.getAddress(''),
      50_000,
      undefined,
      false,
      '',
    );
    const tx = Transaction.fromHex(
      await elementsClient.getRawTransaction(txId),
    );

    expect(await es.unblindOutputsFromId(txId)).toEqual(
      await es.unblindOutputs(tx),
    );
  });

  test.each`
    address
    ${'ert1qthfavjaamvpnav05klwgmtvg68qhq45daxn9hd'}
    ${'el1qqwts7wxqn32rv9jdp86dr06q5y6keuxkjgdjmpn8x50jfepgspvwlw7hzcr33r9mf0yees30g2r8mrvpnn73qya0jqg3za6hu'}
  `('should derive blinding keys for $address', ({ address }) => {
    const script = wallet.decodeAddress(address);
    const { publicKey, privateKey } = wallet['slip77'].derive(script);

    expect(es.deriveBlindingKeys(address)).toEqual({
      publicKey,
      privateKey,
    });
  });

  test('should get Elements clients', () => {
    expect(es['getElementsClients']()).toEqual({
      chainClient: elementsClient,
      wallet: es['walletManager'].wallets.get(ElementsClient.symbol),
    });
  });

  test('should throw when Elements currency is not set', () => {
    const temp = es['currencies'];
    es['currencies'] = new Map<string, any>();

    expect(() => es['getElementsClients']()).toThrow(
      Errors.CURRENCY_NOT_FOUND(ElementsClient.symbol).message,
    );

    es['currencies'] = temp;
  });

  test('should throw when Elements wallet is not set', () => {
    const temp = es['walletManager'].wallets;
    es['walletManager'].wallets = new Map<string, any>();

    expect(() => es['getElementsClients']()).toThrow(
      Errors.CURRENCY_NOT_FOUND(ElementsClient.symbol).message,
    );

    es['walletManager'].wallets = temp;
  });
});
