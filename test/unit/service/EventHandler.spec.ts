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

type abortCallback = (invoice: string) => void;
type claimCallback = (lockupId: string, lockupVout: number, minerFee: number) => void;
type refundCallback = (lockupId: string, lockupVout: number, minerFee: number) => void;

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
    on: (event: string, callback: channelBackupCallback) => {
      switch (event) {
        case 'channel.backup':
          emitChannelBackup = callback;
          break;

        case 'invoice.paid':
          emitInvoicePaid = callback;
          break;

        case 'invoice.settled':
          emitInvoiceSettled = callback;
          break;
      }
    },
  }));
});

const mockedLndClient = <jest.Mock<LndClient>><any>LndClient;

let emitAbort: abortCallback;
let emitClaim: claimCallback;
let emitRefund: refundCallback;

let emitInvoiceFailedToPay: invoiceFailedCallback;

jest.mock('../../../lib/swap/SwapNursery', () => {
  return jest.fn().mockImplementation(() => ({
    on: (event: string, callback: abortCallback | claimCallback | refundCallback | invoiceFailedCallback) => {
      switch (event) {
        case 'abort':
          emitAbort = callback as abortCallback;
          break;

        case 'claim':
          emitClaim = callback as claimCallback;
          break;

        case 'refund':
          emitRefund = callback as refundCallback;
          break;

        case 'invoice.failedToPay':
          emitInvoiceFailedToPay = callback as invoiceFailedCallback;
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

const mockGetSwap = jest.fn().mockReturnValue(swap);
const mockSetMinerFee = jest.fn().mockReturnValue(swap);
const mockSetSwapStatus = jest.fn().mockReturnValue(swap);
const mockSetInvoicePaid = jest.fn().mockReturnValue(swap);
const mockSetLockupTransactionId = jest.fn().mockReturnValue(swap);

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
};

const mockGetReverseSwap = jest.fn().mockReturnValue(reverseSwap);
const mockSetInvoiceSettled = jest.fn().mockReturnValue(reverseSwap);
const mockSetReverseSwapStatus = jest.fn().mockReturnValue(reverseSwap);
const mockSetTransactionRefunded = jest.fn().mockReturnValue(reverseSwap);

jest.mock('../../../lib/service/ReverseSwapRepository', () => {
  return jest.fn().mockImplementation(() => ({
    getReverseSwap: mockGetReverseSwap,
    setInvoiceSettled: mockSetInvoiceSettled,
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
    mockGetSwap.mockClear();
    mockGetReverseSwap.mockClear();
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

    for (const state of states) {
      eventHandler.once('swap.update', (id, message) => {
        if (id === swap.id) {
          expect(id).toEqual(swap.id);
          expect(message).toEqual({
            status: state.status,
          });
        } else {
          expect(id).toEqual(reverseSwap.id);
          expect(message).toEqual({
            status: state.status,
          });
        }

        updatesEmitted += 1;
      });

      emitTransaction(transaction, state.confirmed);

      await wait(20);

      expect(mockGetSwap).toHaveBeenNthCalledWith(updatesEmitted, {
        lockupAddress: {
          [Op.eq]: address,
        },
      });
      expect(mockSetLockupTransactionId).toHaveBeenNthCalledWith(
        updatesEmitted,
        expect.anything(),
        transaction.getId(),
        outputValue,
        state.confirmed,
      );

      expect(mockGetReverseSwap).toHaveBeenNthCalledWith(updatesEmitted, {
        transactionId: {
          [Op.eq]: transaction.getId(),
        },
      });
      expect(mockSetReverseSwapStatus).toHaveBeenNthCalledWith(
        updatesEmitted,
        expect.anything(),
        state.status,
      );
    }

    expect(updatesEmitted).toEqual(2);
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
      expect(message).toEqual({ preimage, status: SwapUpdateEvent.InvoiceSettled });

      updatesEmitted += 1;
    });
    eventHandler.once('swap.success', (successSwap) => {
      expect(successSwap.id).toEqual(reverseSwap.id);

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
    eventHandler.once('swap.failure', (failedSwap, errorMessage) => {
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

    // Abort
    eventHandler.once('swap.update', (id, message) => {
      expect(id).toEqual(swap.id);
      expect(message).toEqual({ status: SwapUpdateEvent.SwapExpired });

      updatesEmitted += 1;
    });
    eventHandler.once('swap.failure', (failedSwap, errorMessage) => {
      expect(failedSwap.id).toEqual(swap.id);
      expect(errorMessage).toEqual('onchain HTLC timed out');

      failuresEmitted += 1;
    });

    emitAbort(invoice);

    await wait(20);

    expect(mockGetSwap).toHaveBeenNthCalledWith(1, {
      invoice: {
        [Op.eq]: invoice,
      },
    });
    expect(mockSetSwapStatus).toHaveBeenCalledWith(expect.anything(), SwapUpdateEvent.SwapExpired);

    // Claim
    eventHandler.once('swap.success', (successSwap) => {
      expect(successSwap.id).toEqual(swap.id);

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
    eventHandler.once('swap.failure', (failureSwap, errorMessage) => {
      expect(failureSwap.id).toEqual(reverseSwap.id);
      expect(errorMessage).toEqual('onchain HTLC timed out');

      failuresEmitted += 1;
    });

    emitRefund(lockupId, lockupVout, minerFee);

    await wait(20);

    expect(mockGetReverseSwap).toHaveBeenNthCalledWith(1, {
      transactionId: {
        [Op.eq]: lockupId,
      },
    });
    expect(mockSetTransactionRefunded).toHaveBeenCalledWith(expect.anything(), minerFee);

    expect(updatesEmitted).toEqual(2);
    expect(failuresEmitted).toEqual(2);
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
