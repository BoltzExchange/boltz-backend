import { Transaction } from 'bitcoinjs-lib';
import { EventEmitter } from 'events';
import { Op } from 'sequelize';
import Logger from '../../../lib/Logger';
import {
  CurrencyType,
  OrderSide,
  SwapType,
  SwapUpdateEvent,
} from '../../../lib/consts/Enums';
import type ReverseSwap from '../../../lib/db/models/ReverseSwap';
import { NodeType } from '../../../lib/db/models/ReverseSwap';
import type { ChainSwapInfo } from '../../../lib/db/repositories/ChainSwapRepository';
import ChainSwapRepository from '../../../lib/db/repositories/ChainSwapRepository';
import ReverseSwapRepository from '../../../lib/db/repositories/ReverseSwapRepository';
import SwapRepository from '../../../lib/db/repositories/SwapRepository';
import WrappedSwapRepository from '../../../lib/db/repositories/WrappedSwapRepository';
import type { LightningClient } from '../../../lib/lightning/LightningClient';
import type NotificationClient from '../../../lib/notifications/NotificationClient';
import Errors from '../../../lib/swap/Errors';
import SwapNursery from '../../../lib/swap/SwapNursery';
import type { Currency } from '../../../lib/wallet/WalletManager';

let mockGetSwapResult: any = null;
let mockGetChainSwapResult: any = null;

jest.mock('../../../lib/db/repositories/SwapRepository');
jest.mock('../../../lib/db/repositories/ReverseSwapRepository');
jest.mock('../../../lib/db/repositories/ChainSwapRepository');
jest.mock('../../../lib/db/repositories/WrappedSwapRepository');

// Mock all the classes that SwapNursery instantiates
jest.mock('../../../lib/swap/hooks/TransactionHook', () =>
  jest.fn().mockImplementation(() => ({})),
);
jest.mock('../../../lib/swap/OverpaymentProtector', () =>
  jest.fn().mockImplementation(() => ({})),
);
jest.mock('../../../lib/swap/UtxoNursery', () => {
  return jest.fn().mockImplementation(() => {
    const emitter = new EventEmitter();
    return {
      on: emitter.on.bind(emitter),
      emit: emitter.emit.bind(emitter),
      bindCurrency: jest.fn(),
    };
  });
});
jest.mock('../../../lib/swap/InvoiceNursery', () =>
  jest.fn().mockImplementation(() => ({ on: jest.fn(), init: jest.fn() })),
);
jest.mock('../../../lib/swap/EthereumNursery', () =>
  jest.fn().mockImplementation(() => ({ on: jest.fn() })),
);
jest.mock('../../../lib/lightning/PendingPaymentTracker', () =>
  jest.fn().mockImplementation(() => ({ init: jest.fn() })),
);
jest.mock('../../../lib/swap/PaymentHandler', () =>
  jest.fn().mockImplementation(() => ({ selfPaymentClient: {} })),
);
jest.mock('../../../lib/swap/RefundWatcher', () =>
  jest.fn().mockImplementation(() => ({ on: jest.fn(), init: jest.fn() })),
);

jest.mock('../../../lib/swap/LightningNursery', () => {
  const MockLightningNursery = jest.fn().mockImplementation(() => ({
    bindCurrencies: jest.fn(),
    on: jest.fn(),
  }));

  (MockLightningNursery as any).cancelReverseInvoices = jest
    .fn()
    .mockResolvedValue(undefined);
  (MockLightningNursery as any).lightningClientCallTimeout = 100;

  return {
    __esModule: true,
    default: MockLightningNursery,
  };
});

// Get mocked functions after mocks are set up
const LightningNurseryMock = jest.requireMock(
  '../../../lib/swap/LightningNursery',
);
const LightningNursery = LightningNurseryMock.default;
const lightningClientCallTimeout = 100;

// Create mock Lightning clients
const mockRaceCall = jest.fn().mockResolvedValue(undefined);
const mockSettleHoldInvoice = jest.fn().mockResolvedValue(undefined);

const buildMockClient = (id: string, type: NodeType, name: string) =>
  ({
    id,
    type,
    isConnected: jest.fn().mockReturnValue(true),
    raceCall: mockRaceCall,
    settleHoldInvoice: mockSettleHoldInvoice,
    serviceName: jest.fn().mockReturnValue(name),
  }) as unknown as LightningClient;

const mockLndClient = buildMockClient('lnd-1', NodeType.LND, 'LND');
const mockClnClient = buildMockClient('cln-1', NodeType.CLN, 'CLN');

describe('SwapNursery', () => {
  const mockLogger = Logger.disabledLogger;

  const mockNotifications = {
    sendMessage: jest.fn(),
  } as unknown as NotificationClient;

  const mockChainClient = {
    symbol: 'BTC',
  } as any;

  const mockWallet = {
    symbol: 'BTC',
  } as any;

  const mockCurrency: Currency = {
    symbol: 'BTC',
    type: CurrencyType.BitcoinLike,
    lndClients: new Map([[mockLndClient.id, mockLndClient]]),
    clnClient: mockClnClient,
    chainClient: mockChainClient,
  } as Currency;

  const mockWalletManager = {
    ethereumManagers: [],
    wallets: new Map([['BTC', mockWallet]]),
  } as any;

  const mockClaimer = {
    on: jest.fn(),
    setAttemptSettle: jest.fn(),
  } as any;

  const mockChainSwapSigner = {
    setAttemptSettle: jest.fn(),
    on: jest.fn(),
  } as any;

  let swapNursery: SwapNursery;

  afterEach(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(mockLogger, 'info');
    jest.spyOn(mockLogger, 'error');
    jest.spyOn(mockLogger, 'debug');
    jest.spyOn(mockLogger, 'silly');
    jest.spyOn(mockLogger, 'warn');
    jest.spyOn(mockLogger, 'verbose');

    (SwapRepository.getSwap as jest.Mock).mockImplementation(async () => {
      return mockGetSwapResult;
    });

    (ChainSwapRepository.getChainSwap as jest.Mock).mockImplementation(
      async () => {
        return mockGetChainSwapResult;
      },
    );

    (ReverseSwapRepository.setInvoiceSettled as jest.Mock).mockImplementation(
      async (reverseSwap, preimage) => {
        return {
          ...reverseSwap,
          preimage,
          status: SwapUpdateEvent.InvoiceSettled,
        } as any;
      },
    );

    // Reset the mock functions to known state
    mockRaceCall.mockReset().mockResolvedValue(undefined);
    mockSettleHoldInvoice.mockReset().mockResolvedValue(undefined);
    LightningNursery.cancelReverseInvoices
      .mockReset()
      .mockResolvedValue(undefined);

    swapNursery = new SwapNursery(
      mockLogger,
      {} as any,
      mockNotifications,
      {} as any,
      {} as any,
      {} as any,
      mockWalletManager,
      {} as any,
      0,
      mockClaimer,
      mockChainSwapSigner,
      {} as any,
      {} as any,
    );

    // Set up private/public properties using property access notation
    (swapNursery as any).logger = mockLogger;
    (swapNursery as any).notifications = mockNotifications;
    swapNursery.currencies = new Map([['BTC', mockCurrency]]);

    mockGetSwapResult = null;
    mockGetChainSwapResult = null;
  });

  describe('settleReverseSwapInvoice', () => {
    const mockPreimage = Buffer.from('preimage');
    const mockReverseSwap: ReverseSwap = {
      id: 'reverse-swap-id',
      pair: 'BTC/BTC',
      orderSide: OrderSide.BUY,
      preimageHash: 'preimage-hash',
      invoice: 'invoice-123',
      nodeId: mockLndClient.id,
    } as ReverseSwap;

    test('should settle hold invoice when no matching submarine swap exists', async () => {
      mockGetSwapResult = null;

      const eventPromise = new Promise<any>((resolve) => {
        swapNursery.once('invoice.settled', (settledSwap) => {
          resolve(settledSwap);
        });
      });

      await swapNursery.settleReverseSwapInvoice(mockReverseSwap, mockPreimage);

      const settledSwap = await eventPromise;
      expect(settledSwap).toEqual({
        ...mockReverseSwap,
        preimage: mockPreimage.toString('hex'),
        status: SwapUpdateEvent.InvoiceSettled,
      });

      expect(SwapRepository.getSwap).toHaveBeenCalledWith({
        preimageHash: mockReverseSwap.preimageHash,
        status: {
          [Op.in]: [
            SwapUpdateEvent.InvoicePending,
            SwapUpdateEvent.InvoicePaid,
            SwapUpdateEvent.TransactionClaimPending,
            SwapUpdateEvent.TransactionClaimed,
          ],
        },
      });

      expect(LightningNursery.cancelReverseInvoices).not.toHaveBeenCalled();
      expect(mockRaceCall).toHaveBeenCalledWith(
        expect.any(Promise),
        expect.any(Function),
        lightningClientCallTimeout,
      );

      expect(ReverseSwapRepository.setInvoiceSettled).toHaveBeenCalledWith(
        mockReverseSwap,
        mockPreimage.toString('hex'),
      );
    });

    test('should cancel reverse invoices when matching submarine swap with same invoice exists', async () => {
      const matchingSubmarineSwap = {
        id: 'submarine-swap-id',
        preimageHash: mockReverseSwap.preimageHash,
        invoice: mockReverseSwap.invoice,
        status: SwapUpdateEvent.InvoicePending,
      };
      mockGetSwapResult = matchingSubmarineSwap;

      const eventPromise = new Promise<any>((resolve) => {
        swapNursery.once('invoice.settled', (settledSwap) => {
          resolve(settledSwap);
        });
      });

      await swapNursery.settleReverseSwapInvoice(mockReverseSwap, mockPreimage);

      const settledSwap = await eventPromise;
      expect(settledSwap).toEqual({
        ...mockReverseSwap,
        preimage: mockPreimage.toString('hex'),
        status: SwapUpdateEvent.InvoiceSettled,
      });

      expect(SwapRepository.getSwap).toHaveBeenCalledWith({
        preimageHash: mockReverseSwap.preimageHash,
        status: {
          [Op.in]: [
            SwapUpdateEvent.InvoicePending,
            SwapUpdateEvent.InvoicePaid,
            SwapUpdateEvent.TransactionClaimPending,
            SwapUpdateEvent.TransactionClaimed,
          ],
        },
      });

      expect(LightningNursery.cancelReverseInvoices).toHaveBeenCalledWith(
        mockLndClient,
        mockReverseSwap,
        true,
      );
      expect(mockRaceCall).not.toHaveBeenCalled();
      expect(mockSettleHoldInvoice).not.toHaveBeenCalled();

      expect(ReverseSwapRepository.setInvoiceSettled).toHaveBeenCalledWith(
        mockReverseSwap,
        mockPreimage.toString('hex'),
      );
    });

    test('should settle hold invoice when matching submarine swap has different invoice', async () => {
      const matchingSubmarineSwap = {
        id: 'submarine-swap-id',
        preimageHash: mockReverseSwap.preimageHash,
        invoice: 'different-invoice',
        status: SwapUpdateEvent.InvoicePending,
      };
      mockGetSwapResult = matchingSubmarineSwap;

      const eventPromise = new Promise<void>((resolve) => {
        swapNursery.once('invoice.settled', () => {
          resolve();
        });
      });

      await swapNursery.settleReverseSwapInvoice(mockReverseSwap, mockPreimage);

      await eventPromise;

      expect(LightningNursery.cancelReverseInvoices).not.toHaveBeenCalled();
      expect(mockRaceCall).toHaveBeenCalledWith(
        expect.any(Promise),
        expect.any(Function),
        lightningClientCallTimeout,
      );

      expect(ReverseSwapRepository.setInvoiceSettled).toHaveBeenCalledWith(
        mockReverseSwap,
        mockPreimage.toString('hex'),
      );
    });

    test('should settle hold invoice when matching submarine swap is undefined', async () => {
      mockGetSwapResult = undefined;

      const eventPromise = new Promise<void>((resolve) => {
        swapNursery.once('invoice.settled', () => {
          resolve();
        });
      });

      await swapNursery.settleReverseSwapInvoice(mockReverseSwap, mockPreimage);

      await eventPromise;

      expect(LightningNursery.cancelReverseInvoices).not.toHaveBeenCalled();
      expect(mockRaceCall).toHaveBeenCalledWith(
        expect.any(Promise),
        expect.any(Function),
        lightningClientCallTimeout,
      );

      expect(ReverseSwapRepository.setInvoiceSettled).toHaveBeenCalledWith(
        mockReverseSwap,
        mockPreimage.toString('hex'),
      );
    });

    test('should handle errors and send notifications', async () => {
      const mockError = new Error('Settlement failed');
      mockGetSwapResult = null;
      mockRaceCall.mockRejectedValueOnce(mockError);

      await swapNursery.settleReverseSwapInvoice(mockReverseSwap, mockPreimage);

      const expectedMessage = `Could not settle invoice of ${mockReverseSwap.id} on node ${mockReverseSwap.nodeId}: ${mockError.message}`;
      expect(mockLogger.error).toHaveBeenCalledWith(expectedMessage);
      expect(mockNotifications.sendMessage).toHaveBeenCalledWith(
        expectedMessage,
        true,
      );

      expect(swapNursery.listenerCount('invoice.settled')).toBe(0);
    });

    test('should handle cancellation failure gracefully and continue settlement', async () => {
      const mockError = new Error('unable to locate invoice');
      const matchingSubmarineSwap = {
        id: 'submarine-swap-id',
        preimageHash: mockReverseSwap.preimageHash,
        invoice: mockReverseSwap.invoice,
        status: SwapUpdateEvent.InvoicePending,
      };
      mockGetSwapResult = matchingSubmarineSwap;
      LightningNursery.cancelReverseInvoices.mockRejectedValueOnce(mockError);

      const eventPromise = new Promise<void>((resolve) => {
        swapNursery.once('invoice.settled', () => {
          resolve();
        });
      });

      await swapNursery.settleReverseSwapInvoice(mockReverseSwap, mockPreimage);

      await eventPromise;

      expect(LightningNursery.cancelReverseInvoices).toHaveBeenCalledWith(
        mockLndClient,
        mockReverseSwap,
        true,
      );

      // Should handle cancellation failure gracefully - no errors thrown or notifications sent
      expect(mockLogger.error).not.toHaveBeenCalled();
      expect(mockNotifications.sendMessage).not.toHaveBeenCalled();

      // Should still complete successfully despite cancellation failure
      expect(ReverseSwapRepository.setInvoiceSettled).toHaveBeenCalledWith(
        mockReverseSwap,
        mockPreimage.toString('hex'),
      );
    });

    test('should work when notifications client is undefined', async () => {
      const nurseryWithoutNotifications = new SwapNursery(
        mockLogger,
        {} as any,
        undefined,
        {} as any,
        {} as any,
        {} as any,
        mockWalletManager,
        {} as any,
        0,
        mockClaimer,
        mockChainSwapSigner,
        {} as any,
        {} as any,
      );

      // Set up private/public properties using property access notation
      (nurseryWithoutNotifications as any).logger = mockLogger;
      (nurseryWithoutNotifications as any).notifications = undefined;
      nurseryWithoutNotifications.currencies = new Map([['BTC', mockCurrency]]);

      const mockError = new Error('Settlement failed');
      mockGetSwapResult = null;
      mockRaceCall.mockRejectedValueOnce(mockError);

      await nurseryWithoutNotifications.settleReverseSwapInvoice(
        mockReverseSwap,
        mockPreimage,
      );

      expect(mockLogger.error).toHaveBeenCalled();
    });

    test('should use correct timeout for lightning client race call', async () => {
      mockGetSwapResult = null;

      const eventPromise = new Promise<void>((resolve) => {
        swapNursery.once('invoice.settled', () => resolve());
      });

      await swapNursery.settleReverseSwapInvoice(mockReverseSwap, mockPreimage);

      await eventPromise;

      expect(mockRaceCall).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(Function),
        lightningClientCallTimeout,
      );
    });

    test('should call timeout callback with correct message', async () => {
      mockGetSwapResult = null;
      let timeoutCallback: (message: string) => void;

      mockRaceCall.mockImplementationOnce((_promise, callback) => {
        timeoutCallback = callback;
        // Call the callback to simulate timeout and return rejected promise
        callback('invoice settlement timed out');
        return Promise.reject(new Error('invoice settlement timed out'));
      });

      try {
        await swapNursery.settleReverseSwapInvoice(
          mockReverseSwap,
          mockPreimage,
        );
      } catch {
        // Expected to throw due to timeout
      }

      expect(timeoutCallback!).toBeDefined();
    });
  });

  describe('invoice expiry handling', () => {
    test('should warn and skip when reverse swap node is unavailable', async () => {
      swapNursery.currencies.set('BTC', {
        ...mockCurrency,
        clnClient: undefined,
        lndClients: new Map(),
      } as Currency);

      const reverseSwap = {
        id: 'reverse-swap-id',
        pair: 'BTC/BTC',
        orderSide: OrderSide.BUY,
        nodeId: 'missing-node',
        status: SwapUpdateEvent.SwapCreated,
      } as ReverseSwap;

      jest
        .spyOn(ReverseSwapRepository, 'getReverseSwap')
        .mockResolvedValue(reverseSwap);

      await swapNursery.init([mockCurrency]);

      const invoiceExpiredHandler = (
        swapNursery as any
      ).invoiceNursery.on.mock.calls.find(
        ([event]: [string]) => event === 'invoice.expired',
      )?.[1];

      expect(invoiceExpiredHandler).toBeDefined();

      await invoiceExpiredHandler({
        id: reverseSwap.id,
      });

      expect(ReverseSwapRepository.getReverseSwap).toHaveBeenCalledWith({
        id: reverseSwap.id,
      });

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Skipping invoice expiry handling of Reverse Swap reverse-swap-id: node missing-node not found for reverse swap reverse-swap-id',
      );
    });
  });

  describe('chainSwap.lockup', () => {
    let baseMockChainSwap: ChainSwapInfo;
    let mockTransaction: any;
    let mockHandleChainSwapLockup: jest.SpyInstance;

    beforeEach(async () => {
      baseMockChainSwap = {
        id: 'test-chain-swap-id',
        type: SwapType.Chain,
        createdRefundSignature: false,
        sendingData: {
          transactionId: null,
        },
      } as unknown as ChainSwapInfo;

      mockTransaction = {};

      mockHandleChainSwapLockup = jest
        .spyOn(swapNursery as any, 'handleChainSwapLockup')
        .mockResolvedValue(undefined);
      jest.spyOn(swapNursery, 'emit');

      await swapNursery.init([mockCurrency]);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    test('should handle chainSwap.lockup event successfully', async () => {
      mockGetChainSwapResult = baseMockChainSwap;

      const eventPromise = new Promise<void>((resolve) => {
        swapNursery.once('transaction', ({ swap, transaction, confirmed }) => {
          expect(swap).toEqual(mockGetChainSwapResult);
          expect(transaction).toEqual(mockTransaction);
          expect(confirmed).toEqual(true);
          resolve();
        });
      });

      (swapNursery as any).utxoNursery.emit('chainSwap.lockup', {
        swap: baseMockChainSwap,
        transaction: mockTransaction,
        confirmed: true,
      });

      await eventPromise;

      expect(ChainSwapRepository.getChainSwap).toHaveBeenCalledWith({
        id: baseMockChainSwap.id,
      });
      expect(mockHandleChainSwapLockup).toHaveBeenCalledWith(
        mockGetChainSwapResult,
      );
      expect(swapNursery.emit).toHaveBeenCalledWith('transaction', {
        confirmed: true,
        transaction: mockTransaction,
        swap: mockGetChainSwapResult,
      });
    });

    test('should return early when fetched swap is null', async () => {
      mockGetChainSwapResult = null;

      (swapNursery as any).utxoNursery.emit('chainSwap.lockup', {
        swap: baseMockChainSwap,
        transaction: mockTransaction,
        confirmed: true,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(ChainSwapRepository.getChainSwap).toHaveBeenCalledWith({
        id: baseMockChainSwap.id,
      });
      expect(mockHandleChainSwapLockup).not.toHaveBeenCalled();
      expect(swapNursery.emit).not.toHaveBeenCalledWith(
        'transaction',
        expect.anything(),
      );
    });

    test('should prevent lockup when createdRefundSignature is true', async () => {
      mockGetChainSwapResult = {
        ...baseMockChainSwap,
        createdRefundSignature: true,
      };

      (swapNursery as any).utxoNursery.emit('chainSwap.lockup', {
        swap: baseMockChainSwap,
        transaction: mockTransaction,
        confirmed: true,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(ChainSwapRepository.getChainSwap).toHaveBeenCalledWith({
        id: baseMockChainSwap.id,
      });
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('already signed a refund'),
      );
      expect(mockHandleChainSwapLockup).not.toHaveBeenCalled();
      expect(swapNursery.emit).not.toHaveBeenCalledWith(
        'transaction',
        expect.anything(),
      );
    });

    test('should prevent second lockup when sendingData.transactionId exists', async () => {
      mockGetChainSwapResult = {
        ...baseMockChainSwap,
        sendingData: {
          transactionId: 'existing-transaction-id',
        },
      };

      (swapNursery as any).utxoNursery.emit('chainSwap.lockup', {
        swap: baseMockChainSwap,
        transaction: mockTransaction,
        confirmed: true,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(ChainSwapRepository.getChainSwap).toHaveBeenCalledWith({
        id: baseMockChainSwap.id,
      });
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('second lockup transaction'),
      );
      expect(mockHandleChainSwapLockup).not.toHaveBeenCalled();
      expect(swapNursery.emit).not.toHaveBeenCalledWith(
        'transaction',
        expect.anything(),
      );
    });
  });

  describe('EVM chainSwap.lockup', () => {
    test('should prevent second lockup when EVM nursery emits duplicate chain lockup', async () => {
      const listeners: Record<string, (...args: any[]) => Promise<void>> = {};
      const ethereumNursery = {
        on: jest.fn(
          (event: string, callback: (...args: any[]) => Promise<void>) => {
            listeners[event] = callback;
          },
        ),
        init: jest.fn().mockResolvedValue(undefined),
      } as any;

      const baseMockChainSwap = {
        id: 'test-chain-swap-id',
        type: SwapType.Chain,
        sendingData: {
          transactionId: null,
        },
      } as unknown as ChainSwapInfo;

      mockGetChainSwapResult = {
        ...baseMockChainSwap,
        sendingData: {
          transactionId: 'existing-transaction-id',
        },
      };

      const mockHandleChainSwapLockup = jest
        .spyOn(swapNursery as any, 'handleChainSwapLockup')
        .mockResolvedValue(undefined);
      jest.spyOn(swapNursery, 'emit');

      await (swapNursery as any).listenEthereumNursery(ethereumNursery);
      await listeners['eth.lockup']({
        swap: baseMockChainSwap,
        transactionHash: '0xduplicate',
      });

      expect(ChainSwapRepository.getChainSwap).toHaveBeenCalledWith({
        id: baseMockChainSwap.id,
      });
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('second lockup transaction'),
      );
      expect(mockHandleChainSwapLockup).not.toHaveBeenCalled();
      expect(swapNursery.emit).not.toHaveBeenCalledWith(
        'transaction',
        expect.anything(),
      );
    });
  });

  describe('swap.lockup', () => {
    let baseMockSwap: any;
    let mockTransaction: any;
    let mockPayInvoice: jest.SpyInstance;
    let mockClaimUtxo: jest.SpyInstance;
    let mockSetSwapRate: jest.SpyInstance;

    beforeEach(async () => {
      baseMockSwap = {
        id: 'test-swap-id',
        type: SwapType.Submarine,
        pair: 'BTC/BTC',
        orderSide: OrderSide.BUY,
        createdRefundSignature: false,
        invoice: 'lnbc123...',
      };

      mockTransaction = {};

      mockPayInvoice = jest
        .spyOn(swapNursery as any, 'payInvoice')
        .mockResolvedValue({
          preimage: Buffer.from('preimage'),
        });
      mockClaimUtxo = jest
        .spyOn(swapNursery as any, 'claimUtxo')
        .mockResolvedValue(undefined);
      mockSetSwapRate = jest
        .spyOn(swapNursery as any, 'setSwapRate')
        .mockResolvedValue(undefined);
      jest.spyOn(swapNursery, 'emit');

      await swapNursery.init([mockCurrency]);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    test('should handle swap.lockup event successfully with invoice', async () => {
      mockGetSwapResult = baseMockSwap;

      const eventPromise = new Promise<void>((resolve) => {
        swapNursery.once('transaction', ({ swap, transaction, confirmed }) => {
          expect(swap).toEqual(baseMockSwap);
          expect(transaction).toEqual(mockTransaction);
          expect(confirmed).toEqual(true);
          resolve();
        });
      });

      (swapNursery as any).utxoNursery.emit('swap.lockup', {
        swap: baseMockSwap,
        transaction: mockTransaction,
        confirmed: true,
      });

      await eventPromise;
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(SwapRepository.getSwap).toHaveBeenCalledWith({
        id: baseMockSwap.id,
      });
      expect(mockPayInvoice).toHaveBeenCalledWith(baseMockSwap);
      expect(mockClaimUtxo).toHaveBeenCalledWith(
        baseMockSwap,
        mockChainClient,
        mockWallet,
        mockTransaction,
        Buffer.from('preimage'),
      );
      expect(mockSetSwapRate).not.toHaveBeenCalled();
    });

    test('should handle swap.lockup event successfully without invoice', async () => {
      const swapWithoutInvoice = {
        ...baseMockSwap,
        invoice: null,
      };
      mockGetSwapResult = swapWithoutInvoice;

      const eventPromise = new Promise<void>((resolve) => {
        swapNursery.once('transaction', ({ swap, transaction, confirmed }) => {
          expect(swap).toEqual(swapWithoutInvoice);
          expect(transaction).toEqual(mockTransaction);
          expect(confirmed).toEqual(true);
          resolve();
        });
      });

      (swapNursery as any).utxoNursery.emit('swap.lockup', {
        swap: swapWithoutInvoice,
        transaction: mockTransaction,
        confirmed: true,
      });

      await eventPromise;
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(SwapRepository.getSwap).toHaveBeenCalledWith({
        id: swapWithoutInvoice.id,
      });
      expect(mockPayInvoice).not.toHaveBeenCalled();
      expect(mockClaimUtxo).not.toHaveBeenCalled();
      expect(mockSetSwapRate).toHaveBeenCalledWith(swapWithoutInvoice);
    });

    test('should return early when fetched swap is null', async () => {
      mockGetSwapResult = null;

      (swapNursery as any).utxoNursery.emit('swap.lockup', {
        swap: baseMockSwap,
        transaction: mockTransaction,
        confirmed: true,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(SwapRepository.getSwap).toHaveBeenCalledWith({
        id: baseMockSwap.id,
      });
      expect(mockPayInvoice).not.toHaveBeenCalled();
      expect(mockClaimUtxo).not.toHaveBeenCalled();
      expect(mockSetSwapRate).not.toHaveBeenCalled();
      expect(swapNursery.emit).not.toHaveBeenCalledWith(
        'transaction',
        expect.anything(),
      );
    });

    test('should prevent invoice payment when createdRefundSignature is true', async () => {
      mockGetSwapResult = {
        ...baseMockSwap,
        createdRefundSignature: true,
      };

      (swapNursery as any).utxoNursery.emit('swap.lockup', {
        swap: baseMockSwap,
        transaction: mockTransaction,
        confirmed: true,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(SwapRepository.getSwap).toHaveBeenCalledWith({
        id: baseMockSwap.id,
      });
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('already signed a refund'),
      );
      expect(mockPayInvoice).not.toHaveBeenCalled();
      expect(mockClaimUtxo).not.toHaveBeenCalled();
      expect(mockSetSwapRate).not.toHaveBeenCalled();
      expect(swapNursery.emit).not.toHaveBeenCalledWith(
        'transaction',
        expect.anything(),
      );
    });

    test('should return early when payInvoice returns undefined', async () => {
      mockGetSwapResult = baseMockSwap;
      mockPayInvoice.mockResolvedValueOnce(undefined);

      (swapNursery as any).utxoNursery.emit('swap.lockup', {
        swap: baseMockSwap,
        transaction: mockTransaction,
        confirmed: true,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(SwapRepository.getSwap).toHaveBeenCalledWith({
        id: baseMockSwap.id,
      });
      expect(mockPayInvoice).toHaveBeenCalledWith(baseMockSwap);
      expect(mockClaimUtxo).not.toHaveBeenCalled();
      expect(mockSetSwapRate).not.toHaveBeenCalled();
    });

    test('should emit transaction event before processing payment', async () => {
      mockGetSwapResult = baseMockSwap;
      let transactionEmitted = false;

      swapNursery.once('transaction', () => {
        transactionEmitted = true;
      });

      const originalPayInvoice = mockPayInvoice.getMockImplementation();
      mockPayInvoice.mockImplementationOnce(async (...args) => {
        expect(transactionEmitted).toBe(true);
        return (
          originalPayInvoice?.(...args) || {
            preimage: Buffer.from('preimage'),
          }
        );
      });

      (swapNursery as any).utxoNursery.emit('swap.lockup', {
        swap: baseMockSwap,
        transaction: mockTransaction,
        confirmed: true,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockPayInvoice).toHaveBeenCalled();
    });
  });

  describe('ark swap.lockup', () => {
    const mockArkNode = {} as any;

    let baseMockSwap: any;
    let mockPayInvoice: jest.SpyInstance;
    let mockClaimVtxo: jest.SpyInstance;
    let mockSetSwapRate: jest.SpyInstance;

    beforeEach(async () => {
      baseMockSwap = {
        id: 'test-ark-swap-id',
        type: SwapType.Submarine,
        pair: 'BTC/BTC',
        orderSide: OrderSide.BUY,
        createdRefundSignature: false,
        invoice: 'lnbc123...',
        status: SwapUpdateEvent.TransactionConfirmed,
      };

      mockPayInvoice = jest
        .spyOn(swapNursery as any, 'payInvoice')
        .mockResolvedValue({
          preimage: Buffer.from('preimage'),
        });
      mockClaimVtxo = jest
        .spyOn(swapNursery as any, 'claimVtxo')
        .mockResolvedValue(undefined);
      mockSetSwapRate = jest
        .spyOn(swapNursery as any, 'setSwapRate')
        .mockResolvedValue(undefined);
      jest.spyOn(swapNursery, 'emit');

      (mockCurrency as any).arkNode = mockArkNode;

      await swapNursery.init([mockCurrency]);
    });

    afterEach(() => {
      jest.clearAllMocks();
      delete (mockCurrency as any).arkNode;
    });

    test('should process the first ARK lockup notification', async () => {
      mockGetSwapResult = baseMockSwap;

      const eventPromise = new Promise<void>((resolve) => {
        swapNursery.once('transaction', ({ swap, transaction, confirmed }) => {
          expect(swap).toEqual(baseMockSwap);
          expect(transaction).toEqual('ark-lockup-id');
          expect(confirmed).toEqual(true);
          resolve();
        });
      });

      (swapNursery as any).arkNursery.emit('swap.lockup', {
        swap: baseMockSwap,
        lockupTransactionId: 'ark-lockup-id',
      });

      await eventPromise;
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(SwapRepository.getSwap).toHaveBeenCalledWith({
        id: baseMockSwap.id,
      });
      expect(mockPayInvoice).toHaveBeenCalledWith(baseMockSwap);
      expect(mockClaimVtxo).toHaveBeenCalledWith(
        baseMockSwap,
        mockArkNode,
        Buffer.from('preimage'),
      );
      expect(mockSetSwapRate).not.toHaveBeenCalled();
    });

    test('should ignore duplicate ARK lockup notifications after processing started', async () => {
      mockGetSwapResult = {
        ...baseMockSwap,
        status: SwapUpdateEvent.TransactionClaimed,
      };

      (swapNursery as any).arkNursery.emit('swap.lockup', {
        swap: baseMockSwap,
        lockupTransactionId: 'ark-lockup-id',
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(SwapRepository.getSwap).toHaveBeenCalledWith({
        id: baseMockSwap.id,
      });
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('already being processed'),
      );
      expect(mockPayInvoice).not.toHaveBeenCalled();
      expect(mockClaimVtxo).not.toHaveBeenCalled();
      expect(mockSetSwapRate).not.toHaveBeenCalled();
      expect(swapNursery.emit).not.toHaveBeenCalledWith(
        'transaction',
        expect.anything(),
      );
    });

    test('should prevent invoice payment when refund signing already started', async () => {
      mockGetSwapResult = {
        ...baseMockSwap,
        createdRefundSignature: true,
      };

      (swapNursery as any).arkNursery.emit('swap.lockup', {
        swap: baseMockSwap,
        lockupTransactionId: 'ark-lockup-id',
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(SwapRepository.getSwap).toHaveBeenCalledWith({
        id: baseMockSwap.id,
      });
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('already signed a refund'),
      );
      expect(mockPayInvoice).not.toHaveBeenCalled();
      expect(mockClaimVtxo).not.toHaveBeenCalled();
      expect(mockSetSwapRate).not.toHaveBeenCalled();
      expect(swapNursery.emit).not.toHaveBeenCalledWith(
        'transaction',
        expect.anything(),
      );
    });
  });

  describe('claimVtxo', () => {
    const mockArkClient = {
      claimVHtlc: jest.fn().mockResolvedValue('ark-claim-tx'),
      pubkey: Buffer.from('03'.repeat(33), 'hex'),
      symbol: 'ARK',
    } as any;

    beforeEach(() => {
      (SwapRepository.setMinerFee as jest.Mock).mockResolvedValue({});
      (ChainSwapRepository.setClaimMinerFee as jest.Mock).mockResolvedValue({});
      jest.spyOn(swapNursery, 'emit');
    });

    test('should pass lockup outpoint when claiming submarine ARK swaps', async () => {
      const swap = {
        id: 'submarine-ark-swap',
        type: SwapType.Submarine,
        theirRefundPublicKey: '02'.repeat(33),
        lockupTransactionId: 'submarine-lockup-tx',
        lockupTransactionVout: 4,
      } as any;

      await (swapNursery as any).claimVtxo(
        swap,
        mockArkClient,
        Buffer.from('preimage'),
      );

      expect(mockArkClient.claimVHtlc).toHaveBeenCalledWith(
        Buffer.from('preimage'),
        Buffer.from('02'.repeat(33), 'hex'),
        mockArkClient.pubkey,
        {
          txId: 'submarine-lockup-tx',
          vout: 4,
        },
        expect.any(String),
      );
      expect(SwapRepository.setMinerFee).toHaveBeenCalledWith(swap, 0);
    });

    test('should pass receiving outpoint when claiming chain ARK swaps', async () => {
      const swap = {
        id: 'chain-ark-swap',
        type: SwapType.Chain,
        theirRefundPublicKey: '02'.repeat(33),
        receivingData: {
          transactionId: 'chain-lockup-tx',
          transactionVout: 7,
        },
      } as unknown as ChainSwapInfo;

      await (swapNursery as any).claimVtxo(
        swap,
        mockArkClient,
        Buffer.from('preimage'),
      );

      expect(mockArkClient.claimVHtlc).toHaveBeenCalledWith(
        Buffer.from('preimage'),
        Buffer.from('02'.repeat(33), 'hex'),
        mockArkClient.pubkey,
        {
          txId: 'chain-lockup-tx',
          vout: 7,
        },
        expect.any(String),
      );
      expect(ChainSwapRepository.setClaimMinerFee).toHaveBeenCalledWith(
        swap,
        Buffer.from('preimage'),
        0,
      );
    });
  });

  describe('ark swap.expired', () => {
    const mockExpiredSwap = {
      id: 'ark-submarine-swap',
      type: SwapType.Submarine,
      status: SwapUpdateEvent.TransactionConfirmed,
    } as any;

    beforeEach(async () => {
      mockGetSwapResult = mockExpiredSwap;

      (SwapRepository.setSwapStatus as jest.Mock).mockResolvedValue({
        ...mockExpiredSwap,
        status: SwapUpdateEvent.SwapExpired,
        failureReason: Errors.ONCHAIN_HTLC_TIMED_OUT().message,
      });

      await swapNursery.init([mockCurrency]);
    });

    test('should expire ARK submarine swaps through SwapNursery', async () => {
      const eventPromise = new Promise<any>((resolve) => {
        swapNursery.once('expiration', (swap) => {
          resolve(swap);
        });
      });

      (swapNursery as any).arkNursery.emit('swap.expired', mockExpiredSwap);

      const emittedSwap = await eventPromise;

      expect(SwapRepository.getSwap).toHaveBeenCalledWith({
        id: mockExpiredSwap.id,
      });
      expect(SwapRepository.setSwapStatus).toHaveBeenCalledWith(
        mockExpiredSwap,
        SwapUpdateEvent.SwapExpired,
        Errors.ONCHAIN_HTLC_TIMED_OUT().message,
      );
      expect(emittedSwap).toEqual({
        ...mockExpiredSwap,
        status: SwapUpdateEvent.SwapExpired,
        failureReason: Errors.ONCHAIN_HTLC_TIMED_OUT().message,
      });
    });
  });

  describe('handleSwapSendFailed', () => {
    let mockReverseSwap: ReverseSwap;

    beforeEach(async () => {
      mockReverseSwap = {
        id: 'swap',
        nodeId: mockLndClient.id,
        expectedAmount: 110000,
        onchainAmount: 100000,
        type: SwapType.ReverseSubmarine,
        status: SwapUpdateEvent.SwapCreated,
      } as ReverseSwap;

      WrappedSwapRepository.setStatus = jest
        .fn()
        .mockResolvedValue(mockReverseSwap);

      await swapNursery.init([mockCurrency]);
    });

    test('should successfully cancel invoices when no error occurs', async () => {
      LightningNursery.cancelReverseInvoices
        .mockReset()
        .mockResolvedValueOnce(undefined);

      const sendError = new Error('Failed to send transaction');

      await (swapNursery as any).handleSwapSendFailed(
        mockReverseSwap,
        'BTC',
        sendError,
        mockLndClient,
      );

      expect(LightningNursery.cancelReverseInvoices).toHaveBeenCalledWith(
        mockLndClient,
        mockReverseSwap,
        false,
      );

      expect(mockLogger.warn).toHaveBeenCalledTimes(1);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          `Failed to lockup ${mockReverseSwap.onchainAmount} BTC`,
        ),
      );

      expect(WrappedSwapRepository.setStatus).toHaveBeenCalledWith(
        mockReverseSwap,
        SwapUpdateEvent.TransactionFailed,
        Errors.COINS_COULD_NOT_BE_SENT().message,
      );
    });

    test('should handle errors when canceling invoices', async () => {
      const mockError = new Error('unable to locate invoice');
      LightningNursery.cancelReverseInvoices
        .mockReset()
        .mockRejectedValueOnce(mockError);

      const sendError = new Error('Failed to send transaction');

      await (swapNursery as any).handleSwapSendFailed(
        mockReverseSwap,
        'BTC',
        sendError,
        mockLndClient,
      );

      expect(LightningNursery.cancelReverseInvoices).toHaveBeenCalledWith(
        mockLndClient,
        mockReverseSwap,
        false,
      );

      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Could not cancel invoices of Reverse Swap ${mockReverseSwap.id}: ${mockError.message}`,
      );

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          `Failed to lockup ${mockReverseSwap.onchainAmount} BTC`,
        ),
      );

      expect(WrappedSwapRepository.setStatus).toHaveBeenCalledWith(
        mockReverseSwap,
        SwapUpdateEvent.TransactionFailed,
        Errors.COINS_COULD_NOT_BE_SENT().message,
      );
    });

    test('should handle swap send failure without lightning client', async () => {
      const sendError = new Error('Failed to send transaction');

      await (swapNursery as any).handleSwapSendFailed(
        mockReverseSwap,
        'BTC',
        sendError,
        undefined,
      );

      expect(LightningNursery.cancelReverseInvoices).not.toHaveBeenCalled();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          `Failed to lockup ${mockReverseSwap.onchainAmount} BTC`,
        ),
      );

      expect(WrappedSwapRepository.setStatus).toHaveBeenCalledWith(
        mockReverseSwap,
        SwapUpdateEvent.TransactionFailed,
        Errors.COINS_COULD_NOT_BE_SENT().message,
      );
    });

    test('should handle ChainSwap send failure', async () => {
      const mockChainSwap = {
        id: 'test-chain-swap',
        type: SwapType.Chain,
        sendingData: {
          expectedAmount: 50000,
        },
      } as ChainSwapInfo;

      const mockUpdatedChainSwap = {
        ...mockChainSwap,
        status: SwapUpdateEvent.TransactionFailed,
        failureReason: 'Coins could not be sent',
      } as ChainSwapInfo;

      (WrappedSwapRepository.setStatus as jest.Mock).mockResolvedValueOnce(
        mockUpdatedChainSwap,
      );

      LightningNursery.cancelReverseInvoices
        .mockReset()
        .mockResolvedValueOnce(undefined);

      const sendError = new Error('Failed to send chain swap transaction');

      await (swapNursery as any).handleSwapSendFailed(
        mockChainSwap,
        'BTC',
        sendError,
        mockLndClient,
      );

      expect(LightningNursery.cancelReverseInvoices).toHaveBeenCalledWith(
        mockLndClient,
        mockChainSwap,
        false,
      );

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          `Failed to lockup ${mockChainSwap.sendingData.expectedAmount} BTC`,
        ),
      );

      expect(WrappedSwapRepository.setStatus).toHaveBeenCalledWith(
        mockChainSwap,
        SwapUpdateEvent.TransactionFailed,
        Errors.COINS_COULD_NOT_BE_SENT().message,
      );
    });
  });

  describe('refund.confirmed', () => {
    const setRefundTransactionUpdateTimeout = (timeout: number) => {
      (SwapNursery as any).refundTransactionUpdateTimeout = timeout;
    };

    afterEach(() => {
      setRefundTransactionUpdateTimeout(1_000);
    });

    test('should emit parsed refund transaction for confirmed BTC refunds', async () => {
      const refundTransaction = new Transaction();
      mockChainClient.getRawTransaction = jest
        .fn()
        .mockResolvedValue(refundTransaction.toHex());
      jest.spyOn(swapNursery, 'emit');

      await swapNursery.init([mockCurrency]);

      const refundConfirmedListener = (
        swapNursery as any
      ).refundWatcher.on.mock.calls.find(
        ([event]: [string]) => event === 'refund.confirmed',
      )?.[1];

      expect(refundConfirmedListener).toBeDefined();

      const swap = {
        id: 'chain-swap-id',
        refundCurrency: 'BTC',
        type: SwapType.Chain,
      } as unknown as ChainSwapInfo;

      await refundConfirmedListener({
        swap,
        refundTransaction: refundTransaction.getId(),
      });

      expect(mockChainClient.getRawTransaction).toHaveBeenCalledWith(
        refundTransaction.getId(),
      );
      const refundEmits = (swapNursery.emit as jest.Mock).mock.calls
        .filter(([event]) => event === 'refund')
        .map(([, args]) => args);

      expect(refundEmits).toHaveLength(1);
      expect(refundEmits[0]).toEqual({
        swap,
        confirmed: true,
        emitFailure: false,
        refundTransaction: expect.objectContaining({
          getId: expect.any(Function),
          toHex: expect.any(Function),
        }),
      });
      expect(refundEmits[0].refundTransaction.getId()).toEqual(
        refundTransaction.getId(),
      );
      expect(refundEmits[0].refundTransaction.toHex()).toEqual(
        refundTransaction.toHex(),
      );
    });

    test('should not block reverse swap cancellation on refund enrichment', async () => {
      setRefundTransactionUpdateTimeout(10);
      const refundTransactionId = 'refund-tx';

      mockChainClient.getRawTransaction = jest
        .fn()
        .mockImplementation(() => new Promise<string>(() => {}));
      jest.spyOn(swapNursery, 'emit');

      await swapNursery.init([mockCurrency]);

      const refundConfirmedListener = (
        swapNursery as any
      ).refundWatcher.on.mock.calls.find(
        ([event]: [string]) => event === 'refund.confirmed',
      )?.[1];

      expect(refundConfirmedListener).toBeDefined();

      const reverseSwap = {
        id: 'reverse-swap-id',
        refundCurrency: 'BTC',
        lightningCurrency: 'BTC',
        nodeId: mockLndClient.id,
        type: SwapType.ReverseSubmarine,
      } as unknown as ReverseSwap;

      await refundConfirmedListener({
        swap: reverseSwap,
        refundTransaction: refundTransactionId,
      });

      expect(LightningNursery.cancelReverseInvoices).toHaveBeenCalledWith(
        mockLndClient,
        reverseSwap,
        true,
      );

      const refundEmits = (swapNursery.emit as jest.Mock).mock.calls
        .filter(([event]) => event === 'refund')
        .map(([, args]) => args);

      expect(refundEmits).toHaveLength(1);
      expect(refundEmits[0]).toEqual({
        swap: reverseSwap,
        confirmed: true,
        emitFailure: false,
        refundTransaction: refundTransactionId,
      });
    });

    test('should fall back to txid when fetching confirmed refund transaction times out', async () => {
      setRefundTransactionUpdateTimeout(1);

      const refundTransactionId = 'refund-tx';
      let resolveRawTransaction!: (value: string) => void;
      mockChainClient.getRawTransaction = jest.fn().mockImplementation(
        () =>
          new Promise<string>((resolve) => {
            resolveRawTransaction = resolve;
          }),
      );
      jest.spyOn(swapNursery, 'emit');

      await swapNursery.init([mockCurrency]);

      const refundConfirmedListener = (
        swapNursery as any
      ).refundWatcher.on.mock.calls.find(
        ([event]: [string]) => event === 'refund.confirmed',
      )?.[1];

      expect(refundConfirmedListener).toBeDefined();

      const swap = {
        id: 'chain-swap-id',
        refundCurrency: 'BTC',
        type: SwapType.Chain,
      } as unknown as ChainSwapInfo;

      await refundConfirmedListener({
        swap,
        refundTransaction: refundTransactionId,
      });

      const refundEmits = (swapNursery.emit as jest.Mock).mock.calls
        .filter(([event]) => event === 'refund')
        .map(([, args]) => args);

      expect(refundEmits).toHaveLength(1);
      expect(refundEmits[0]).toEqual({
        swap,
        confirmed: true,
        emitFailure: false,
        refundTransaction: refundTransactionId,
      });

      resolveRawTransaction(new Transaction().toHex());
      await new Promise<void>((resolve) => {
        setImmediate(resolve);
      });

      expect(
        (swapNursery.emit as jest.Mock).mock.calls.filter(
          ([event]) => event === 'refund',
        ),
      ).toHaveLength(1);
    });

    test('should fall back to txid when fetching confirmed refund transaction fails', async () => {
      const refundTransactionId = 'refund-tx';
      mockChainClient.getRawTransaction = jest
        .fn()
        .mockRejectedValue(new Error('failed to fetch'));
      jest.spyOn(swapNursery, 'emit');

      await swapNursery.init([mockCurrency]);

      const refundConfirmedListener = (
        swapNursery as any
      ).refundWatcher.on.mock.calls.find(
        ([event]: [string]) => event === 'refund.confirmed',
      )?.[1];

      expect(refundConfirmedListener).toBeDefined();

      const swap = {
        id: 'chain-swap-id',
        refundCurrency: 'BTC',
        type: SwapType.Chain,
      } as unknown as ChainSwapInfo;

      await refundConfirmedListener({
        swap,
        refundTransaction: refundTransactionId,
      });

      expect(mockChainClient.getRawTransaction).toHaveBeenCalledWith(
        refundTransactionId,
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          `Could not fetch refund transaction ${refundTransactionId}`,
        ),
      );
      expect(
        (swapNursery.emit as jest.Mock).mock.calls.filter(
          ([event]) => event === 'refund',
        ),
      ).toHaveLength(1);
      expect(
        (swapNursery.emit as jest.Mock).mock.calls.find(
          ([event]) => event === 'refund',
        )?.[1],
      ).toEqual({
        swap,
        confirmed: true,
        emitFailure: false,
        refundTransaction: refundTransactionId,
      });
    });
  });
});
