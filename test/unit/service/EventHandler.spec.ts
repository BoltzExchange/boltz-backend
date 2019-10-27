import { Op } from 'sequelize';
import { Transaction } from 'bitcoinjs-lib';
import { OutputType, Networks } from 'boltz-core';
import Logger from '../../../lib/Logger';
import Errors from '../../../lib/service/Errors';
import { wait, generateAddress } from '../../Utils';
import SwapNursery from '../../../lib/swap/SwapNursery';
import LndClient from '../../../lib/lightning/LndClient';
import ChainClient from '../../../lib/chain/ChainClient';
import EventHandler from '../../../lib/service/EventHandler';
import { Currency } from '../../../lib/wallet/WalletManager';
import SwapRepository from '../../../lib/service/SwapRepository';
import { SwapUpdateEvent, SwapType } from '../../../lib/consts/Enums';
import ReverseSwapRepository from '../../../lib/service/ReverseSwapRepository';
import ChainToChainSwapRepository from '../../../lib/service/ChainToChainSwapRepository';
import { getHexBuffer, transactionSignalsRbfExplicitly } from '../../../lib/Utils';

type transactionCallback = (transaction: Transaction, confirmed: boolean) => void;

type channelBackupCallback = (channelBackup: string) => void;

type invoiceSettledCallback = (invoice: string, preimage: string) => void;

type expirationCallback = (id: string) => void;
type abortCallback = (id: string, error: string) => void;
type invoiceFailedToPayCallback = (invoice: string) => void;
type invoicePaidCallback = (invoice: string, routingFee: number) => void;
type refundCallback = (lockupTransactionId: string, minerFee: number) => void;
type claimCallback = (id: string, minerFee: number, preimage?: string) => void;
type lockupTransactionSentCallback = (id: string, transactionId: string, minerFee: number) => void;
type lockupTransactionFoundCallback = (id: string, transaction: Transaction, vout: number, confirmed: boolean, zeroConfAccepted: boolean) => void;

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
let emitAbortion: abortCallback;
let emitRefund: refundCallback;
let emitExpiration: expirationCallback;
let emitInvoicePaid: invoicePaidCallback;
let emitInvoiceFailedToPay: invoiceFailedToPayCallback;
let emitLockupTransactionSent: lockupTransactionSentCallback;
let emitLockupTransactionFound: lockupTransactionFoundCallback;

jest.mock('../../../lib/swap/SwapNursery', () => {
  return jest.fn().mockImplementation(() => ({
    on: (event: string, callback: expirationCallback |
      abortCallback |
      claimCallback |
      refundCallback |
      invoicePaidCallback |
      invoiceFailedToPayCallback |
      lockupTransactionSentCallback |
      lockupTransactionFoundCallback,
    ) => {
      switch (event) {
        case 'expiration':
          emitExpiration = callback as expirationCallback;
          break;

        case 'abort':
          emitAbortion = callback as abortCallback;
          break;

        case 'invoice.failedToPay':
          emitInvoiceFailedToPay = callback as invoiceFailedToPayCallback;
          break;

        case 'invoice.paid':
          emitInvoicePaid = callback as invoicePaidCallback;
          break;

        case 'refund':
          emitRefund = callback as refundCallback;
          break;

        case 'claim':
          emitClaim = callback as claimCallback;
          break;

        case 'transaction.lockup.sent':
          emitLockupTransactionSent = callback as lockupTransactionSentCallback;
          break;

        case 'transaction.lockup.found':
          emitLockupTransactionFound = callback as lockupTransactionFoundCallback;
          break;
      }
    },
  }));
});

const mockedSwapNursery = <jest.Mock<SwapNursery>><any>SwapNursery;

const swap: any = {
  id: 'id',
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

const reverseSwap: any = {
  id: 'reverseId',
};

const mockGetReverseSwap = jest.fn().mockResolvedValue(reverseSwap);
const mockSetInvoiceSettled = jest.fn().mockResolvedValue(reverseSwap);
const mockSetReverseSwapStatus = jest.fn().mockResolvedValue(reverseSwap);
const mockSetTransactionRefunded = jest.fn().mockResolvedValue(reverseSwap);

jest.mock('../../../lib/service/ReverseSwapRepository', () => {
  return jest.fn().mockImplementation(() => ({
    getReverseSwap: mockGetReverseSwap,
    setInvoiceSettled: mockSetInvoiceSettled,
    setReverseSwapStatus: mockSetReverseSwapStatus,
    setTransactionRefunded: mockSetTransactionRefunded,
  }));
});

const mockedReverseSwapRepository = <jest.Mock<ReverseSwapRepository>><any>ReverseSwapRepository;

const chainToChainSwap: any = {
  id: 'chainId',
  preimageHash: '6872709069257dc268cbe5b1882cc52ea29ad253db2528f0a68a906db0cde5e1',
};

const mockSetClaimDetails = jest.fn().mockResolvedValue(chainToChainSwap);
const mockGetChainToChainSwap = jest.fn().mockResolvedValue(chainToChainSwap);
const mockSetSendingTransaction = jest.fn().mockResolvedValue(chainToChainSwap);
const mockSetReceivingTransaction = jest.fn().mockResolvedValue(chainToChainSwap);
const mockSetChainToChainSwapStatus = jest.fn().mockResolvedValue(chainToChainSwap);
const mockSetSendingTransactionRefunded = jest.fn().mockResolvedValue(chainToChainSwap);

jest.mock('../../../lib/service/ChainToChainSwapRepository', () => {
  return jest.fn().mockImplementation(() => ({
    setClaimDetails: mockSetClaimDetails,
    getChainToChainSwap: mockGetChainToChainSwap,
    setSendingTransaction: mockSetSendingTransaction,
    setReceivingTransaction: mockSetReceivingTransaction,
    setChainToChainSwapStatus: mockSetChainToChainSwapStatus,
    setSendingTransactionRefunded: mockSetSendingTransactionRefunded,
  }));
});

const mockedChainToChainSwapRepository = <jest.Mock<ChainToChainSwapRepository>>ChainToChainSwapRepository;

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
    mockedChainToChainSwapRepository(),
  );

  beforeEach(() => {
    mockGetSwap.mockClear();
    mockSetSwapStatus.mockClear();
    mockGetReverseSwap.mockClear();
    mockGetChainToChainSwap.mockClear();
    mockSetChainToChainSwapStatus.mockClear();

    eventHandler.removeAllListeners();
  });

  test('should handle transactions', async () => {
    let updatesEmitted = 0;

    const { outputScript } = generateAddress(OutputType.Bech32);
    const transaction = new Transaction();

    const outputValue = 123;

    transaction.addOutput(outputScript, outputValue);

    reverseSwap.status = SwapUpdateEvent.TransactionMempool;
    chainToChainSwap.status = SwapUpdateEvent.BoltzTransactionMempool;

    eventHandler.on('swap.update', (id, message) => {
      if (id === reverseSwap.id) {
        expect(message).toEqual({
          status: SwapUpdateEvent.TransactionConfirmed,
        });
      } else {
        expect(id).toEqual(chainToChainSwap.id);
        expect(message).toEqual({
          status: SwapUpdateEvent.BoltzTransactioConfirmed,
        });
      }

      updatesEmitted += 1;
    });

    emitTransaction(transaction, true);

    await wait(20);

    expect(mockGetReverseSwap).toHaveBeenCalledTimes(1);
    expect(mockGetReverseSwap).toHaveBeenCalledWith({
      transactionId: {
        [Op.eq]: transaction.getId(),
      },
    });

    expect(mockSetReverseSwapStatus).toHaveBeenCalledTimes(1);
    expect(mockSetReverseSwapStatus).toHaveBeenCalledWith(reverseSwap, SwapUpdateEvent.TransactionConfirmed);

    expect(mockGetChainToChainSwap).toHaveBeenCalledTimes(1);
    expect(mockGetChainToChainSwap).toHaveBeenCalledWith({
      sendingTransactionId: {
        [Op.eq]: transaction.getId(),
      },
    });

    expect(mockSetChainToChainSwapStatus).toHaveBeenCalledTimes(1);
    expect(mockSetChainToChainSwapStatus).toHaveBeenCalledWith(chainToChainSwap, SwapUpdateEvent.BoltzTransactioConfirmed);

    expect(updatesEmitted).toEqual(2);
  });

  test('should handle settled invoices', async () => {
    let eventsEmitted = 0;

    eventHandler.on('swap.update', (id, message) => {
      expect(id).toEqual(reverseSwap.id);
      expect(message).toEqual({
        preimage,
        status: SwapUpdateEvent.InvoiceSettled,
      });

      eventsEmitted += 1;
    });
    eventHandler.on('swap.success', (successfulSwap, swapType) => {
      expect(successfulSwap).toEqual(reverseSwap);
      expect(swapType).toEqual(SwapType.ReverseSubmarine);

      eventsEmitted += 1;
    });

    const invoice = 'lnbcrt1';
    const preimage = '6d02b66d4186d03f9eb54e155b75d9e7608165ec1d658a5479c6af0e1695f226';

    emitInvoiceSettled(invoice, preimage);

    await wait(20);

    expect(mockGetReverseSwap).toHaveBeenCalledTimes(1);
    expect(mockGetReverseSwap).toHaveBeenCalledWith({
      invoice: {
        [Op.eq]: invoice,
      },
    });

    expect(mockSetInvoiceSettled).toHaveBeenCalledTimes(1);
    expect(mockSetInvoiceSettled).toHaveBeenCalledWith(reverseSwap, preimage);

    expect(eventsEmitted).toEqual(2);
  });

  test('should handle paid invoices', async () => {
    let eventEmitted = false;

    eventHandler.on('swap.update', (id, message) => {
      expect(id).toEqual(swap.id);
      expect(message).toEqual({
        status: SwapUpdateEvent.InvoicePaid,
      });

      eventEmitted = true;
    });

    const invoice = 'lnbcrt1';
    const routingFee = 123321;

    emitInvoicePaid(invoice, routingFee);

    await wait(20);

    expect(mockGetSwap).toHaveBeenCalledTimes(1);
    expect(mockGetSwap).toHaveBeenCalledWith({
      invoice: {
        [Op.eq]: invoice,
      },
    });

    expect(mockSetInvoicePaid).toHaveReturnedTimes(1);
    expect(mockSetInvoicePaid).toHaveBeenCalledWith(swap, routingFee);

    expect(eventEmitted).toBeTruthy();
  });

  test('should handle invoices that failed to pay', async () => {
    let eventsEmitted = 0;

    eventHandler.on('swap.update', (id, message) => {
      expect(id).toEqual(swap.id);
      expect(message).toEqual({
        status: SwapUpdateEvent.InvoiceFailedToPay,
      });

      eventsEmitted += 1;
    });
    eventHandler.on('swap.failure', (failedSwap, swapType, reason) => {
      expect(failedSwap).toEqual(swap);
      expect(swapType).toEqual(SwapType.Submarine);
      expect(reason).toEqual(Errors.INVOICE_COULD_NOT_BE_PAID().message);

      eventsEmitted += 1;
    });

    const invoice = 'lnbcrt1';

    emitInvoiceFailedToPay(invoice);

    await wait(20);

    expect(mockGetSwap).toHaveBeenCalledTimes(1);
    expect(mockGetSwap).toHaveBeenCalledWith({
      invoice: {
        [Op.eq]: invoice,
      },
    });

    expect(mockSetSwapStatus).toHaveBeenCalledTimes(1);
    expect(mockSetSwapStatus).toHaveBeenCalledWith(swap, SwapUpdateEvent.InvoiceFailedToPay);

    expect(eventsEmitted).toEqual(2);
  });

  test('should handle found lockup transactions', async () => {
    chainToChainSwap.status = SwapUpdateEvent.TransactionWaiting;

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

    // Start counting at 1 so that "i" can be used as expected number of calls for the mocked functions
    for (let i = 1; i <= states.length; i += 1) {
      const state = states[i - 1];

      let eventsEmitted = 0;

      eventHandler.on('swap.update', (id, message) => {
        if (id !== swap.id) {
          expect(id).toEqual(chainToChainSwap.id);
        }

        expect(message).toEqual({
          zeroConfAccepted,
          status: state.status,
        });

        eventsEmitted += 1;
      });

      const { outputScript } = generateAddress(OutputType.Bech32);
      const transaction = new Transaction();

      const outputValue = 123;

      transaction.addOutput(outputScript, 0);
      transaction.addOutput(outputScript, 0);
      transaction.addOutput(outputScript, outputValue);

      const vout = 2;
      const id = 'id';
      const zeroConfAccepted = true;

      emitLockupTransactionFound(id, transaction, vout, state.confirmed, zeroConfAccepted);

      await wait(20);

      expect(mockGetSwap).toHaveBeenCalledTimes(i);
      expect(mockGetSwap).toHaveBeenNthCalledWith(i, {
        id: {
          [Op.eq]: id,
        },
      });

      expect(mockSetLockupTransactionId).toHaveBeenCalledTimes(i);
      expect(mockSetLockupTransactionId).toHaveBeenNthCalledWith(i, swap, transaction.getId(), outputValue, state.confirmed);

      expect(mockGetChainToChainSwap).toHaveBeenCalledTimes(i);
      expect(mockGetChainToChainSwap).toHaveBeenNthCalledWith(i, {
        id: {
          [Op.eq]: id,
        },
      });

      expect(mockSetReceivingTransaction).toHaveBeenCalledTimes(i);
      expect(mockSetReceivingTransaction).toHaveBeenNthCalledWith(i, chainToChainSwap, transaction.getId(), outputValue, state.confirmed);

      expect(eventsEmitted).toEqual(2);

      eventHandler.removeAllListeners();
    }
  });

  test('should handle sent lockup transactions', async () => {
    let eventEmitted = false;

    eventHandler.on('swap.update', (id, message) => {
      expect(id).toEqual(chainToChainSwap.id);
      expect(message).toEqual({
        status: SwapUpdateEvent.BoltzTransactionMempool,
      });

      eventEmitted = true;
    });

    const id = 'id';
    const minerFee = 420;
    const transactionId = '0a54f3bc7ab698a7547f75d0825699cc27f60e635a235279ec8daeba08335844';

    emitLockupTransactionSent(id, transactionId, minerFee);

    await wait(20);

    expect(mockGetChainToChainSwap).toHaveBeenCalledTimes(1);
    expect(mockGetChainToChainSwap).toHaveBeenCalledWith({
      id: {
        [Op.eq]: id,
      },
    });

    expect(mockSetSendingTransaction).toHaveBeenCalledTimes(1);
    expect(mockSetSendingTransaction).toHaveBeenCalledWith(chainToChainSwap, transactionId, minerFee);

    expect(eventEmitted).toBeTruthy();
  });

  test('should handle claimed submarine swaps', async () => {
    let eventsEmitted = 0;

    eventHandler.on('swap.update', (id, message) => {
      expect(id).toEqual(swap.id);
      expect(message).toEqual({
        status: SwapUpdateEvent.TransactionClaimed,
      });

      eventsEmitted += 1;
    });
    eventHandler.on('swap.success', (successfulSwap, swapType) => {
      expect(successfulSwap).toEqual(swap);
      expect(swapType).toEqual(SwapType.Submarine);

      eventsEmitted += 1;
    });

    const id = 'id';
    const minerFee = 3414;

    emitClaim(id, minerFee);

    await wait(20);

    expect(mockGetSwap).toHaveBeenCalledTimes(1);
    expect(mockGetSwap).toHaveBeenCalledWith({
      id: {
        [Op.eq]: id,
      },
    });

    expect(mockSetMinerFee).toHaveBeenCalledTimes(1);
    expect(mockSetMinerFee).toHaveBeenCalledWith(swap, minerFee);

    expect(eventsEmitted).toEqual(2);
  });

  test('should handle claimed chain to chain swaps', async () => {
    let eventsEmitted = 0;

    eventHandler.on('swap.update', (id, message) => {
      expect(id).toEqual(chainToChainSwap.id);
      expect(message).toEqual({
        status: SwapUpdateEvent.TransactionClaimed,
      });

      eventsEmitted += 1;
    });
    eventHandler.on('swap.success', (successfulSwap, swapType) => {
      expect(successfulSwap).toEqual(chainToChainSwap);
      expect(swapType).toEqual(SwapType.ChainToChain);

      eventsEmitted += 1;
    });

    const id = 'id';
    const minerFee = 3414;
    const preimage = 'ecbb75d9599a986952774d68c6be25625a41f7cc1097750f728b6c45cdb2c114';

    emitClaim(id, minerFee, preimage);

    await wait(20);

    expect(mockGetChainToChainSwap).toHaveBeenCalledTimes(1);
    expect(mockGetChainToChainSwap).toHaveBeenCalledWith({
      id: {
        [Op.eq]: id,
      },
    });

    expect(mockSetClaimDetails).toHaveBeenCalledTimes(1);
    expect(mockSetClaimDetails).toHaveBeenCalledWith(chainToChainSwap, preimage, minerFee);

    expect(eventsEmitted).toEqual(2);
  });

  test('should handle aborted swaps', async () => {
    let eventsEmitted = 0;

    eventHandler.on('swap.update', (id, message) => {
      if (id !== swap.id) {
        expect(id).toEqual(chainToChainSwap.id);
      }

      expect(message).toEqual({
        status: SwapUpdateEvent.SwapAborted,
      });

      eventsEmitted += 1;
    });
    eventHandler.on('swap.failure', (failedSwap, swapType, reason) => {
      if (failedSwap.id === swap.id) {
        expect(swapType).toEqual(SwapType.Submarine);
      } else {
        expect(failedSwap).toEqual(chainToChainSwap);
        expect(swapType).toEqual(SwapType.ChainToChain);
      }

      expect(reason).toEqual(error);

      eventsEmitted += 1;
    });

    const id = 'id';
    const error = 'because';

    emitAbortion(id, error);

    await wait(20);

    expect(mockGetSwap).toHaveBeenCalledTimes(1);
    expect(mockGetSwap).toHaveBeenCalledWith({
      id: {
        [Op.eq]: id,
      },
    });

    expect(mockSetSwapStatus).toHaveBeenCalledTimes(1);
    expect(mockSetSwapStatus).toHaveBeenCalledWith(swap, SwapUpdateEvent.SwapAborted);

    expect(mockGetChainToChainSwap).toHaveBeenCalledTimes(1);
    expect(mockGetChainToChainSwap).toHaveBeenCalledWith({
      id: {
        [Op.eq]: id,
      },
    });

    expect(mockSetChainToChainSwapStatus).toHaveBeenCalledTimes(1);
    expect(mockSetChainToChainSwapStatus).toHaveBeenCalledWith(chainToChainSwap, SwapUpdateEvent.SwapAborted);

    expect(eventsEmitted).toEqual(4);
  });

  test('should handle expired swaps', async () => {
    let eventsEmitted = 0;

    eventHandler.on('swap.update', (id, message) => {
      if (id !== swap.id) {
        expect(id).toEqual(chainToChainSwap.id);
      }

      expect(message).toEqual({
        status: SwapUpdateEvent.SwapExpired,
      });

      eventsEmitted += 1;
    });
    eventHandler.on('swap.failure', (failedSwap, swapType, reason) => {
      if (failedSwap.id === swap.id) {
        expect(swapType).toEqual(SwapType.Submarine);
      } else {
        expect(failedSwap).toEqual(chainToChainSwap);
        expect(swapType).toEqual(SwapType.ChainToChain);
      }

      expect(reason).toEqual(Errors.ONCHAIN_HTLC_TIMED_OUT().message);

      eventsEmitted += 1;
    });

    const id = 'id';

    emitExpiration(id);

    await wait(20);

    expect(mockGetSwap).toHaveBeenCalledTimes(1);
    expect(mockGetSwap).toHaveBeenCalledWith({
      id: {
        [Op.eq]: id,
      },
    });

    expect(mockSetSwapStatus).toHaveBeenCalledTimes(1);
    expect(mockSetSwapStatus).toHaveBeenCalledWith(swap, SwapUpdateEvent.SwapExpired);

    expect(mockGetChainToChainSwap).toHaveBeenCalledTimes(1);
    expect(mockGetChainToChainSwap).toHaveBeenCalledWith({
      id: {
        [Op.eq]: id,
      },
    });

    expect(mockSetChainToChainSwapStatus).toHaveBeenCalledTimes(1);
    expect(mockSetChainToChainSwapStatus).toHaveBeenCalledWith(chainToChainSwap, SwapUpdateEvent.SwapExpired);

    expect(eventsEmitted).toEqual(4);
  });

  test('should handle refunded swaps', async () => {
    let eventsEmitted = 0;

    eventHandler.on('swap.update', (id, message) => {
      if (id === reverseSwap.id) {
        expect(message).toEqual({
          status: SwapUpdateEvent.TransactionRefunded,
        });
      } else {
        expect(id).toEqual(chainToChainSwap.id);
        expect(message).toEqual({
          status: SwapUpdateEvent.BoltzTransactionRefunded,
        });
      }

      eventsEmitted += 1;
    });
    eventHandler.on('swap.failure', (failedSwap, swapType, reason) => {
      if (failedSwap.id === reverseSwap.id) {
        expect(swapType).toEqual(SwapType.ReverseSubmarine);
      } else {
        expect(failedSwap).toEqual(chainToChainSwap);
        expect(swapType).toEqual(SwapType.ChainToChain);
      }

      expect(reason).toEqual(Errors.ONCHAIN_HTLC_TIMED_OUT().message);

      eventsEmitted += 1;
    });

    const lockupTransactionId = 'e4a789d16a24a6643dfee06e018ad27648b896daae6a3577ae0f4eddcc4d9174';
    const minerFee = 99606;

    emitRefund(lockupTransactionId, minerFee);

    await wait(20);

    expect(mockGetReverseSwap).toHaveBeenCalledTimes(1);
    expect(mockGetReverseSwap).toHaveBeenCalledWith({
      transactionId: {
        [Op.eq]: lockupTransactionId,
      },
    });

    expect(mockSetTransactionRefunded).toHaveBeenCalledTimes(1);
    expect(mockSetTransactionRefunded).toHaveBeenCalledWith(reverseSwap, minerFee);

    expect(mockGetChainToChainSwap).toHaveBeenCalledTimes(1);
    expect(mockGetChainToChainSwap).toHaveBeenCalledWith({
      sendingTransactionId: {
        [Op.eq]: lockupTransactionId,
      },
    });

    expect(mockSetSendingTransactionRefunded).toHaveBeenCalledTimes(1);
    expect(mockSetSendingTransactionRefunded).toHaveBeenCalledWith(chainToChainSwap, minerFee);

    expect(eventsEmitted).toEqual(4);
  });

  test('should handle channel backups', async () => {
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
