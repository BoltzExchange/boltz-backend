// tslint:disable:max-line-length

import { expect } from 'chai';
import { Networks } from 'boltz-core';
import { Transaction, address, TxOutput } from 'bitcoinjs-lib';
import { mock, when, instance, anything } from 'ts-mockito';
import { wait } from '../../Utils';
import { getHexString } from '../../../lib/Utils';
import SwapNursery from '../../../lib/swap/SwapNursery';
import ChainClient from '../../../lib/chain/ChainClient';
import LndClient from '../../../lib/lightning/LndClient';
import { Currency } from '../../../lib/wallet/WalletManager';
import EventHandler from '../../../lib/service/EventHandler';

describe('EventHandler', () => {
  let emitTransaction: (transaction: Transaction, confirmed: boolean) => void;

  let emitInvoicePaid: (invoice: string, routingFee: number) => void;
  let emitInvoiceSettled: (invoice: string, preimage: string) => void;
  let emitChannelBackup: (channelBackup: string) => void;

  let emitInvoiceFailedToPay: (invoice: string) => void;
  let emitZeroConfRejected: (invoice: string, reason: string) => void;
  let emitClaim: (lockupTransactionHash: string, lockupVout: number, minerFee: number) => void;
  let emitRefund: (lockupTransactionHash: string, lockupVout: number, minerFee: number) => void;

  const chainMock = mock(ChainClient);
  when(chainMock.on('transaction', anything())).thenCall((_, callback) => {
    emitTransaction = callback;
  });

  const lndMock = mock(LndClient);
  when(lndMock.on('invoice.paid', anything())).thenCall((_, callback) => {
    emitInvoicePaid = callback;
  });
  when(lndMock.on('invoice.settled', anything())).thenCall((_, callback) => {
    emitInvoiceSettled = callback;
  });
  when(lndMock.on('channel.backup', anything())).thenCall((_, callback) => {
    emitChannelBackup = callback;
  });

  const currencyInfo = {
    symbol: 'BTC',
    network: Networks.bitcoinRegtest,
    lndClient: instance(lndMock),
    chainClient: instance(chainMock),
  };

  const nurseryMock = mock(SwapNursery);
  when(nurseryMock.on('claim', anything())).thenCall((_, callback) => {
    emitClaim = callback;
  });
  when(nurseryMock.on('refund', anything())).thenCall((_, callback) => {
    emitRefund = callback;
  });
  when(nurseryMock.on('zeroconf.rejected', anything())).thenCall((_, callback) => {
    emitZeroConfRejected = callback;
  });
  when(nurseryMock.on('invoice.failedToPay', anything())).thenCall((_, callback) => {
    emitInvoiceFailedToPay = callback;
  });

  const invoice = 'lnbcrt10n1pwdascapp5npnx0dvgv327whgudc30vd4fm7ucr496tnxmmjhvp8n9q0n35gvsdqqcqzpg0txj07k5c8rfg9fqmd8xg2d8tl8859up5jru7qwjyf5l0w5el3d8hw78pd60ersuk5nw56f3vzndc5h23rr4jyql6nc0vlqka8yadjgqgsm76m';
  const transaction = Transaction.fromHex('01000000017fa897c3556271c34cb28c03c196c2d912093264c9d293cb4980a2635474467d010000000f5355540b6f93598893578893588851ffffffff01501e0000000000001976a914aa2482ce71d219018ef334f6cc551ee88abd920888ac00000000');

  const eventHandler = new EventHandler(
    new Map<string, Currency>([['BTC', currencyInfo]]),
    instance(nurseryMock),
  );

  it('should handle relevant transactions', async () => {
    const output = transaction.outs[0] as TxOutput;

    const receivedAmount = output.value;
    const expectedAddress = address.fromOutputScript(
      output.script,
      Networks.bitcoinRegtest,
    );

    eventHandler.listenScripts.set(getHexString(output.script), expectedAddress);

    let confirmedEvent = false;
    let unconfirmedEvent = false;

    eventHandler.on('transaction', (listenAddress, transactionId, amountReceived, confirmed) => {
      expect(listenAddress).to.be.equal(expectedAddress);
      expect(amountReceived).to.be.equal(receivedAmount);
      expect(transactionId).to.be.equal(transaction.getId());

      if (confirmed) {
        confirmedEvent = true;
      } else {
        unconfirmedEvent = true;
      }
    });

    emitTransaction(transaction, true);
    emitTransaction(transaction, false);

    await wait(5);

    expect(confirmedEvent).to.be.true;
    expect(unconfirmedEvent).to.be.true;
  });

  it('should ignore irrelevant transactions', async () => {
    eventHandler.listenScripts.clear();

    eventHandler.on('transaction', () => {
      throw Error('should ignore irrelevant transactions');
    });

    emitTransaction(transaction, true);

    await wait(5);
  });

  it('should handle paid invoices', async () => {
    const expectedRoutingFee = 10;
    const expectedInvoice = invoice;

    let event = false;

    eventHandler.on('invoice.paid', (invoice, routingFee) => {
      expect(invoice).to.be.equal(expectedInvoice);
      expect(routingFee).to.be.equal(expectedRoutingFee);

      event = true;
    });

    emitInvoicePaid(expectedInvoice, expectedRoutingFee);

    await wait(5);

    expect(event).to.be.true;
  });

  it('should handle settled invoices', async () => {
    const expectedInvoice = invoice;
    const expectedPreimage = 'preimage';

    let event = false;

    eventHandler.on('invoice.settled', (invoice, preimage) => {
      expect(invoice).to.be.equal(expectedInvoice);
      expect(preimage).to.be.equal(expectedPreimage);

      event = true;
    });

    emitInvoiceSettled(expectedInvoice, expectedPreimage);

    await wait(5);

    expect(event).to.be.true;
  });

  it('should handle invoices that could not be paid', async () => {
    const expectedInvoice = invoice;

    let event = false;

    eventHandler.on('invoice.failedToPay', (invoice) => {
      expect(invoice).to.be.equal(expectedInvoice);

      event = true;
    });

    emitInvoiceFailedToPay(expectedInvoice);

    await wait(5);

    expect(event).to.be.true;
  });

  it('should handle claims', async () => {
    const expectedLockupVout = 0;
    const expectedMinerFee = 2240;
    const expectedLockupTransactionHash = transaction.getId();

    let event = false;

    eventHandler.on('claim', (lockupTransactionHash, lockupVout, minerFee) => {
      expect(minerFee).to.be.equal(expectedMinerFee);
      expect(lockupVout).to.be.equal(expectedLockupVout);
      expect(lockupTransactionHash).to.be.equal(expectedLockupTransactionHash);

      event = true;
    });

    emitClaim(
      expectedLockupTransactionHash,
      expectedLockupVout,
      expectedMinerFee,
    );

    await wait(5);

    expect(event).to.be.true;
  });

  it('should handle rejected 0-conf swap', async () => {
    const expectedInvoice = invoice;
    const expectedReason = 'because of reasons';

    let event = false;

    eventHandler.on('zeroconf.rejected', (invoice, reason) => {
      expect(invoice).to.be.equal(expectedInvoice);
      expect(reason).to.be.equal(expectedReason);

      event = true;
    });

    emitZeroConfRejected(expectedInvoice, expectedReason);

    await wait(5);

    expect(event).to.be.true;
  });

  it('should handle refunds', async () => {
    const expectedLockupVout = 0;
    const expectedMinerFee = 6450;
    const expectedLockupTransactionHash = transaction.getId();

    let event = false;

    eventHandler.on('refund', (lockupTransactionHash, lockupVout, minerFee) => {
      expect(minerFee).to.be.equal(expectedMinerFee);
      expect(lockupVout).to.be.equal(expectedLockupVout);
      expect(lockupTransactionHash).to.be.equal(expectedLockupTransactionHash);

      event = true;
    });

    emitRefund(
      expectedLockupTransactionHash,
      expectedLockupVout,
      expectedMinerFee,
    );

    await wait(5);

    expect(event).to.be.true;
  });

  it('should handle channel backups', async () => {
    const expectedChannelBackup = 'many wonderful channels';

    let event = false;

    eventHandler.on('channel.backup', (currency, channelBackup) => {
      expect(currency).to.be.equal(currencyInfo.symbol);
      expect(channelBackup).to.be.equal(expectedChannelBackup);

      event = true;
    });

    emitChannelBackup(expectedChannelBackup);

    await wait(5);

    expect(event).to.be.true;
  });
});
