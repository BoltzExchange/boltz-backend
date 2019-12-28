import { Op } from 'sequelize';
import { Transaction } from 'bitcoinjs-lib';
import { OutputType, Networks } from 'boltz-core';
import Logger from '../../../lib/Logger';
import { wait, generateAddress } from '../../Utils';
import SwapNursery from '../../../lib/swap/SwapNursery';
import LndClient from '../../../lib/lightning/LndClient';
import ChainClient from '../../../lib/chain/ChainClient';
import { SwapUpdateEvent } from '../../../lib/consts/Enums';
import EventHandler from '../../../lib/service/EventHandler';
import { Currency } from '../../../lib/wallet/WalletManager';
import SwapRepository from '../../../lib/service/SwapRepository';
import ReverseSwapRepository from '../../../lib/service/ReverseSwapRepository';

type transactionCallback = (transaction: Transaction, confirmed: boolean) => void;

type channelBackupCallback = (channelBackup: string) => void;
type invoicePaidCallback = (invoice: string, routingFee: number) => void;
type invoiceSettledCallback = (invoice: string, preimage: string) => void;

type coinsFailedToSendCallback = (invoice: string) => void;
type expirationCallback = (invoice: string, isReverse: boolean) => void;
type claimCallback = (lockupId: string, lockupVout: number, minerFee: number) => void;
type refundCallback = (lockupId: string, lockupVout: number, minerFee: number) => void;
type coinsSentCallback = (invoice: string, transaction: Transaction, minerFee: number) => void;

type invoiceFailedCallback = (invoice: string) => void;

let emitTransaction: transactionCallback;

jest.mock('../../../lib/chain/ChainClient', () => {
  return jest.fn().mockImplementation(() => ({
    on: (event: string, callback: transactionCallback) => {
      expect(event).toEqual('transaction');

      emitTransaction = callback;
    },
  }));
});

const mockedChainClient = <jest.Mock<ChainClient>><any>ChainClient;

let emitChannelBackup: channelBackupCallback;

let emitInvoicePaid: invoicePaidCallback;
let emitInvoiceSettled: invoiceSettledCallback;

jest.mock('../../../lib/lightning/LndClient', () => {
  return jest.fn().mockImplementation(() => ({
    on: (event: string, callback: channelBackupCallback | invoiceSettledCallback) => {
      switch (event) {
        case 'channel.backup':
          emitChannelBackup = callback as channelBackupCallback;
          break;

        case 'invoice.settled':
          emitInvoiceSettled = callback as invoiceSettledCallback;
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
let emitInvoiceFailedToPay: invoiceFailedCallback;
let emitCoinsFailedToSend: coinsFailedToSendCallback;

jest.mock('../../../lib/swap/SwapNursery', () => {
  return jest.fn().mockImplementation(() => ({
    on: (event: string, callback: any) => {
      switch (event) {
        case 'expiration':
          emitExpiration = callback;
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

        case 'invoice.failedToPay':
          emitInvoiceFailedToPay = callback;
          break;

        case 'coins.sent':
          emitCoinsSent = callback;
          break;

        case 'coins.failedToSend':
          emitCoinsFailedToSend = callback;
          break;
      }
    },
  }));
});

const mockedSwapNursery = <jest.Mock<SwapNursery>><any>SwapNursery;

const swap = {
  id: 'id',
  acceptZeroConf: true,
};

const mockGetSwap = jest.fn().mockResolvedValue(swap);
const mockSetMinerFee = jest.fn().mockResolvedValue(swap);
const mockSetSwapStatus = jest.fn().mockResolvedValue(swap);
const mockSetInvoicePaid = jest.fn().mockResolvedValue(swap);
const mockSetLockupTransactionId = jest.fn().mockResolvedValue(swap);

jest.mock('../../../lib/service/SwapRepository', () => {
  return jest.fn().mockImplementation(() => ({
    getSwap: mockGetSwap,
    setMinerFee: mockSetMinerFee,
    setSwapStatus: mockSetSwapStatus,
    setInvoicePaid: mockSetInvoicePaid,
    setLockupTransactionId: mockSetLockupTransactionId,
  }));
});

const mockedSwapRepository = <jest.Mock<SwapRepository>><any>SwapRepository;

const reverseSwap = {
  id: 'reverseId',
  status: SwapUpdateEvent.TransactionMempool,
};

const mockGetReverseSwap = jest.fn().mockResolvedValue(reverseSwap);
const mockSetInvoiceSettled = jest.fn().mockResolvedValue(reverseSwap);
const mockSetLockupTransaction = jest.fn().mockResolvedValue(reverseSwap);
const mockSetReverseSwapStatus = jest.fn().mockResolvedValue(reverseSwap);
const mockSetTransactionRefunded = jest.fn().mockResolvedValue(reverseSwap);

jest.mock('../../../lib/service/ReverseSwapRepository', () => {
  return jest.fn().mockImplementation(() => ({
    getReverseSwap: mockGetReverseSwap,
    setInvoiceSettled: mockSetInvoiceSettled,
    setLockupTransaction: mockSetLockupTransaction,
    setReverseSwapStatus: mockSetReverseSwapStatus,
    setTransactionRefunded: mockSetTransactionRefunded,
  }));
});

const mockedReverseSwapRepository = <jest.Mock<ReverseSwapRepository>><any>ReverseSwapRepository;

describe('EventHandler', () => {
  const symbol = 'BTC';

  const currencies = new Map<string, Currency>([
    [symbol, {
      symbol,
      network: Networks.bitcoinRegtest,
      lndClient: mockedLndClient(),
      chainClient: mockedChainClient(),
    } as any as Currency],
  ]);

  const eventHandler = new EventHandler(
    Logger.disabledLogger,
    currencies,
    mockedSwapNursery(),
    mockedSwapRepository(),
    mockedReverseSwapRepository(),
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should subscribe to transactions', async () => {
    let updatesEmitted = 0;

    const { outputScript, address } = generateAddress(OutputType.Bech32);
    const transaction = new Transaction();

    const outputValue = 1;

    transaction.addOutput(outputScript, outputValue);

    const states = [
      {
        confirmed: false,
        status: SwapUpdateEvent.TransactionMempool,
      },
      {
        confirmed: true,
        status: SwapUpdateEvent.TransactionConfirmed,
      },
    ];

    for (let i = 1; i <= states.length; i += 1) {
      const state = states[i - 1];

      eventHandler.on('swap.update', (id, message) => {
        if (id === swap.id) {
          expect(id).toEqual(swap.id);
          expect(message).toEqual({
            status: state.status,
          });
        } else {
          expect(id).toEqual(reverseSwap.id);
          expect(message).toEqual({
            status: state.status,
            transactionId: transaction.getId(),
            transactionHex: transaction.toHex(),
          });
        }

        updatesEmitted += 1;
      });

      emitTransaction(transaction, state.confirmed);

      await wait(20);

      eventHandler.removeAllListeners();

      expect(mockGetSwap).toHaveBeenNthCalledWith(i, {
        lockupAddress: {
          [Op.eq]: address,
        },
      });
      expect(mockSetLockupTransactionId).toHaveBeenNthCalledWith(
        i,
        expect.anything(),
        transaction.getId(),
        outputValue,
        state.confirmed,
      );

      if (state.confirmed) {
        expect(mockGetReverseSwap).toHaveBeenNthCalledWith(1, {
          transactionId: {
            [Op.eq]: transaction.getId(),
          },
        });
        expect(mockSetReverseSwapStatus).toHaveBeenNthCalledWith(1,
          expect.anything(),
          state.status,
        );
      }

    }

    expect(updatesEmitted).toEqual(3);
  });

  test('should subscribe to invoices', async () => {
    let updatesEmitted = 0;
    let successEmitted = false;
    let failureEmitted = false;

    const invoice = 'lnbc';
    const preimage = 'preimage';
    const routingFee = 3;

    // Paid
    eventHandler.once('swap.update', (id, message) => {
      expect(id).toEqual(swap.id);
      expect(message).toEqual({ status: SwapUpdateEvent.InvoicePaid });

      updatesEmitted += 1;
    });

    emitInvoicePaid(invoice, routingFee);

    await wait(20);

    expect(mockGetSwap).toHaveBeenNthCalledWith(1, {
      invoice: {
        [Op.eq]: invoice,
      },
    });
    expect(mockSetInvoicePaid).toHaveBeenCalledWith(
      expect.anything(),
      routingFee,
    );

    // Settled
    eventHandler.once('swap.update', (id, message) => {
      expect(id).toEqual(reverseSwap.id);
      expect(message).toEqual({ status: SwapUpdateEvent.InvoiceSettled });

      updatesEmitted += 1;
    });
    eventHandler.once('swap.success', (successSwap, isReverse) => {
      expect(successSwap.id).toEqual(reverseSwap.id);
      expect(isReverse).toBeTruthy();

      successEmitted = true;
    });

    emitInvoiceSettled(invoice, preimage);

    await wait(20);

    expect(mockGetReverseSwap).toHaveBeenNthCalledWith(1, {
      invoice: {
        [Op.eq]: invoice,
      },
    });
    expect(mockSetInvoiceSettled).toHaveBeenCalledWith(
      expect.anything(),
      preimage,
    );

    // Failed to pay
    eventHandler.once('swap.update', (id, message) => {
      expect(id).toEqual(swap.id);
      expect(message).toEqual({ status: SwapUpdateEvent.InvoiceFailedToPay });

      updatesEmitted += 1;
    });
    eventHandler.once('swap.failure', (failedSwap, isReverse, errorMessage) => {
      expect(isReverse).toBeFalsy();
      expect(failedSwap.id).toEqual(swap.id);
      expect(errorMessage).toEqual('invoice could not be paid');

      failureEmitted = true;
    });

    emitInvoiceFailedToPay(invoice);

    await wait(20);

    expect(mockGetSwap).toHaveBeenNthCalledWith(1, {
      invoice: {
        [Op.eq]: invoice,
      },
    });
    expect(mockSetSwapStatus).toHaveBeenCalledWith(
      expect.anything(),
      SwapUpdateEvent.InvoiceFailedToPay,
    );

    expect(updatesEmitted).toEqual(3);
    expect(successEmitted).toBeTruthy();
    expect(failureEmitted).toBeTruthy();
  });

  test('should subscribe to swap events', async () => {
    let updatesEmitted = 0;
    let failuresEmitted = 0;
    let successEmitted = false;

    const lockupId = 'id';
    const lockupVout = 1;
    const minerFee = 123;

    const invoice = 'lnbc';

    const transaction = new Transaction();
    transaction.addOutput(generateAddress(OutputType.Bech32).outputScript, 1);

    // Expiration
    eventHandler.once('swap.update', (id, message) => {
      expect(id).toEqual(swap.id);
      expect(message).toEqual({ status: SwapUpdateEvent.SwapExpired });

      updatesEmitted += 1;
    });
    eventHandler.once('swap.failure', (failedSwap, isReverse, errorMessage) => {
      expect(isReverse).toBeFalsy();
      expect(failedSwap.id).toEqual(swap.id);
      expect(errorMessage).toEqual('onchain HTLC timed out');

      failuresEmitted += 1;
    });

    emitExpiration(invoice, false);

    await wait(20);

    expect(mockGetSwap).toHaveBeenNthCalledWith(1, {
      invoice: {
        [Op.eq]: invoice,
      },
    });
    expect(mockSetSwapStatus).toHaveBeenCalledWith(expect.anything(), SwapUpdateEvent.SwapExpired);

    eventHandler.once('swap.update', (id, message) => {
      expect(id).toEqual(reverseSwap.id);
      expect(message).toEqual({ status: SwapUpdateEvent.SwapExpired });

      updatesEmitted += 1;
    });
    eventHandler.once('swap.failure', (failedSwap, isReverse, errorMessage) => {
      expect(isReverse).toBeTruthy();
      expect(failedSwap.id).toEqual(reverseSwap.id);
      expect(errorMessage).toEqual('onchain HTLC timed out');

      failuresEmitted += 1;
    });

    emitExpiration(invoice, true);

    await wait(20);

    expect(mockGetReverseSwap).toHaveBeenNthCalledWith(1, {
      invoice: {
        [Op.eq]: invoice,
      },
    });
    expect(mockSetReverseSwapStatus).toHaveBeenCalledWith(expect.anything(), SwapUpdateEvent.SwapExpired);

    // Claim
    eventHandler.once('swap.success', (successSwap, isReverse) => {
      expect(successSwap.id).toEqual(swap.id);
      expect(isReverse).toBeFalsy();

      successEmitted = true;
    });

    emitClaim(lockupId, lockupVout, minerFee);

    await wait(20);

    expect(mockGetSwap).toHaveBeenNthCalledWith(2, {
      lockupTransactionId: {
        [Op.eq]: lockupId,
      },
    });
    expect(mockSetMinerFee).toHaveBeenCalledWith(expect.anything(), minerFee);

    // Refund
    eventHandler.once('swap.update', (id, message) => {
      expect(id).toEqual(reverseSwap.id);
      expect(message).toEqual({ status: SwapUpdateEvent.TransactionRefunded });

      updatesEmitted += 1;
    });
    eventHandler.once('swap.failure', (failureSwap, isReverse, errorMessage) => {
      expect(isReverse).toBeTruthy();
      expect(failureSwap.id).toEqual(reverseSwap.id);
      expect(errorMessage).toEqual('onchain HTLC timed out');

      failuresEmitted += 1;
    });

    emitRefund(lockupId, lockupVout, minerFee);

    await wait(20);

    expect(mockGetReverseSwap).toHaveBeenNthCalledWith(2, {
      transactionId: {
        [Op.eq]: lockupId,
      },
    });
    expect(mockSetTransactionRefunded).toHaveBeenCalledWith(expect.anything(), minerFee);

    // Coins sent
    eventHandler.once('swap.update', (id, message) => {
      expect(id).toEqual(reverseSwap.id);
      expect(message).toEqual({
        transactionId: transaction.getId(),
        transactionHex: transaction.toHex(),
        status: SwapUpdateEvent.TransactionMempool,
      });

      updatesEmitted += 1;
    });

    emitCoinsSent(invoice, transaction, minerFee);

    await wait(20);

    expect(mockGetReverseSwap).toHaveBeenNthCalledWith(3, {
      invoice: {
        [Op.eq]: invoice,
      },
    });
    expect(mockSetLockupTransaction).toHaveBeenCalledWith(expect.anything(), transaction.getId(), minerFee);

    // Coins failed to send
    eventHandler.once('swap.update', (id, message) => {
      expect(id).toEqual(reverseSwap.id);
      expect(message).toEqual({ status: SwapUpdateEvent.TransactionFailed });

      updatesEmitted += 1;
    });
    eventHandler.once('swap.failure', (failureSwap, isReverse, errorMessage) => {
      expect(isReverse).toBeTruthy();
      expect(failureSwap.id).toEqual(reverseSwap.id);
      expect(errorMessage).toEqual('onchain coins could not be sent');

      failuresEmitted += 1;
    });

    emitCoinsFailedToSend(invoice);

    await wait(20);

    expect(mockGetReverseSwap).toHaveBeenNthCalledWith(4, {
      invoice: {
        [Op.eq]: invoice,
      },
    });
    expect(mockSetReverseSwapStatus).toHaveBeenNthCalledWith(2, expect.anything(), SwapUpdateEvent.TransactionFailed);

    await wait(20);

    expect(updatesEmitted).toEqual(5);
    expect(failuresEmitted).toEqual(4);
    expect(successEmitted).toBeTruthy();

  });

  test('should subscribe to channel backups', async () => {
    let eventEmitted = false;

    const expectedBackup = 'backup';

    eventHandler.once('channel.backup', (backupSymbol, channelBackup) => {
      expect(backupSymbol).toEqual(symbol);
      expect(channelBackup).toEqual(expectedBackup);

      eventEmitted = true;
    });

    emitChannelBackup(expectedBackup);

    await wait(20);

    expect(eventEmitted).toBeTruthy();
  });
});
