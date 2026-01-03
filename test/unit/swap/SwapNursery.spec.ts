import { EventEmitter } from 'events';
import { Op } from 'sequelize';
import Logger from '../../../lib/Logger';
import {
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
jest.mock('../../../lib/swap/ChannelNursery', () =>
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

const mockLightningClient: LightningClient = {
  type: NodeType.LND,
  isConnected: jest.fn().mockReturnValue(true),
  raceCall: mockRaceCall,
  settleHoldInvoice: mockSettleHoldInvoice,
  serviceName: jest.fn().mockReturnValue('LND'),
} as any;

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
    lndClient: mockLightningClient,
    clnClient: mockLightningClient,
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
      node: NodeType.LND,
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
        mockLightningClient,
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

      const expectedMessage = `Could not settle LND invoice of ${mockReverseSwap.id}: ${mockError.message}`;
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
        mockLightningClient,
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
          channelCreation: null,
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
        null,
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
            channelCreation: null,
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

  describe('handleSwapSendFailed', () => {
    let mockReverseSwap: ReverseSwap;

    beforeEach(async () => {
      mockReverseSwap = {
        id: 'swap',
        node: NodeType.LND,
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
        mockLightningClient,
      );

      expect(LightningNursery.cancelReverseInvoices).toHaveBeenCalledWith(
        mockLightningClient,
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
        mockLightningClient,
      );

      expect(LightningNursery.cancelReverseInvoices).toHaveBeenCalledWith(
        mockLightningClient,
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
        mockLightningClient,
      );

      expect(LightningNursery.cancelReverseInvoices).toHaveBeenCalledWith(
        mockLightningClient,
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
});
