import { Transaction } from '@scure/btc-signer';
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
import type Swap from '../../../lib/db/models/Swap';
import type { ChainSwapInfo } from '../../../lib/db/repositories/ChainSwapRepository';
import ChainSwapRepository from '../../../lib/db/repositories/ChainSwapRepository';
import RefundTransactionRepository from '../../../lib/db/repositories/RefundTransactionRepository';
import ReverseSwapRepository from '../../../lib/db/repositories/ReverseSwapRepository';
import SendApprovalHoldRepository from '../../../lib/db/repositories/SendApprovalHoldRepository';
import SwapRepository from '../../../lib/db/repositories/SwapRepository';
import WrappedSwapRepository from '../../../lib/db/repositories/WrappedSwapRepository';
import type { LightningClient } from '../../../lib/lightning/LightningClient';
import type NotificationClient from '../../../lib/notifications/NotificationClient';
import { Signer } from '../../../lib/proto/boltzrpc';
import SignerControlRegistry from '../../../lib/service/SignerControlRegistry';
import Errors from '../../../lib/swap/Errors';
import SwapNursery from '../../../lib/swap/SwapNursery';
import { SendApprovalAction } from '../../../lib/swap/hooks/SendApprovalHook';
import type { Currency } from '../../../lib/wallet/WalletManager';
import {
  queryERC20SwapValuesFromLock,
  queryEtherSwapValuesFromLock,
} from '../../../lib/wallet/ethereum/contracts/ContractUtils';

let mockGetSwapResult: any = null;
let mockGetChainSwapResult: any = null;

jest.mock('../../../lib/db/repositories/SwapRepository');
jest.mock('../../../lib/db/repositories/ReverseSwapRepository');
jest.mock('../../../lib/db/repositories/ChainSwapRepository');
jest.mock('../../../lib/db/repositories/WrappedSwapRepository');
jest.mock('../../../lib/db/repositories/RefundTransactionRepository');
jest.mock('../../../lib/db/repositories/SendApprovalHoldRepository', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    remove: jest.fn(),
    getAll: jest.fn().mockResolvedValue([]),
    exists: jest.fn().mockResolvedValue(false),
  },
}));
jest.mock('../../../lib/wallet/ethereum/contracts/ContractUtils', () => ({
  queryEtherSwapValuesFromLock: jest.fn(),
  queryERC20SwapValuesFromLock: jest.fn(),
}));

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
  jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    init: jest.fn(),
    checkTransaction: jest.fn().mockResolvedValue(undefined),
  })),
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
    registerForClaim: jest.fn(),
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

  test('should retry settling swaps with pending invoices', async () => {
    jest.useFakeTimers();

    const pendingInvoiceSwap = {
      id: 'pending-invoice-swap',
      type: SwapType.Submarine,
      pair: 'BTC/BTC',
      orderSide: OrderSide.BUY,
    } as any;
    (SwapRepository.getSwaps as jest.Mock).mockResolvedValueOnce([
      pendingInvoiceSwap,
    ]);

    const retryNursery = new SwapNursery(
      mockLogger,
      {} as any,
      mockNotifications,
      {} as any,
      {} as any,
      {} as any,
      mockWalletManager,
      {} as any,
      1,
      mockClaimer,
      mockChainSwapSigner,
      {} as any,
      {} as any,
    );
    retryNursery.currencies = new Map([['BTC', mockCurrency]]);

    const attemptSettleSwap = jest
      .spyOn(retryNursery, 'attemptSettleSwap')
      .mockResolvedValue(undefined);

    await retryNursery.init([mockCurrency]);
    await jest.advanceTimersByTimeAsync(1_000);

    expect(SwapRepository.getSwaps).toHaveBeenCalledWith({
      status: {
        [Op.in]: [SwapUpdateEvent.InvoicePending, SwapUpdateEvent.InvoicePaid],
      },
    });
    expect(attemptSettleSwap).toHaveBeenCalledWith(
      mockCurrency,
      pendingInvoiceSwap,
    );

    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('signer lockup guards', () => {
    const createGuardedNursery = async (signer: Signer) => {
      const signerControlRegistry = SignerControlRegistry.getInstance();
      (signerControlRegistry as any)['disabledSigners'].clear();
      (signerControlRegistry as any)['repository'] = undefined;
      await signerControlRegistry.disableSigners([signer]);

      return new SwapNursery(
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
    };

    test.each`
      method
      ${'lockupUtxo'}
      ${'lockupVtxo'}
      ${'lockupEther'}
      ${'lockupERC20'}
    `(
      'should fail $method when lockup signer is disabled',
      async ({ method }) => {
        const guardedNursery = await createGuardedNursery(
          Signer.SIGNER_CHAIN_LOCKUP,
        );
        const wallet = {
          symbol: 'BTC',
          sendToAddress: jest.fn(),
        };
        const handleSwapSendFailedSpy = jest
          .spyOn(guardedNursery as any, 'handleSwapSendFailed')
          .mockResolvedValue(undefined);
        const chainSwap = {
          id: 'chain-swap-id',
          type: SwapType.Chain,
          sendingData: {
            expectedAmount: 100_000,
            lockupAddress: 'bcrt1lockup',
            symbol: 'BTC',
          },
        };

        if (method === 'lockupUtxo') {
          await (guardedNursery as any)[method](
            chainSwap,
            mockChainClient,
            wallet,
          );
        } else {
          await (guardedNursery as any)[method](chainSwap, wallet);
        }

        expect(wallet.sendToAddress).not.toHaveBeenCalled();
        expect(handleSwapSendFailedSpy).toHaveBeenCalledTimes(1);
        expect(handleSwapSendFailedSpy).toHaveBeenCalledWith(
          chainSwap,
          wallet.symbol,
          expect.any(Error),
          undefined,
        );
        expect(
          (handleSwapSendFailedSpy.mock.calls[0][2] as Error).message,
        ).toEqual(
          'signer SIGNER_CHAIN_LOCKUP is disabled for Chain Swap chain-swap-id',
        );
      },
    );

    const makeSendApprovalNursery = () => {
      const signerControlRegistry = SignerControlRegistry.getInstance();
      (signerControlRegistry as any)['disabledSigners'].clear();
      (signerControlRegistry as any)['repository'] = undefined;

      return new SwapNursery(
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
    };

    const chainSendSwap = {
      id: 'chain-swap-id',
      pair: 'BTC/BTC',
      type: SwapType.Chain,
      sendingData: {
        expectedAmount: 100_000,
        lockupAddress: 'bcrt1lockup',
        symbol: 'BTC',
      },
    };
    const reverseSendSwap = {
      id: 'reverse-swap-id',
      pair: 'BTC/BTC',
      type: SwapType.ReverseSubmarine,
      onchainAmount: 90_000,
      lockupAddress: 'bcrt1reverse',
    };

    test.each`
      method           | swap
      ${'lockupUtxo'}  | ${chainSendSwap}
      ${'lockupVtxo'}  | ${chainSendSwap}
      ${'lockupEther'} | ${chainSendSwap}
      ${'lockupERC20'} | ${chainSendSwap}
      ${'lockupUtxo'}  | ${reverseSendSwap}
      ${'lockupVtxo'}  | ${reverseSendSwap}
      ${'lockupEther'} | ${reverseSendSwap}
      ${'lockupERC20'} | ${reverseSendSwap}
    `(
      'should fail $method ($swap.type) when the send approval is rejected',
      async ({ method, swap }) => {
        const nursery = makeSendApprovalNursery();

        const wallet = {
          symbol: 'BTC',
          sendToAddress: jest.fn(),
        };
        const handleSwapSendFailedSpy = jest
          .spyOn(nursery as any, 'handleSwapSendFailed')
          .mockResolvedValue(undefined);

        if (method === 'lockupUtxo') {
          await (nursery as any)[method](
            swap,
            mockChainClient,
            wallet,
            SendApprovalAction.Reject,
          );
        } else {
          await (nursery as any)[method](
            swap,
            wallet,
            SendApprovalAction.Reject,
          );
        }

        expect(wallet.sendToAddress).not.toHaveBeenCalled();
        expect(handleSwapSendFailedSpy).toHaveBeenCalledTimes(1);
        expect(
          (handleSwapSendFailedSpy.mock.calls[0][2] as Error).message,
        ).toEqual(Errors.HOOK_REJECTED().message);
      },
    );

    test('should fail the lockup defensively when the approval is a hold', async () => {
      const nursery = makeSendApprovalNursery();
      const wallet = { symbol: 'BTC', sendToAddress: jest.fn() };
      const handleSwapSendFailedSpy = jest
        .spyOn(nursery as any, 'handleSwapSendFailed')
        .mockResolvedValue(undefined);

      await (nursery as any).lockupVtxo(
        chainSendSwap,
        wallet,
        SendApprovalAction.Hold,
      );

      expect(wallet.sendToAddress).not.toHaveBeenCalled();
      expect(handleSwapSendFailedSpy).toHaveBeenCalledTimes(1);
      expect(
        (handleSwapSendFailedSpy.mock.calls[0][2] as Error).message,
      ).toEqual(Errors.HOOK_REJECTED().message);
    });

    test('should lock up when the send approval is accepted', async () => {
      const nursery = makeSendApprovalNursery();

      const wallet = {
        symbol: 'BTC',
        sendToAddress: jest
          .fn()
          .mockResolvedValue({ transactionId: 'txid', vout: 0, fee: 1 }),
      };

      await (nursery as any).lockupVtxo(
        chainSendSwap,
        wallet,
        SendApprovalAction.Accept,
      );

      expect(wallet.sendToAddress).toHaveBeenCalledTimes(1);
      expect(wallet.sendToAddress).toHaveBeenCalledWith(
        chainSendSwap.sendingData.lockupAddress,
        chainSendSwap.sendingData.expectedAmount,
        undefined,
        expect.anything(),
      );
    });

    test.each`
      swap               | amount
      ${chainSendSwap}   | ${chainSendSwap.sendingData.expectedAmount}
      ${reverseSendSwap} | ${reverseSendSwap.onchainAmount}
    `(
      'should resolve send approval with the $swap.type lockup amount',
      async ({ swap, amount }) => {
        const nursery = makeSendApprovalNursery();
        const hook = jest.fn().mockResolvedValue(SendApprovalAction.Accept);
        (nursery as any).sendApprovalHook = { hook };

        await expect(
          (nursery as any).resolveSendApproval(swap, 'BTC'),
        ).resolves.toEqual(SendApprovalAction.Accept);

        expect(hook).toHaveBeenCalledWith(
          swap.id,
          swap.pair,
          'BTC',
          amount,
          undefined,
        );
      },
    );

    test('should share one in-flight send approval per swap id', async () => {
      const nursery = makeSendApprovalNursery();
      let resolveHook!: (action: SendApprovalAction) => void;
      const hook = jest.fn().mockReturnValue(
        new Promise<SendApprovalAction>((resolve) => {
          resolveHook = resolve;
        }),
      );
      (nursery as any).sendApprovalHook = { hook };

      const first = (nursery as any).resolveSendApproval(chainSendSwap, 'BTC');
      const second = (nursery as any).resolveSendApproval(chainSendSwap, 'BTC');

      expect(second).toBe(first);
      // the deduped hook call fires after the async already-held check
      await new Promise((resolve) => setImmediate(resolve));
      expect(hook).toHaveBeenCalledTimes(1);

      resolveHook(SendApprovalAction.Accept);
      await expect(first).resolves.toEqual(SendApprovalAction.Accept);

      await (nursery as any).resolveSendApproval(chainSendSwap, 'BTC');
      expect(hook).toHaveBeenCalledTimes(1);

      await (nursery as any).handleSendApproval(
        chainSendSwap,
        SendApprovalAction.Accept,
      );

      await (nursery as any).resolveSendApproval(chainSendSwap, 'BTC');
      expect(hook).toHaveBeenCalledTimes(2);
    });

    test('keeps the in-flight decision until it is persisted', async () => {
      const nursery = makeSendApprovalNursery();
      const hook = jest.fn().mockResolvedValue(SendApprovalAction.Hold);
      (nursery as any).sendApprovalHook = { hook };

      await expect(
        (nursery as any).resolveSendApproval(chainSendSwap, 'BTC'),
      ).resolves.toEqual(SendApprovalAction.Hold);

      await (nursery as any).resolveSendApproval(chainSendSwap, 'BTC');

      expect(hook).toHaveBeenCalledTimes(1);
      expect(SendApprovalHoldRepository.exists).toHaveBeenCalledTimes(1);
    });

    test('should ask with a hold fallback when the swap is already held', async () => {
      const nursery = makeSendApprovalNursery();
      const hook = jest.fn().mockResolvedValue(SendApprovalAction.Hold);
      (nursery as any).sendApprovalHook = { hook };
      (SendApprovalHoldRepository.exists as jest.Mock).mockResolvedValueOnce(
        true,
      );

      await (nursery as any).resolveSendApproval(chainSendSwap, 'BTC');

      expect(hook).toHaveBeenCalledWith(
        chainSendSwap.id,
        chainSendSwap.pair,
        'BTC',
        chainSendSwap.sendingData.expectedAmount,
        SendApprovalAction.Hold,
      );
    });

    test('should keep an already-held swap held when the hook is disconnected', async () => {
      const nursery = makeSendApprovalNursery();
      (SendApprovalHoldRepository.exists as jest.Mock).mockResolvedValueOnce(
        true,
      );

      await expect(
        (nursery as any).resolveSendApproval(chainSendSwap, 'BTC'),
      ).resolves.toEqual(SendApprovalAction.Hold);
    });

    test('should fall back to the configured default on first contact when the hook is disconnected', async () => {
      const nursery = makeSendApprovalNursery();
      (SendApprovalHoldRepository.exists as jest.Mock).mockResolvedValueOnce(
        false,
      );

      await expect(
        (nursery as any).resolveSendApproval(chainSendSwap, 'BTC'),
      ).resolves.toEqual(SendApprovalAction.Accept);
    });

    test('should not register chain swaps for claim when UTXO lockup signer is disabled', async () => {
      const guardedNursery = await createGuardedNursery(
        Signer.SIGNER_CHAIN_LOCKUP,
      );
      guardedNursery.currencies = new Map([['BTC', mockCurrency]]);
      const handleSwapSendFailedSpy = jest
        .spyOn(guardedNursery as any, 'handleSwapSendFailed')
        .mockResolvedValue(undefined);

      await (guardedNursery as any).handleChainSwapLockup({
        id: 'chain-swap-id',
        type: SwapType.Chain,
        sendingData: {
          expectedAmount: 100_000,
          lockupAddress: 'bcrt1lockup',
          symbol: 'BTC',
        },
      });

      expect(mockChainSwapSigner.registerForClaim).not.toHaveBeenCalled();
      expect(handleSwapSendFailedSpy).toHaveBeenCalledTimes(1);
    });
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

    beforeEach(() => {
      (ReverseSwapRepository.getReverseSwap as jest.Mock).mockResolvedValue(
        mockReverseSwap,
      );
    });

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

    test('should skip settlement when the invoice was settled already', async () => {
      (ReverseSwapRepository.getReverseSwap as jest.Mock).mockResolvedValueOnce(
        {
          ...mockReverseSwap,
          status: SwapUpdateEvent.InvoiceSettled,
        },
      );

      await swapNursery.settleReverseSwapInvoice(mockReverseSwap, mockPreimage);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        `Skipping invoice settlement of Reverse Swap ${mockReverseSwap.id}: already settled`,
      );
      expect(mockRaceCall).not.toHaveBeenCalled();
      expect(mockSettleHoldInvoice).not.toHaveBeenCalled();
      expect(LightningNursery.cancelReverseInvoices).not.toHaveBeenCalled();
      expect(ReverseSwapRepository.setInvoiceSettled).not.toHaveBeenCalled();
      expect(mockNotifications.sendMessage).not.toHaveBeenCalled();
    });

    test('should skip settlement when the reverse swap cannot be found anymore', async () => {
      (ReverseSwapRepository.getReverseSwap as jest.Mock).mockResolvedValueOnce(
        null,
      );

      await swapNursery.settleReverseSwapInvoice(mockReverseSwap, mockPreimage);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Could not find swap with id: ${mockReverseSwap.id}`,
      );
      expect(mockRaceCall).not.toHaveBeenCalled();
      expect(ReverseSwapRepository.setInvoiceSettled).not.toHaveBeenCalled();
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

  describe('invoice.paid', () => {
    const getInvoicePaidHandler = async () => {
      await swapNursery.init([mockCurrency]);
      const handler = (swapNursery as any).lightningNursery.on.mock.calls.find(
        ([event]: [string]) => event === 'invoice.paid',
      )?.[1];
      expect(handler).toBeDefined();
      return handler;
    };

    test('should warn and not ask approval when the reverse swap is missing', async () => {
      jest
        .spyOn(ReverseSwapRepository, 'getReverseSwap')
        .mockResolvedValue(null);
      (swapNursery as any).sendApprovalHook = { hook: jest.fn() };

      const handler = await getInvoicePaidHandler();
      await handler({ id: 'missing' });

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Could not find Reverse Swap with id: missing',
      );
      expect((swapNursery as any).sendApprovalHook.hook).not.toHaveBeenCalled();
      expect(SendApprovalHoldRepository.remove).toHaveBeenCalledWith('missing');
    });

    test('should not ask approval when the reverse swap status is not eligible', async () => {
      jest.spyOn(ReverseSwapRepository, 'getReverseSwap').mockResolvedValue({
        id: 'reverse-swap-id',
        pair: 'BTC/BTC',
        orderSide: OrderSide.BUY,
        status: SwapUpdateEvent.TransactionMempool,
      } as ReverseSwap);
      (swapNursery as any).sendApprovalHook = { hook: jest.fn() };

      const handler = await getInvoicePaidHandler();
      await handler({ id: 'reverse-swap-id' });

      expect((swapNursery as any).sendApprovalHook.hook).not.toHaveBeenCalled();
    });

    test.each`
      type                        | method           | hasChainClient
      ${CurrencyType.BitcoinLike} | ${'lockupUtxo'}  | ${true}
      ${CurrencyType.Ether}       | ${'lockupEther'} | ${false}
      ${CurrencyType.ERC20}       | ${'lockupERC20'} | ${false}
      ${CurrencyType.Ark}         | ${'lockupVtxo'}  | ${false}
    `(
      'should resolve the send approval and thread it into $method',
      async ({ type, method, hasChainClient }) => {
        const reverseSwap = {
          id: 'reverse-swap-id',
          pair: 'BTC/BTC',
          type: SwapType.ReverseSubmarine,
          orderSide: OrderSide.BUY,
          status: SwapUpdateEvent.SwapCreated,
          onchainAmount: 100_000,
          nodeId: mockLndClient.id,
        } as unknown as ReverseSwap;
        jest
          .spyOn(ReverseSwapRepository, 'getReverseSwap')
          .mockResolvedValue(reverseSwap);
        (swapNursery as any).sendApprovalHook = {
          hook: jest.fn().mockResolvedValue(SendApprovalAction.Reject),
        };
        const methodSpy = jest
          .spyOn(swapNursery as any, method)
          .mockResolvedValue(undefined);

        const handler = await getInvoicePaidHandler();
        swapNursery.currencies = new Map([['BTC', { ...mockCurrency, type }]]);
        await handler({ id: reverseSwap.id });

        expect((swapNursery as any).sendApprovalHook.hook).toHaveBeenCalledWith(
          reverseSwap.id,
          reverseSwap.pair,
          'BTC',
          reverseSwap.onchainAmount,
          undefined,
        );
        expect(methodSpy).toHaveBeenCalledWith(
          reverseSwap,
          ...(hasChainClient ? [mockCurrency.chainClient] : []),
          mockWallet,
          SendApprovalAction.Reject,
          mockLndClient,
        );
      },
    );

    test('should record a hold and not lock up when the send approval holds', async () => {
      const reverseSwap = {
        id: 'reverse-swap-id',
        pair: 'BTC/BTC',
        type: SwapType.ReverseSubmarine,
        orderSide: OrderSide.BUY,
        status: SwapUpdateEvent.SwapCreated,
        onchainAmount: 100_000,
        nodeId: mockLndClient.id,
      } as unknown as ReverseSwap;
      jest
        .spyOn(ReverseSwapRepository, 'getReverseSwap')
        .mockResolvedValue(reverseSwap);
      (swapNursery as any).sendApprovalHook = {
        hook: jest.fn().mockResolvedValue(SendApprovalAction.Hold),
      };
      const lockupSpy = jest
        .spyOn(swapNursery as any, 'lockupReverseSwap')
        .mockResolvedValue(undefined);

      const handler = await getInvoicePaidHandler();
      swapNursery.currencies = new Map([
        ['BTC', { ...mockCurrency, type: CurrencyType.BitcoinLike }],
      ]);
      await handler({ id: reverseSwap.id });

      expect(SendApprovalHoldRepository.create).toHaveBeenCalledWith({
        swapId: reverseSwap.id,
        type: SwapType.ReverseSubmarine,
      });
      expect(lockupSpy).not.toHaveBeenCalled();
    });

    test('should not lock up when the reverse swap becomes final while approval is pending', async () => {
      const reverseSwap = {
        id: 'reverse-swap-id',
        pair: 'BTC/BTC',
        type: SwapType.ReverseSubmarine,
        orderSide: OrderSide.BUY,
        status: SwapUpdateEvent.SwapCreated,
        onchainAmount: 100_000,
        nodeId: mockLndClient.id,
      } as unknown as ReverseSwap;
      jest
        .spyOn(ReverseSwapRepository, 'getReverseSwap')
        .mockResolvedValueOnce(reverseSwap)
        .mockResolvedValueOnce({
          ...reverseSwap,
          status: SwapUpdateEvent.TransactionRefunded,
        } as ReverseSwap);
      let resolveApproval!: (action: SendApprovalAction) => void;
      (swapNursery as any).sendApprovalHook = {
        hook: jest.fn().mockReturnValue(
          new Promise<SendApprovalAction>((resolve) => {
            resolveApproval = resolve;
          }),
        ),
      };
      const lockupSpy = jest
        .spyOn(swapNursery as any, 'lockupReverseSwap')
        .mockResolvedValue(undefined);

      const handler = await getInvoicePaidHandler();
      const handlerPromise = handler({ id: reverseSwap.id });
      await new Promise((resolve) => setImmediate(resolve));

      resolveApproval(SendApprovalAction.Accept);
      await handlerPromise;

      expect(lockupSpy).not.toHaveBeenCalled();
      expect(SendApprovalHoldRepository.remove).toHaveBeenCalledWith(
        reverseSwap.id,
      );
      expect((swapNursery as any).pendingSendApprovals.size).toEqual(0);
    });
  });

  describe('retryHeldLockup', () => {
    const heldReverseSwap = {
      id: 'reverse-swap-id',
      pair: 'BTC/BTC',
      type: SwapType.ReverseSubmarine,
      orderSide: OrderSide.BUY,
      status: SwapUpdateEvent.SwapCreated,
      onchainAmount: 100_000,
    } as unknown as ReverseSwap;

    test('should re-drive a held reverse swap and lock up when accepted', async () => {
      jest
        .spyOn(ReverseSwapRepository, 'getReverseSwap')
        .mockResolvedValue(heldReverseSwap);
      (swapNursery as any).sendApprovalHook = {
        hook: jest.fn().mockResolvedValue(SendApprovalAction.Accept),
      };
      const lockupSpy = jest
        .spyOn(swapNursery as any, 'lockupReverseSwap')
        .mockResolvedValue(undefined);

      await (swapNursery as any).retryHeldLockup({
        swapId: heldReverseSwap.id,
        type: SwapType.ReverseSubmarine,
      });

      expect(SendApprovalHoldRepository.remove).toHaveBeenCalledWith(
        heldReverseSwap.id,
      );
      expect(lockupSpy).toHaveBeenCalledWith(
        heldReverseSwap,
        SendApprovalAction.Accept,
      );
    });

    test('should keep holding and not lock up when still held', async () => {
      jest
        .spyOn(ReverseSwapRepository, 'getReverseSwap')
        .mockResolvedValue(heldReverseSwap);
      (swapNursery as any).sendApprovalHook = {
        hook: jest.fn().mockResolvedValue(SendApprovalAction.Hold),
      };
      const lockupSpy = jest
        .spyOn(swapNursery as any, 'lockupReverseSwap')
        .mockResolvedValue(undefined);

      await (swapNursery as any).retryHeldLockup({
        swapId: heldReverseSwap.id,
        type: SwapType.ReverseSubmarine,
      });

      expect(lockupSpy).not.toHaveBeenCalled();
    });

    test('should drop the hold for a missing reverse swap', async () => {
      jest
        .spyOn(ReverseSwapRepository, 'getReverseSwap')
        .mockResolvedValue(null);

      await (swapNursery as any).retryHeldLockup({
        swapId: 'missing',
        type: SwapType.ReverseSubmarine,
      });

      expect(SendApprovalHoldRepository.remove).toHaveBeenCalledWith('missing');
    });

    test('should fail a held reverse swap when rejected', async () => {
      jest
        .spyOn(ReverseSwapRepository, 'getReverseSwap')
        .mockResolvedValue(heldReverseSwap);
      (swapNursery as any).sendApprovalHook = {
        hook: jest.fn().mockResolvedValue(SendApprovalAction.Reject),
      };
      const lockupSpy = jest
        .spyOn(swapNursery as any, 'lockupReverseSwap')
        .mockResolvedValue(undefined);

      await (swapNursery as any).retryHeldLockup({
        swapId: heldReverseSwap.id,
        type: SwapType.ReverseSubmarine,
      });

      expect(SendApprovalHoldRepository.remove).toHaveBeenCalledWith(
        heldReverseSwap.id,
      );
      expect(lockupSpy).toHaveBeenCalledWith(
        heldReverseSwap,
        SendApprovalAction.Reject,
      );
    });

    const heldChainSwap = {
      id: 'chain-swap-id',
      pair: 'BTC/BTC',
      type: SwapType.Chain,
      status: SwapUpdateEvent.TransactionConfirmed,
      createdRefundSignature: false,
      sendingData: {
        transactionId: null,
        expectedAmount: 100_000,
        symbol: 'BTC',
      },
    };

    test('should re-drive a held chain swap and lock up when accepted', async () => {
      mockGetChainSwapResult = heldChainSwap;
      (swapNursery as any).sendApprovalHook = {
        hook: jest.fn().mockResolvedValue(SendApprovalAction.Accept),
      };
      const lockupSpy = jest
        .spyOn(swapNursery as any, 'handleChainSwapLockup')
        .mockResolvedValue(undefined);

      await (swapNursery as any).retryHeldLockup({
        swapId: heldChainSwap.id,
        type: SwapType.Chain,
      });

      expect(SendApprovalHoldRepository.remove).toHaveBeenCalledWith(
        heldChainSwap.id,
      );
      expect(lockupSpy).toHaveBeenCalledWith(
        heldChainSwap,
        SendApprovalAction.Accept,
      );
    });

    test('should fail a held chain swap when rejected', async () => {
      mockGetChainSwapResult = heldChainSwap;
      (swapNursery as any).sendApprovalHook = {
        hook: jest.fn().mockResolvedValue(SendApprovalAction.Reject),
      };
      const lockupSpy = jest
        .spyOn(swapNursery as any, 'handleChainSwapLockup')
        .mockResolvedValue(undefined);

      await (swapNursery as any).retryHeldLockup({
        swapId: heldChainSwap.id,
        type: SwapType.Chain,
      });

      expect(SendApprovalHoldRepository.remove).toHaveBeenCalledWith(
        heldChainSwap.id,
      );
      expect(lockupSpy).toHaveBeenCalledWith(
        heldChainSwap,
        SendApprovalAction.Reject,
      );
    });

    test('should drop the hold for a held chain swap in a final state', async () => {
      mockGetChainSwapResult = {
        ...heldChainSwap,
        status: SwapUpdateEvent.TransactionFailed,
      };
      const lockupSpy = jest
        .spyOn(swapNursery as any, 'handleChainSwapLockup')
        .mockResolvedValue(undefined);

      await (swapNursery as any).retryHeldLockup({
        swapId: heldChainSwap.id,
        type: SwapType.Chain,
      });

      expect(SendApprovalHoldRepository.remove).toHaveBeenCalledWith(
        heldChainSwap.id,
      );
      expect(lockupSpy).not.toHaveBeenCalled();
    });

    test('should drop the hold for a held chain swap with rejected zero-conf', async () => {
      mockGetChainSwapResult = {
        ...heldChainSwap,
        status: SwapUpdateEvent.TransactionZeroConfRejected,
      };
      const lockupSpy = jest
        .spyOn(swapNursery as any, 'handleChainSwapLockup')
        .mockResolvedValue(undefined);

      await (swapNursery as any).retryHeldLockup({
        swapId: heldChainSwap.id,
        type: SwapType.Chain,
      });

      expect(SendApprovalHoldRepository.remove).toHaveBeenCalledWith(
        heldChainSwap.id,
      );
      expect(lockupSpy).not.toHaveBeenCalled();
    });

    test('should drop the hold for a chain swap that already locked up', async () => {
      mockGetChainSwapResult = {
        ...heldChainSwap,
        sendingData: { ...heldChainSwap.sendingData, transactionId: 'sent' },
      };
      const lockupSpy = jest
        .spyOn(swapNursery as any, 'handleChainSwapLockup')
        .mockResolvedValue(undefined);

      await (swapNursery as any).retryHeldLockup({
        swapId: heldChainSwap.id,
        type: SwapType.Chain,
      });

      expect(SendApprovalHoldRepository.remove).toHaveBeenCalledWith(
        heldChainSwap.id,
      );
      expect(lockupSpy).not.toHaveBeenCalled();
    });

    test('should keep holding a chain swap that is still held', async () => {
      mockGetChainSwapResult = heldChainSwap;
      (swapNursery as any).sendApprovalHook = {
        hook: jest.fn().mockResolvedValue(SendApprovalAction.Hold),
      };
      const lockupSpy = jest
        .spyOn(swapNursery as any, 'handleChainSwapLockup')
        .mockResolvedValue(undefined);

      await (swapNursery as any).retryHeldLockup({
        swapId: heldChainSwap.id,
        type: SwapType.Chain,
      });

      expect(SendApprovalHoldRepository.create).toHaveBeenCalledWith({
        swapId: heldChainSwap.id,
        type: SwapType.Chain,
      });
      expect(lockupSpy).not.toHaveBeenCalled();
    });

    test('should drop the hold for a missing chain swap', async () => {
      mockGetChainSwapResult = null;
      (swapNursery as any).sendApprovalHook = { hook: jest.fn() };
      const lockupSpy = jest
        .spyOn(swapNursery as any, 'handleChainSwapLockup')
        .mockResolvedValue(undefined);

      await (swapNursery as any).retryHeldLockup({
        swapId: 'chain-swap-id',
        type: SwapType.Chain,
      });

      expect(SendApprovalHoldRepository.remove).toHaveBeenCalledWith(
        'chain-swap-id',
      );
      expect((swapNursery as any).sendApprovalHook.hook).not.toHaveBeenCalled();
      expect(lockupSpy).not.toHaveBeenCalled();
    });

    test('should leave a held submarine swap that is still pending', async () => {
      jest
        .spyOn(SwapRepository, 'getSwap')
        .mockResolvedValue({ status: SwapUpdateEvent.InvoicePending } as any);
      const reverseSpy = jest.spyOn(ReverseSwapRepository, 'getReverseSwap');

      await (swapNursery as any).retryHeldLockup({
        swapId: 'submarine-id',
        type: SwapType.Submarine,
      });

      expect(SendApprovalHoldRepository.remove).not.toHaveBeenCalled();
      expect(reverseSpy).not.toHaveBeenCalled();
    });

    test('should drop the hold for a missing submarine swap', async () => {
      jest.spyOn(SwapRepository, 'getSwap').mockResolvedValue(null);

      await (swapNursery as any).retryHeldLockup({
        swapId: 'submarine-id',
        type: SwapType.Submarine,
      });

      expect(SendApprovalHoldRepository.remove).toHaveBeenCalledWith(
        'submarine-id',
      );
    });

    test('should drop the hold for a submarine swap that left InvoicePending', async () => {
      jest.spyOn(SwapRepository, 'getSwap').mockResolvedValue({
        status: SwapUpdateEvent.InvoiceFailedToPay,
      } as any);

      await (swapNursery as any).retryHeldLockup({
        swapId: 'submarine-id',
        type: SwapType.Submarine,
      });

      expect(SendApprovalHoldRepository.remove).toHaveBeenCalledWith(
        'submarine-id',
      );
    });
  });

  describe('retryHeldSendApprovals', () => {
    test('should re-drive every held swap under the matching lock', async () => {
      const holds = [
        { swapId: 'reverse-id', type: SwapType.ReverseSubmarine },
        { swapId: 'chain-id', type: SwapType.Chain },
        { swapId: 'submarine-id', type: SwapType.Submarine },
      ];
      (SendApprovalHoldRepository.getAll as jest.Mock).mockResolvedValueOnce(
        holds,
      );
      const retrySpy = jest
        .spyOn(swapNursery as any, 'retryHeldLockup')
        .mockResolvedValue(undefined);

      await (swapNursery as any).retryHeldSendApprovals();

      expect(retrySpy).toHaveBeenCalledTimes(3);
      expect(retrySpy).toHaveBeenCalledWith(holds[0]);
      expect(retrySpy).toHaveBeenCalledWith(holds[1]);
      expect(retrySpy).toHaveBeenCalledWith(holds[2]);
    });
  });

  describe('chainSwap.lockup', () => {
    let baseMockChainSwap: ChainSwapInfo;
    let mockTransaction: any;
    let mockHandleChainSwapLockup: jest.SpyInstance;

    beforeEach(async () => {
      baseMockChainSwap = {
        id: 'test-chain-swap-id',
        pair: 'BTC/BTC',
        type: SwapType.Chain,
        status: SwapUpdateEvent.TransactionConfirmed,
        createdRefundSignature: false,
        sendingData: {
          transactionId: null,
          expectedAmount: 100_000,
          symbol: 'BTC',
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
      await new Promise((resolve) => setImmediate(resolve));

      expect(ChainSwapRepository.getChainSwap).toHaveBeenCalledWith({
        id: baseMockChainSwap.id,
      });
      expect(mockHandleChainSwapLockup).toHaveBeenCalledWith(
        mockGetChainSwapResult,
        SendApprovalAction.Accept,
      );
      expect(swapNursery.emit).toHaveBeenCalledWith('transaction', {
        confirmed: true,
        transaction: mockTransaction,
        swap: mockGetChainSwapResult,
      });
    });

    test('should record a hold and not lock up when the send approval holds', async () => {
      mockGetChainSwapResult = baseMockChainSwap;
      (swapNursery as any).sendApprovalHook = {
        hook: jest.fn().mockResolvedValue(SendApprovalAction.Hold),
      };

      const eventPromise = new Promise<void>((resolve) => {
        swapNursery.once('transaction', () => resolve());
      });
      (swapNursery as any).utxoNursery.emit('chainSwap.lockup', {
        swap: baseMockChainSwap,
        transaction: mockTransaction,
        confirmed: true,
      });
      await eventPromise;
      await new Promise((resolve) => setImmediate(resolve));

      expect(SendApprovalHoldRepository.create).toHaveBeenCalledWith({
        swapId: baseMockChainSwap.id,
        type: SwapType.Chain,
      });
      expect(mockHandleChainSwapLockup).not.toHaveBeenCalled();
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
      expect(SendApprovalHoldRepository.remove).toHaveBeenCalledWith(
        baseMockChainSwap.id,
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
      expect(SendApprovalHoldRepository.remove).toHaveBeenCalledWith(
        baseMockChainSwap.id,
      );
    });

    test('should not lock up when the chain swap becomes final while approval is pending', async () => {
      mockGetChainSwapResult = baseMockChainSwap;
      let resolveApproval!: (action: SendApprovalAction) => void;
      (swapNursery as any).sendApprovalHook = {
        hook: jest.fn().mockReturnValue(
          new Promise<SendApprovalAction>((resolve) => {
            resolveApproval = resolve;
          }),
        ),
      };

      (swapNursery as any).utxoNursery.emit('chainSwap.lockup', {
        swap: baseMockChainSwap,
        transaction: mockTransaction,
        confirmed: true,
      });
      await new Promise((resolve) => setImmediate(resolve));

      expect((swapNursery as any).sendApprovalHook.hook).toHaveBeenCalled();

      mockGetChainSwapResult = {
        ...baseMockChainSwap,
        status: SwapUpdateEvent.TransactionFailed,
      };
      resolveApproval(SendApprovalAction.Accept);
      await new Promise((resolve) => setImmediate(resolve));

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('final status'),
      );
      expect(mockHandleChainSwapLockup).not.toHaveBeenCalled();
      expect(swapNursery.emit).not.toHaveBeenCalledWith(
        'transaction',
        expect.anything(),
      );
      expect(SendApprovalHoldRepository.remove).toHaveBeenCalledWith(
        baseMockChainSwap.id,
      );
      expect((swapNursery as any).pendingSendApprovals.size).toEqual(0);
    });

    test('should not lock up when zero-conf is rejected while approval is pending', async () => {
      mockGetChainSwapResult = baseMockChainSwap;
      let resolveApproval!: (action: SendApprovalAction) => void;
      (swapNursery as any).sendApprovalHook = {
        hook: jest.fn().mockReturnValue(
          new Promise<SendApprovalAction>((resolve) => {
            resolveApproval = resolve;
          }),
        ),
      };

      (swapNursery as any).utxoNursery.emit('chainSwap.lockup', {
        swap: baseMockChainSwap,
        transaction: mockTransaction,
        confirmed: true,
      });
      await new Promise((resolve) => setImmediate(resolve));

      expect((swapNursery as any).sendApprovalHook.hook).toHaveBeenCalled();

      mockGetChainSwapResult = {
        ...baseMockChainSwap,
        status: SwapUpdateEvent.TransactionZeroConfRejected,
      };
      resolveApproval(SendApprovalAction.Accept);
      await new Promise((resolve) => setImmediate(resolve));

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('non-actionable status'),
      );
      expect(mockHandleChainSwapLockup).not.toHaveBeenCalled();
      expect(swapNursery.emit).not.toHaveBeenCalledWith(
        'transaction',
        expect.anything(),
      );
      expect(SendApprovalHoldRepository.remove).toHaveBeenCalledWith(
        baseMockChainSwap.id,
      );
      expect((swapNursery as any).pendingSendApprovals.size).toEqual(0);
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
        status: SwapUpdateEvent.SwapCreated,
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
      expect(SendApprovalHoldRepository.remove).toHaveBeenCalledWith(
        baseMockChainSwap.id,
      );
    });

    test('should thread the resolved approval into the chain lockup', async () => {
      const listeners: Record<string, (...args: any[]) => Promise<void>> = {};
      const ethereumNursery = {
        on: jest.fn(
          (event: string, callback: (...args: any[]) => Promise<void>) => {
            listeners[event] = callback;
          },
        ),
        init: jest.fn().mockResolvedValue(undefined),
      } as any;

      const chainSwap = {
        id: 'test-chain-swap-id',
        pair: 'BTC/BTC',
        type: SwapType.Chain,
        status: SwapUpdateEvent.SwapCreated,
        sendingData: {
          transactionId: null,
          expectedAmount: 100_000,
          symbol: 'BTC',
        },
      } as unknown as ChainSwapInfo;
      mockGetChainSwapResult = chainSwap;
      (swapNursery as any).sendApprovalHook = {
        hook: jest.fn().mockResolvedValue(SendApprovalAction.Accept),
      };
      const mockHandleChainSwapLockup = jest
        .spyOn(swapNursery as any, 'handleChainSwapLockup')
        .mockResolvedValue(undefined);

      await (swapNursery as any).listenEthereumNursery(ethereumNursery);
      await listeners['eth.lockup']({
        swap: chainSwap,
        transactionHash: '0xaccept',
      });

      expect((swapNursery as any).sendApprovalHook.hook).toHaveBeenCalledWith(
        chainSwap.id,
        chainSwap.pair,
        'BTC',
        chainSwap.sendingData.expectedAmount,
        undefined,
      );
      expect(mockHandleChainSwapLockup).toHaveBeenCalledWith(
        mockGetChainSwapResult,
        SendApprovalAction.Accept,
      );
    });

    test('should record a hold and not lock up the chain swap when the send approval holds', async () => {
      const listeners: Record<string, (...args: any[]) => Promise<void>> = {};
      const ethereumNursery = {
        on: jest.fn(
          (event: string, callback: (...args: any[]) => Promise<void>) => {
            listeners[event] = callback;
          },
        ),
        init: jest.fn().mockResolvedValue(undefined),
      } as any;

      const chainSwap = {
        id: 'test-chain-swap-id',
        pair: 'BTC/BTC',
        type: SwapType.Chain,
        status: SwapUpdateEvent.SwapCreated,
        sendingData: {
          transactionId: null,
          expectedAmount: 100_000,
          symbol: 'BTC',
        },
      } as unknown as ChainSwapInfo;
      mockGetChainSwapResult = chainSwap;
      (swapNursery as any).sendApprovalHook = {
        hook: jest.fn().mockResolvedValue(SendApprovalAction.Hold),
      };
      const mockHandleChainSwapLockup = jest
        .spyOn(swapNursery as any, 'handleChainSwapLockup')
        .mockResolvedValue(undefined);

      await (swapNursery as any).listenEthereumNursery(ethereumNursery);
      await listeners['eth.lockup']({
        swap: chainSwap,
        transactionHash: '0xhold',
      });

      expect(SendApprovalHoldRepository.create).toHaveBeenCalledWith({
        swapId: chainSwap.id,
        type: SwapType.Chain,
      });
      expect(mockHandleChainSwapLockup).not.toHaveBeenCalled();
    });

    test('should not consult the chain approval pre-gate for submarine swaps', async () => {
      const listeners: Record<string, (...args: any[]) => Promise<void>> = {};
      const ethereumNursery = {
        on: jest.fn(
          (event: string, callback: (...args: any[]) => Promise<void>) => {
            listeners[event] = callback;
          },
        ),
        init: jest.fn().mockResolvedValue(undefined),
      } as any;

      const submarineSwap = {
        id: 'submarine-swap-id',
        pair: 'BTC/BTC',
        type: SwapType.Submarine,
        orderSide: OrderSide.BUY,
        invoice: 'lnbcrt1',
        createdRefundSignature: false,
      } as unknown as Swap;
      mockGetSwapResult = submarineSwap;
      (swapNursery as any).sendApprovalHook = { hook: jest.fn() };
      const attemptSettleSwapSpy = jest
        .spyOn(swapNursery, 'attemptSettleSwap')
        .mockResolvedValue(undefined);

      await (swapNursery as any).listenEthereumNursery(ethereumNursery);
      await listeners['eth.lockup']({
        swap: submarineSwap,
        transactionHash: '0xsubmarine',
      });

      expect(ChainSwapRepository.getChainSwap).not.toHaveBeenCalled();
      expect((swapNursery as any).sendApprovalHook.hook).not.toHaveBeenCalled();
      expect(attemptSettleSwapSpy).toHaveBeenCalledWith(
        mockCurrency,
        submarineSwap,
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

  describe('server.lockup.confirmed', () => {
    test('should not emit when a chain swap is already being claimed', async () => {
      const chainSwap = {
        id: 'test-chain-swap-id',
        type: SwapType.Chain,
        status: SwapUpdateEvent.TransactionServerMempool,
        preimage: '00'.repeat(32),
      } as unknown as ChainSwapInfo;

      mockGetChainSwapResult = chainSwap;

      await swapNursery.init([mockCurrency]);
      jest.spyOn(swapNursery, 'emit');

      (swapNursery as any).utxoNursery.emit('server.lockup.confirmed', {
        swap: chainSwap,
        transaction: {},
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(ChainSwapRepository.getChainSwap).toHaveBeenCalledWith({
        id: chainSwap.id,
      });
      expect(WrappedSwapRepository.setStatus).not.toHaveBeenCalled();
      expect(swapNursery.emit).not.toHaveBeenCalledWith(
        'transaction',
        expect.anything(),
      );
    });
  });

  describe('attemptSettleSwap idempotency', () => {
    const mockPreimage = Buffer.from('preimage');

    beforeEach(() => {
      (swapNursery as any).claimer = {
        deferClaim: jest.fn().mockResolvedValue(true),
      };
      jest.spyOn(swapNursery, 'emit');
    });

    test('should skip settlement when the chain swap was claimed already', async () => {
      const staleChainSwap = {
        id: 'settled-chain-swap',
        type: SwapType.Chain,
        status: SwapUpdateEvent.TransactionServerConfirmed,
        receivingData: { symbol: 'BTC' },
      } as unknown as ChainSwapInfo;
      mockGetChainSwapResult = {
        ...staleChainSwap,
        status: SwapUpdateEvent.TransactionClaimed,
      };

      await swapNursery.attemptSettleSwap(
        mockCurrency,
        staleChainSwap,
        mockPreimage,
      );

      expect(ChainSwapRepository.getChainSwap).toHaveBeenCalledWith({
        id: staleChainSwap.id,
      });
      expect((swapNursery as any).claimer.deferClaim).not.toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        `Skipping claim of Chain Swap ${staleChainSwap.id}: already settled`,
      );
      expect(swapNursery.emit).not.toHaveBeenCalledWith(
        'claim.failure',
        expect.anything(),
      );
    });

    test('should skip settlement when the submarine swap was claimed already', async () => {
      const staleSwap = {
        id: 'settled-submarine-swap',
        type: SwapType.Submarine,
      } as unknown as Swap;
      mockGetSwapResult = {
        ...staleSwap,
        status: SwapUpdateEvent.TransactionClaimed,
      };
      const payInvoiceSpy = jest.spyOn(swapNursery as any, 'payInvoice');

      await swapNursery.attemptSettleSwap(mockCurrency, staleSwap);

      expect(SwapRepository.getSwap).toHaveBeenCalledWith({
        id: staleSwap.id,
      });
      expect(payInvoiceSpy).not.toHaveBeenCalled();
    });

    test('should skip settlement when the swap cannot be found anymore', async () => {
      mockGetChainSwapResult = null;
      const staleChainSwap = {
        id: 'gone-chain-swap',
        type: SwapType.Chain,
      } as unknown as ChainSwapInfo;

      await swapNursery.attemptSettleSwap(
        mockCurrency,
        staleChainSwap,
        mockPreimage,
      );

      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Could not find swap with id: ${staleChainSwap.id}`,
      );
      expect((swapNursery as any).claimer.deferClaim).not.toHaveBeenCalled();
    });

    test('should settle with the re-fetched swap instead of the stale one', async () => {
      const staleChainSwap = {
        id: 'fresh-chain-swap',
        type: SwapType.Chain,
        status: SwapUpdateEvent.TransactionServerMempool,
      } as unknown as ChainSwapInfo;
      const fetchedChainSwap = {
        ...staleChainSwap,
        status: SwapUpdateEvent.TransactionServerConfirmed,
      };
      mockGetChainSwapResult = fetchedChainSwap;

      await swapNursery.attemptSettleSwap(
        mockCurrency,
        staleChainSwap,
        mockPreimage,
      );

      expect((swapNursery as any).claimer.deferClaim).toHaveBeenCalledWith(
        fetchedChainSwap,
        mockPreimage,
      );
      expect(swapNursery.emit).toHaveBeenCalledWith(
        'claim.pending',
        fetchedChainSwap,
      );
    });

    test('should claim only once when a duplicate EVM claim event arrives', async () => {
      const listeners: Record<string, (...args: any[]) => Promise<void>> = {};
      const ethereumNursery = {
        on: jest.fn(
          (event: string, callback: (...args: any[]) => Promise<void>) => {
            listeners[event] = callback;
          },
        ),
        init: jest.fn().mockResolvedValue(undefined),
      } as any;

      const chainSwap = {
        id: 'duplicate-claim-swap',
        type: SwapType.Chain,
        status: SwapUpdateEvent.TransactionServerConfirmed,
        receivingData: { symbol: 'BTC' },
      } as unknown as ChainSwapInfo;
      mockGetChainSwapResult = chainSwap;

      await (swapNursery as any).listenEthereumNursery(ethereumNursery);

      await listeners['claim']({ swap: chainSwap, preimage: mockPreimage });
      mockGetChainSwapResult = {
        ...chainSwap,
        status: SwapUpdateEvent.TransactionClaimPending,
      };
      await listeners['claim']({ swap: chainSwap, preimage: mockPreimage });
      mockGetChainSwapResult = {
        ...chainSwap,
        status: SwapUpdateEvent.TransactionClaimed,
      };
      await listeners['claim']({ swap: chainSwap, preimage: mockPreimage });

      expect((swapNursery as any).claimer.deferClaim).toHaveBeenCalledTimes(1);
      expect(swapNursery.emit).toHaveBeenCalledTimes(1);
      expect(swapNursery.emit).toHaveBeenCalledWith('claim.pending', chainSwap);
    });
  });

  describe('claimUtxo', () => {
    beforeEach(() => {
      (swapNursery as any).claimer = {
        deferClaim: jest.fn().mockResolvedValue(false),
      };
      jest.spyOn(swapNursery, 'emit');
    });

    test('should emit claim.failure with the wallet symbol and rethrow when the claim fails', async () => {
      const swap = {
        id: 'submarine-utxo-swap',
        type: SwapType.Submarine,
        pair: 'BTC/BTC',
        orderSide: OrderSide.BUY,
      } as any;
      const wallet = {
        symbol: 'BTC',
        getAddress: jest.fn().mockResolvedValue('bcrt1qaddress'),
      } as any;
      const chainClient = {
        symbol: 'BTC',
        estimateFee: jest.fn().mockRejectedValue(new Error('estimate failed')),
        sendRawTransaction: jest.fn(),
      } as any;

      await expect(
        (swapNursery as any).claimUtxo(
          swap,
          chainClient,
          wallet,
          {} as any,
          Buffer.from('preimage'),
        ),
      ).rejects.toThrow();

      expect(swapNursery.emit).toHaveBeenCalledWith('claim.failure', {
        swap,
        symbol: 'BTC',
        error: expect.any(String),
      });
      expect(swapNursery.emit).not.toHaveBeenCalledWith(
        'claim',
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

    test('should emit claim.failure and rethrow when the claim fails', async () => {
      const error = new Error('vHTLC claim failed');
      const failingArkClient = {
        ...mockArkClient,
        claimVHtlc: jest.fn().mockRejectedValue(error),
      };
      const swap = {
        id: 'submarine-ark-swap',
        type: SwapType.Submarine,
        theirRefundPublicKey: '02'.repeat(33),
        lockupTransactionId: 'submarine-lockup-tx',
        lockupTransactionVout: 4,
      } as any;

      await expect(
        (swapNursery as any).claimVtxo(
          swap,
          failingArkClient,
          Buffer.from('preimage'),
        ),
      ).rejects.toThrow(error);

      expect(swapNursery.emit).toHaveBeenCalledWith('claim.failure', {
        swap,
        symbol: 'ARK',
        error: error.message,
      });
      expect(swapNursery.emit).not.toHaveBeenCalledWith(
        'claim',
        expect.anything(),
      );
    });
  });

  describe('refundVtxo', () => {
    const refundTxId = 'ark-refund-tx';

    const mockArkClient = {
      refundVHtlc: jest.fn().mockResolvedValue('ark-refund-tx'),
      pubkey: Buffer.from('03'.repeat(33), 'hex'),
      symbol: 'ARK',
    } as any;

    const mockArkCurrency = {
      symbol: 'ARK',
      arkNode: mockArkClient,
    } as any;

    beforeEach(() => {
      (
        WrappedSwapRepository.setTransactionRefunded as jest.Mock
      ).mockImplementation(async (swap) => swap);
      (
        RefundTransactionRepository.addTransaction as jest.Mock
      ).mockImplementation(async (transaction) => transaction);
      jest.spyOn(swapNursery, 'emit');
    });

    test('should refund reverse ARK swaps and let the RefundWatcher confirm', async () => {
      const swap = {
        id: 'reverse-ark-swap',
        type: SwapType.ReverseSubmarine,
        preimageHash: 'aa'.repeat(32),
        claimPublicKey: '02'.repeat(33),
        transactionId: 'reverse-lockup-tx',
        transactionVout: 2,
      } as any;

      await (swapNursery as any).refundVtxo(mockArkCurrency, swap);

      expect(mockArkClient.refundVHtlc).toHaveBeenCalledWith(
        Buffer.from('aa'.repeat(32), 'hex'),
        mockArkClient.pubkey,
        Buffer.from('02'.repeat(33), 'hex'),
        {
          txId: 'reverse-lockup-tx',
          vout: 2,
        },
        expect.any(String),
      );

      expect(RefundTransactionRepository.addTransaction).toHaveBeenCalledWith({
        swapId: swap.id,
        symbol: 'ARK',
        id: refundTxId,
        vin: null,
      });

      expect(swapNursery.emit).toHaveBeenCalledWith('refund', {
        swap,
        confirmed: false,
        emitFailure: true,
        refundTransaction: refundTxId,
      });

      const pendingEmitOrder = (swapNursery.emit as jest.Mock).mock
        .invocationCallOrder[0];
      const addTransactionOrder = (
        RefundTransactionRepository.addTransaction as jest.Mock
      ).mock.invocationCallOrder[0];
      expect(addTransactionOrder).toBeLessThan(pendingEmitOrder);

      expect(
        (swapNursery as any).refundWatcher.checkTransaction,
      ).toHaveBeenCalledWith(
        {
          swapId: swap.id,
          symbol: 'ARK',
          id: refundTxId,
          vin: null,
        },
        swap,
      );
    });

    test('should not persist or emit anything when the ARK refund fails', async () => {
      mockArkClient.refundVHtlc.mockRejectedValueOnce(
        new Error('refund failed'),
      );

      const swap = {
        id: 'reverse-ark-swap',
        type: SwapType.ReverseSubmarine,
        preimageHash: 'aa'.repeat(32),
        claimPublicKey: '02'.repeat(33),
        transactionId: 'reverse-lockup-tx',
        transactionVout: 2,
      } as any;

      await expect(
        (swapNursery as any).refundVtxo(mockArkCurrency, swap),
      ).rejects.toThrow('refund failed');

      expect(
        WrappedSwapRepository.setTransactionRefunded,
      ).not.toHaveBeenCalled();
      expect(RefundTransactionRepository.addTransaction).not.toHaveBeenCalled();
      expect(swapNursery.emit).not.toHaveBeenCalled();
      expect(
        (swapNursery as any).refundWatcher.checkTransaction,
      ).not.toHaveBeenCalled();
    });

    test('should propagate errors when persisting the refund transaction fails', async () => {
      (
        RefundTransactionRepository.addTransaction as jest.Mock
      ).mockRejectedValueOnce(new Error('database error'));

      const swap = {
        id: 'reverse-ark-swap',
        type: SwapType.ReverseSubmarine,
        preimageHash: 'aa'.repeat(32),
        claimPublicKey: '02'.repeat(33),
        transactionId: 'reverse-lockup-tx',
        transactionVout: 2,
      } as any;

      await expect(
        (swapNursery as any).refundVtxo(mockArkCurrency, swap),
      ).rejects.toThrow('database error');

      // The swap is not marked as refunded before the refund transaction is
      // persisted, so a failure here leaves the swap eligible for a retry
      // instead of stuck in a terminal state without a refund transaction
      expect(
        WrappedSwapRepository.setTransactionRefunded,
      ).not.toHaveBeenCalled();
      expect(swapNursery.emit).not.toHaveBeenCalled();
      expect(
        (swapNursery as any).refundWatcher.checkTransaction,
      ).not.toHaveBeenCalled();
    });

    test('should emit the pending refund before the watcher confirms it', async () => {
      await swapNursery.init([]);

      const refundWatcher = (swapNursery as any).refundWatcher;
      const confirmedHandler = (refundWatcher.on as jest.Mock).mock.calls.find(
        ([event]) => event === 'refund.confirmed',
      )![1];
      (refundWatcher.checkTransaction as jest.Mock).mockImplementation(
        async (tx, checkedSwap) => {
          await confirmedHandler({
            swap: checkedSwap,
            refundTransaction: tx.id,
          });
        },
      );

      const emittedConfirmations: boolean[] = [];
      swapNursery.on('refund', ({ confirmed }) => {
        emittedConfirmations.push(confirmed);
      });

      const swap = {
        id: 'chain-ark-swap',
        type: SwapType.Chain,
        refundCurrency: 'ARK',
        preimageHash: 'bb'.repeat(32),
        sendingData: {
          theirPublicKey: '02'.repeat(33),
          transactionId: 'chain-lockup-tx',
          transactionVout: 5,
        },
      } as unknown as ChainSwapInfo;

      await (swapNursery as any).refundVtxo(mockArkCurrency, swap);

      expect(emittedConfirmations).toEqual([false, true]);
      expect(swapNursery.emit).toHaveBeenCalledWith('refund', {
        swap,
        confirmed: true,
        emitFailure: false,
        refundTransaction: refundTxId,
      });
    });

    test('should refund chain ARK swaps with the sending data outpoint', async () => {
      const swap = {
        id: 'chain-ark-swap',
        type: SwapType.Chain,
        preimageHash: 'bb'.repeat(32),
        sendingData: {
          theirPublicKey: '02'.repeat(33),
          transactionId: 'chain-lockup-tx',
          transactionVout: 5,
        },
      } as unknown as ChainSwapInfo;

      await (swapNursery as any).refundVtxo(mockArkCurrency, swap);

      expect(mockArkClient.refundVHtlc).toHaveBeenCalledWith(
        Buffer.from('bb'.repeat(32), 'hex'),
        mockArkClient.pubkey,
        Buffer.from('02'.repeat(33), 'hex'),
        {
          txId: 'chain-lockup-tx',
          vout: 5,
        },
        expect.any(String),
      );

      expect(RefundTransactionRepository.addTransaction).toHaveBeenCalledWith({
        swapId: swap.id,
        symbol: 'ARK',
        id: refundTxId,
        vin: null,
      });

      expect(
        (swapNursery as any).refundWatcher.checkTransaction,
      ).toHaveBeenCalledWith(
        {
          swapId: swap.id,
          symbol: 'ARK',
          id: refundTxId,
          vin: null,
        },
        swap,
      );
    });
  });

  describe('claimEther', () => {
    const buildManager = () =>
      ({
        networkDetails: { name: 'Rootstock', symbol: 'RBTC' },
      }) as any;

    const swap = {
      id: 'submarine-ether-swap',
      type: SwapType.Submarine,
      pair: 'BTC/RBTC',
      orderSide: OrderSide.BUY,
    } as any;

    const etherSwapValues = {
      amount: 1n,
      refundAddress: '0xboltz',
      timelock: 1,
    } as any;

    beforeEach(() => {
      jest.spyOn(swapNursery, 'emit');
    });

    test('should emit claim.failure with the network symbol and rethrow when the claim fails', async () => {
      const error = new Error('claimEther reverted');
      const contracts = {
        contractHandler: {
          claimEther: jest.fn().mockRejectedValue(error),
        },
      } as any;

      await expect(
        (swapNursery as any).claimEther(
          buildManager(),
          contracts,
          swap,
          etherSwapValues,
          Buffer.from('preimage'),
        ),
      ).rejects.toThrow(error);

      expect(swapNursery.emit).toHaveBeenCalledWith('claim.failure', {
        swap,
        symbol: 'RBTC',
        error: error.message,
      });
      expect(swapNursery.emit).not.toHaveBeenCalledWith(
        'claim',
        expect.anything(),
      );
    });
  });

  describe('claimERC20', () => {
    const swap = {
      id: 'submarine-erc20-swap',
      type: SwapType.Submarine,
      pair: 'BTC/USDT',
      orderSide: OrderSide.BUY,
    } as any;

    const erc20SwapValues = {
      amount: 1n,
      refundAddress: '0xboltz',
      timelock: 1,
    } as any;

    beforeEach(() => {
      (swapNursery as any).walletManager = {
        ethereumManagers: [],
        wallets: new Map([['USDT', { walletProvider: {} }]]),
      };
      jest.spyOn(swapNursery, 'emit');
    });

    test('should emit claim.failure with the chain currency and rethrow when the claim fails', async () => {
      const error = new Error('claimToken reverted');
      const contractHandler = {
        claimToken: jest.fn().mockRejectedValue(error),
      } as any;

      await expect(
        (swapNursery as any).claimERC20(
          contractHandler,
          swap,
          erc20SwapValues,
          Buffer.from('preimage'),
        ),
      ).rejects.toThrow(error);

      expect(swapNursery.emit).toHaveBeenCalledWith('claim.failure', {
        swap,
        symbol: 'USDT',
        error: error.message,
      });
      expect(swapNursery.emit).not.toHaveBeenCalledWith(
        'claim',
        expect.anything(),
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
        .mockResolvedValue(refundTransaction.hex);
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
        refundTransaction: refundTransaction.id,
      });

      expect(mockChainClient.getRawTransaction).toHaveBeenCalledWith(
        refundTransaction.id,
      );
      const refundEmits = (swapNursery.emit as jest.Mock).mock.calls
        .filter(([event]) => event === 'refund')
        .map(([, args]) => args);

      expect(refundEmits).toHaveLength(1);
      expect(refundEmits[0]).toEqual({
        swap,
        confirmed: true,
        emitFailure: false,
        refundTransaction: expect.anything(),
      });
      expect(refundEmits[0].refundTransaction.id).toEqual(refundTransaction.id);
      expect(refundEmits[0].refundTransaction.hex).toEqual(
        refundTransaction.hex,
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

    describe('EVM refund', () => {
      const lockupTxId = '0xservertx';

      const buildEthereumNursery = (extras: Record<string, any> = {}) => ({
        ethereumManager: {
          provider: {} as any,
          address: '0xboltz',
          networkDetails: { name: 'Ethereum' },
          hasSymbol: jest.fn().mockReturnValue(true),
          contractsForAddress: jest.fn().mockResolvedValue({
            etherSwap: {} as any,
            erc20Swap: {} as any,
            contractHandler: {
              refundEther: jest.fn().mockResolvedValue({
                hash: '0xrefund',
                gasPrice: 1n,
                gasLimit: 1n,
              }),
              refundToken: jest.fn().mockResolvedValue({
                hash: '0xrefund',
                gasPrice: 1n,
                gasLimit: 1n,
              }),
            },
          }),
          ...extras,
        },
      });

      const buildChainSwap = () =>
        ({
          id: 'chain-swap-id',
          type: SwapType.Chain,
          preimageHash: 'aa'.repeat(32),
          sendingData: {
            lockupAddress: '0xserverlock',
            transactionId: lockupTxId,
          },
        }) as unknown as ChainSwapInfo;

      beforeEach(() => {
        (
          WrappedSwapRepository.setTransactionRefunded as jest.Mock
        ).mockImplementation(async (swap) => swap);
        (
          RefundTransactionRepository.addTransaction as jest.Mock
        ).mockResolvedValue(undefined);
        (queryEtherSwapValuesFromLock as jest.Mock)
          .mockReset()
          .mockResolvedValue({
            amount: 1n,
            claimAddress: '0xclaim',
            refundAddress: '0xboltz',
            timelock: 1,
            preimageHash: Buffer.alloc(32),
          });
        (queryERC20SwapValuesFromLock as jest.Mock)
          .mockReset()
          .mockResolvedValue({
            amount: 1n,
            claimAddress: '0xclaim',
            refundAddress: '0xboltz',
            timelock: 1,
            preimageHash: Buffer.alloc(32),
            tokenAddress: '0xtoken',
          });
      });

      test('refundEther passes lockedByUser: false (regression: chain swap server-side refund must not consult user-side commitment)', async () => {
        (swapNursery as any).ethereumNurseries = [buildEthereumNursery()];
        const swap = buildChainSwap();

        await (swapNursery as any).refundEther(swap, 'ETH');

        expect(queryEtherSwapValuesFromLock).toHaveBeenCalledTimes(1);
        expect(queryEtherSwapValuesFromLock).toHaveBeenCalledWith(
          swap,
          expect.anything(),
          expect.anything(),
          lockupTxId,
          false,
        );
      });

      test('refundERC20 passes lockedByUser: false (regression: chain swap server-side refund must not consult user-side commitment)', async () => {
        (swapNursery as any).ethereumNurseries = [buildEthereumNursery()];
        const erc20Wallet = { walletProvider: {} } as any;
        swapNursery.currencies = new Map([['USDT', mockCurrency]]);
        (swapNursery as any).walletManager = {
          ethereumManagers: [],
          wallets: new Map([['USDT', erc20Wallet]]),
        };
        const swap = buildChainSwap();

        await (swapNursery as any).refundERC20(swap, 'USDT');

        expect(queryERC20SwapValuesFromLock).toHaveBeenCalledTimes(1);
        expect(queryERC20SwapValuesFromLock).toHaveBeenCalledWith(
          swap,
          expect.anything(),
          expect.anything(),
          lockupTxId,
          false,
        );
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

      resolveRawTransaction(new Transaction().hex);
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
