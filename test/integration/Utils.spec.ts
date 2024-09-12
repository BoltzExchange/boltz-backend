import { Transaction } from 'bitcoinjs-lib';
import { Transaction as TransactionLiquid } from 'liquidjs-lib';
import {
  calculateLiquidTransactionFee,
  calculateUtxoTransactionFee,
  isTxConfirmed,
} from '../../lib/Utils';
import { bitcoinClient, bitcoinLndClient, elementsClient } from './Nodes';

jest.mock('../../lib/db/repositories/ChainTipRepository');

describe('Utils', () => {
  beforeAll(async () => {
    await Promise.all([
      bitcoinClient.connect(),
      elementsClient.connect(),
      bitcoinLndClient.connect(false),
    ]);

    await Promise.all([bitcoinClient.generate(1), elementsClient.generate(1)]);
  });

  afterAll(() => {
    bitcoinClient.disconnect();
    elementsClient.disconnect();
    bitcoinLndClient.disconnect();
  });

  test('should calculate UTXO transaction fee', async () => {
    const satPerVbyte = 2;
    const txId = await bitcoinClient.sendToAddress(
      await bitcoinClient.getNewAddress(''),
      100000,
      satPerVbyte,
      false,
      '',
    );

    const tx = Transaction.fromHex(await bitcoinClient.getRawTransaction(txId));

    // Leave some buffer for core not doing *exactly* the sat/vbyte we told it to
    const expectedFee = tx.virtualSize() * satPerVbyte;
    await expect(
      calculateUtxoTransactionFee(bitcoinClient, tx),
    ).resolves.toBeGreaterThanOrEqual(expectedFee - 5);
    await expect(
      calculateUtxoTransactionFee(bitcoinClient, tx),
    ).resolves.toBeLessThanOrEqual(expectedFee + 5);
  });

  test('should calculate Liquid transaction fee', async () => {
    const satPerVbyte = 2;
    const txId = await elementsClient.sendToAddress(
      await elementsClient.getNewAddress(''),
      100000,
      satPerVbyte,
      false,
      '',
    );

    const tx = TransactionLiquid.fromHex(
      await elementsClient.getRawTransaction(txId),
    );

    // Leave some buffer for Elements not doing *exactly* the sat/vbyte we told it to
    const expectedFee = tx.virtualSize() * satPerVbyte;
    expect(calculateLiquidTransactionFee(tx)).toBeGreaterThanOrEqual(
      expectedFee - 5,
    );
    expect(calculateLiquidTransactionFee(tx)).toBeLessThanOrEqual(
      expectedFee + 5,
    );
  });

  describe('isTxConfirmed', () => {
    test('should detect when transaction is not confirmed', async () => {
      const tx = await bitcoinClient.getRawTransactionVerbose(
        await bitcoinClient.sendToAddress(
          await bitcoinClient.getNewAddress(''),
          100_000,
          undefined,
          false,
          '',
        ),
      );

      expect(isTxConfirmed(tx)).toEqual(false);
    });

    test('should detect when transaction is confirmed', async () => {
      const txId = await bitcoinClient.sendToAddress(
        await bitcoinClient.getNewAddress(''),
        100_000,
        undefined,
        false,
        '',
      );
      await bitcoinClient.generate(1);
      const tx = await bitcoinClient.getRawTransactionVerbose(txId);

      expect(isTxConfirmed(tx)).toEqual(true);
    });
  });
});
