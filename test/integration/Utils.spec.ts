import { randomBytes } from 'crypto';
import { Transaction } from 'bitcoinjs-lib';
import { Transaction as TransactionLiquid } from 'liquidjs-lib';
import { elementsClient, bitcoinClient, bitcoinLndClient } from './Nodes';
import {
  calculateLiquidTransactionFee,
  calculateUtxoTransactionFee,
  decodeInvoice,
  getHexBuffer,
} from '../../lib/Utils';

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

  test('should calculate UTXO transaction fee', async () => {
    const satPerVbyte = 2;
    const txId = await bitcoinClient.sendToAddress(
      await bitcoinClient.getNewAddress(),
      100000,
      satPerVbyte,
    );

    const tx = Transaction.fromHex(await bitcoinClient.getRawTransaction(txId));
    expect(await calculateUtxoTransactionFee(bitcoinClient, tx)).toEqual(
      tx.virtualSize() * satPerVbyte,
    );
  });

  test('should calculate Liquid transaction fee', async () => {
    const satPerVbyte = 2;
    const txId = await elementsClient.sendToAddress(
      await elementsClient.getNewAddress(),
      100000,
      satPerVbyte,
    );

    const tx = TransactionLiquid.fromHex(
      await elementsClient.getRawTransaction(txId),
    );
    expect(calculateLiquidTransactionFee(tx)).toEqual(
      tx.virtualSize() * satPerVbyte,
    );
  });

  test('should decode invoices', async () => {
    const value = 123;
    const cltvExpiry = 140;
    const preimageHash = randomBytes(32);

    const { paymentRequest } = await bitcoinLndClient.addHoldInvoice(
      value,
      preimageHash,
      cltvExpiry,
    );
    const decoded = decodeInvoice(paymentRequest);

    expect(decoded.satoshis).toEqual(value);
    expect(decoded.minFinalCltvExpiry).toEqual(cltvExpiry);
    expect(getHexBuffer(decoded.paymentHash!)).toEqual(preimageHash);
  });

  afterAll(() => {
    bitcoinClient.disconnect();
    elementsClient.disconnect();
    bitcoinLndClient.disconnect();
  });
});
