import { Transaction } from 'bitcoinjs-lib';
import { OutputType, Networks } from 'boltz-core';
import Logger from '../../../lib/Logger';
import { generateAddress } from '../../Utils';
import Swap from '../../../lib/db/models/Swap';
import SwapNursery from '../../../lib/swap/SwapNursery';
import LndClient from '../../../lib/lightning/LndClient';
import { SwapUpdateEvent } from '../../../lib/consts/Enums';
import EventHandler from '../../../lib/service/EventHandler';
import { Currency } from '../../../lib/wallet/WalletManager';
import ReverseSwap from '../../../lib/db/models/ReverseSwap';
import ChannelCreation from '../../../lib/db/models/ChannelCreation';

type channelBackupCallback = (channelBackup: string) => void;

type claimCallback = (swap: Swap) => void;
type invoicePaidCallback = (swap: Swap) => void;
type invoiceFailedCallback = (swap: Swap) => void;
type invoicePendingCallback = (swap: Swap) => void;
type refundCallback = (reverseSwap: ReverseSwap) => void;
type minerfeePaidCallback = (reverseSwap: ReverseSwap) => void;
type invoiceSettledCallback = (reverseSwap: ReverseSwap) => void;
type coinsFailedToSendCallback = (reverseSwap: ReverseSwap) => void;
type expirationCallback = (swap: Swap | ReverseSwap, isReverse: boolean) => void;
type coinsSentCallback = (reverseSwap: ReverseSwap, transaction: Transaction) => void;
type transactionCallback = (transaction: Transaction, swap: Swap | ReverseSwap, confirmed: boolean, isReverse: boolean) => void;

type channelCreatedCallback = (swap: Swap, channelCreation: ChannelCreation) => void;

let emitChannelBackup: channelBackupCallback;

jest.mock('../../../lib/lightning/LndClient', () => {
  return jest.fn().mockImplementation(() => ({
    on: (event: string, callback: channelBackupCallback | invoiceSettledCallback) => {
      switch (event) {
        case 'channel.backup':
          emitChannelBackup = callback as channelBackupCallback;
          break;
      }
    },
  }));
});

const mockedLndClient = <jest.Mock<LndClient>><any>LndClient;

let emitClaim: claimCallback;
let emitRefund: refundCallback;
let emitCoinsSent: coinsSentCallback;
let emitExpiration: expirationCallback;
let emitTransaction: transactionCallback;
let emitInvoicePaid: invoicePaidCallback;
let emitMinerfeePaid: minerfeePaidCallback;
let emitInvoicePending: invoicePendingCallback;
let emitInvoiceSettled: invoiceSettledCallback;
let emitInvoiceFailedToPay: invoiceFailedCallback;
let emitCoinsFailedToSend: coinsFailedToSendCallback;

let emitChannelCreated: channelCreatedCallback;

jest.mock('../../../lib/swap/SwapNursery', () => {
  return jest.fn().mockImplementation(() => ({
    on: (event: string, callback: any) => {
      switch (event) {
        case 'expiration':
          emitExpiration = callback;
          break;

        case 'minerfee.paid':
          emitMinerfeePaid = callback;
          break;

        case 'claim':
          emitClaim = callback;
          break;

        case 'refund':
          emitRefund = callback;
          break;

        case 'invoice.paid':
          emitInvoicePaid = callback;
          break;

        case 'invoice.pending':
          emitInvoicePending = callback;
          break;

        case 'invoice.settled':
          emitInvoiceSettled = callback;
          break;

        case 'invoice.failedToPay':
          emitInvoiceFailedToPay = callback;
          break;

        case 'coins.sent':
          emitCoinsSent = callback;
          break;

        case 'coins.failedToSend':
          emitCoinsFailedToSend = callback;
          break;

        case 'transaction':
          emitTransaction = callback;
          break;
      }
    },
    channelNursery: {
      on: (event: string, callback: any) => {
        switch (event) {
          case 'channel.created':
            emitChannelCreated = callback;
            break;
        }
      },
    },
  }));
});

const mockedSwapNursery = <jest.Mock<SwapNursery>><any>SwapNursery;

const swap = {
  id: 'id',
  acceptZeroConf: true,
  status: SwapUpdateEvent.SwapCreated,
} as Swap;

const channelCreation = {
  fundingTransactionId: 'fundingId',
  fundingTransactionVout: 43,
} as ChannelCreation;

const reverseSwap = {
  id: 'reverseId',
  status: SwapUpdateEvent.TransactionMempool,
} as ReverseSwap;

const mockTransaction = () => {
  const { outputScript } = generateAddress(OutputType.Bech32);
  const transaction = new Transaction();

  transaction.addOutput(outputScript, 1);

  return transaction;
};

describe('EventHandler', () => {
  const symbol = 'BTC';

  const currencies = new Map<string, Currency>([
    [symbol, {
      symbol,
      chainClient: {} as any,
      lndClient: mockedLndClient(),
      network: Networks.bitcoinRegtest,
    } as any as Currency],
  ]);

  const eventHandler = new EventHandler(
    Logger.disabledLogger,
    currencies,
    mockedSwapNursery(),
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should emit events on swap creation', () => {
    let eventEmitted = false;

    eventHandler.once('swap.update', (id, message) => {
      expect(id).toEqual(swap.id);
      expect(message).toEqual({ status: SwapUpdateEvent.SwapCreated });

      eventEmitted = true;
    });

    eventHandler.emitSwapCreation(swap.id);

    expect(eventEmitted).toBeTruthy();
  });

  test('should emit events when invoices of swaps are set', () => {
    let eventEmitted = false;

    eventHandler.once('swap.update', (id, message) => {
      expect(id).toEqual(swap.id);
      expect(message).toEqual({ status: SwapUpdateEvent.InvoiceSet });

      eventEmitted = true;
    });

    eventHandler.emitSwapInvoiceSet(swap.id);

    expect(eventEmitted).toBeTruthy();
  });

  test('should subscribe to transactions', () => {
    let eventsEmitted = 0;

    // Swap related transaction events
    eventHandler.once('swap.update', (id, message) => {
      expect(id).toEqual(swap.id);
      expect(message).toEqual({ status: SwapUpdateEvent.TransactionMempool });

      eventsEmitted += 1;
    });

    emitTransaction({} as any, swap, false, false);

    eventHandler.once('swap.update', (id, message) => {
      expect(id).toEqual(swap.id);
      expect(message).toEqual({ status: SwapUpdateEvent.TransactionConfirmed });

      eventsEmitted += 1;
    });

    emitTransaction({} as any, swap, true, false);

    // Reverse swap related transaction event
    const transaction = mockTransaction();

    eventHandler.once('swap.update', (id, message) => {
      expect(id).toEqual(reverseSwap.id);
      expect(message).toEqual({
        status: SwapUpdateEvent.TransactionConfirmed,
        transaction: {
          id: transaction.getId(),
          hex: transaction.toHex(),
        },
      });

      eventsEmitted += 1;
    });

    emitTransaction(transaction, reverseSwap as ReverseSwap, true, true);

    expect(eventsEmitted).toEqual(3);
  });

  test('should subscribe to invoices', () => {
    let eventsEmitted = 0;

    // Invoice settled
    eventHandler.once('swap.update', (id, message) => {
      expect(id).toEqual(reverseSwap.id);
      expect(message).toEqual({ status: SwapUpdateEvent.InvoiceSettled });

      eventsEmitted += 1;
    });

    eventHandler.once('swap.success', (successfulSwap, isReverse) => {
      expect(successfulSwap).toEqual(reverseSwap);
      expect(isReverse).toEqual(true);

      eventsEmitted += 1;
    });

    emitInvoiceSettled(reverseSwap);

    expect(eventsEmitted).toEqual(2);
    eventsEmitted = 0;

    // Invoice pending
    eventHandler.once('swap.update', (id, message) => {
      expect(id).toEqual(swap.id);
      expect(message).toEqual({
        status: SwapUpdateEvent.InvoicePending,
      });

      eventsEmitted += 1;
    });

    emitInvoicePending(swap);

    expect(eventsEmitted).toEqual(1);
    eventsEmitted = 0;

    // Invoice paid
    eventHandler.once('swap.update', (id, message) => {
      expect(id).toEqual(swap.id);
      expect(message).toEqual({ status: SwapUpdateEvent.InvoicePaid });

      eventsEmitted += 1;
    });

    emitInvoicePaid(swap);

    expect(eventsEmitted).toEqual(1);
    eventsEmitted = 0;

    // Invoice failed to pay
    eventHandler.once('swap.update', (id, message) => {
      expect(id).toEqual(swap.id);
      expect(message).toEqual({ status: SwapUpdateEvent.InvoiceFailedToPay });

      eventsEmitted += 1;
    });

    eventHandler.once('swap.failure', (failedSwap, isReverse, reason) => {
      expect(failedSwap).toEqual(swap);
      expect(isReverse).toEqual(false);
      expect(reason).toEqual('invoice could not be paid');

      eventsEmitted += 1;
    });

    emitInvoiceFailedToPay(swap);

    expect(eventsEmitted).toEqual(2);
  });

  test('should subscribe to swap events', () => {
    let eventsEmitted = 0;

    // Claim
    eventHandler.once('swap.update', (id, message) => {
      expect(id).toEqual(swap.id);
      expect(message).toEqual({ status: SwapUpdateEvent.TransactionClaimed });

      eventsEmitted += 1;
    });

    eventHandler.once('swap.success', (successfulSwap, isReverse) => {
      expect(successfulSwap).toEqual(swap);
      expect(isReverse).toEqual(false);

      eventsEmitted += 1;
    });

    emitClaim(swap);

    expect(eventsEmitted).toEqual(2);
    eventsEmitted = 0;

    // Expiration
      // Swap
    eventHandler.once('swap.update', (id, message) => {
      expect(id).toEqual(swap.id);
      expect(message).toEqual({ status: SwapUpdateEvent.SwapExpired });

      eventsEmitted += 1;
    });

    eventHandler.once('swap.failure', (failedSwap, isReverse, reason) => {
      expect(failedSwap).toEqual(swap);
      expect(isReverse).toEqual(false);
      expect(reason).toEqual('onchain HTLC timed out');

      eventsEmitted += 1;
    });

    emitExpiration(swap, false);

    expect(eventsEmitted).toEqual(2);
    eventsEmitted = 0;

      // Reverse swap
    eventHandler.once('swap.update', (id, message) => {
      expect(id).toEqual(reverseSwap.id);
      expect(message).toEqual({ status: SwapUpdateEvent.SwapExpired });

      eventsEmitted += 1;
    });

    eventHandler.once('swap.failure', (failedSwap, isReverse, reason) => {
      expect(failedSwap).toEqual(reverseSwap);
      expect(isReverse).toEqual(true);
      expect(reason).toEqual('onchain HTLC timed out');

      eventsEmitted += 1;
    });

    emitExpiration(reverseSwap, true);

    expect(eventsEmitted).toEqual(2);
    eventsEmitted = 0;

    // Minerfee paid
    eventHandler.once('swap.update', (id, message) => {
      expect(id).toEqual(reverseSwap.id);
      expect(message).toEqual({
        status: SwapUpdateEvent.MinerFeePaid,
      });

      eventsEmitted += 1;
    });

    emitMinerfeePaid(reverseSwap);

    expect(eventsEmitted).toEqual(1);
    eventsEmitted = 0;

    // Coins sent
    const transaction = mockTransaction();
    SwapNursery.reverseSwapMempoolEta = 2;

    eventHandler.once('swap.update', (id, message) => {
      expect(id).toEqual(reverseSwap.id);
      expect(message).toEqual({
        status: SwapUpdateEvent.TransactionMempool,
        transaction: {
          eta: 2,
          id: transaction.getId(),
          hex: transaction.toHex(),
        },
      });

      eventsEmitted += 1;
    });

    emitCoinsSent(reverseSwap, transaction);

    expect(eventsEmitted).toEqual(1);
    eventsEmitted = 0;

    // Coins failed to send
    eventHandler.once('swap.update', (id, message) => {
      expect(id).toEqual(reverseSwap.id);
      expect(message).toEqual({ status: SwapUpdateEvent.TransactionFailed });

      eventsEmitted += 1;
    });

    eventHandler.once('swap.failure', (failedSwap, isReverse, reason) => {
      expect(failedSwap).toEqual(reverseSwap);
      expect(isReverse).toEqual(true);
      expect(reason).toEqual('onchain coins could not be sent');

      eventsEmitted += 1;
    });

    emitCoinsFailedToSend(reverseSwap);

    expect(eventsEmitted).toEqual(2);
    eventsEmitted = 0;

    // Refund
    const transactionId = '168bf6ae0a7de57d6aa38042bdde38873bd37b55f53fd727ff827d33316b6d05';

    eventHandler.once('swap.update', (id, message) => {
      expect(id).toEqual(reverseSwap.id);
      expect(message).toEqual({ status: SwapUpdateEvent.TransactionRefunded });

      eventsEmitted += 1;
    });

    eventHandler.once('swap.failure', (failedSwap, isReverse, reason) => {
      expect(failedSwap).toEqual(reverseSwap);
      expect(isReverse).toEqual(true);
      expect(reason).toEqual(`refunded onchain coins: ${transactionId}`);

      eventsEmitted += 1;
    });

    reverseSwap.transactionId = transactionId;

    emitRefund(reverseSwap);

    expect(eventsEmitted).toEqual(2);
    eventsEmitted = 0;

    // Channel created
    eventHandler.once('swap.update', (id, message) => {
      expect(id).toEqual(swap.id);
      expect(message).toEqual({
        status: SwapUpdateEvent.ChannelCreated,
        channel: {
          fundingTransactionId: channelCreation.fundingTransactionId,
          fundingTransactionVout: channelCreation.fundingTransactionVout,
        },
      });

      eventsEmitted += 1;
    });

    emitChannelCreated(swap, channelCreation);

    expect(eventsEmitted).toEqual(1);
    eventsEmitted = 0;
  });

  test('should subscribe to channel backups', () => {
    let eventEmitted = false;

    const expectedBackup = 'backup';

    eventHandler.once('channel.backup', (backupSymbol, channelBackup) => {
      expect(backupSymbol).toEqual(symbol);
      expect(channelBackup).toEqual(expectedBackup);

      eventEmitted = true;
    });

    emitChannelBackup(expectedBackup);

    expect(eventEmitted).toBeTruthy();
  });
});
