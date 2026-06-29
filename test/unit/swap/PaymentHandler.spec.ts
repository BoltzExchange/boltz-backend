import Logger from '../../../lib/Logger';
import { getHexBuffer } from '../../../lib/Utils';
import { SwapType, SwapUpdateEvent } from '../../../lib/consts/Enums';
import { LightningPaymentStatus } from '../../../lib/db/models/LightningPayment';
import type Swap from '../../../lib/db/models/Swap';
import SendApprovalHoldRepository from '../../../lib/db/repositories/SendApprovalHoldRepository';
import LightningErrors from '../../../lib/lightning/Errors';
import type { LightningClient } from '../../../lib/lightning/LightningClient';
import LndClient from '../../../lib/lightning/LndClient';
import { Signer } from '../../../lib/proto/boltzrpc';
import { Payment_PaymentStatus } from '../../../lib/proto/lnd/rpc';
import SignerControlRegistry from '../../../lib/service/SignerControlRegistry';
import TimeoutDeltaProvider from '../../../lib/service/TimeoutDeltaProvider';
import type DecodedInvoiceSidecar from '../../../lib/sidecar/DecodedInvoice';
import { InvoiceType } from '../../../lib/sidecar/DecodedInvoice';
import type Sidecar from '../../../lib/sidecar/Sidecar';
import NodeSwitch from '../../../lib/swap/NodeSwitch';
import PaymentHandler from '../../../lib/swap/PaymentHandler';
import { InvoicePaymentHookAction } from '../../../lib/swap/hooks/InvoicePaymentHook';
import { SendApprovalAction } from '../../../lib/swap/hooks/SendApprovalHook';
import type { Currency } from '../../../lib/wallet/WalletManager';
import { raceCall } from '../../Utils';

jest.mock('../../../lib/swap/NodeSwitch', () => {
  const nodeSwitch = jest.fn().mockImplementation(() => {
    return {
      getSwapNode: jest
        .fn()
        .mockImplementation(
          (currency) => currency.lndClients?.values().next().value,
        ),
      invoicePaymentHook: jest.fn(),
    };
  });

  return nodeSwitch;
});

const MockedNodeSwitch = <jest.Mock<NodeSwitch>>(<any>NodeSwitch);

jest.mock('../../../lib/db/repositories/SendApprovalHoldRepository', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    remove: jest.fn(),
    exists: jest.fn().mockResolvedValue(false),
  },
}));

let cltvLimit = 100;

jest.mock('../../../lib/service/TimeoutDeltaProvider', () => {
  return jest.fn().mockImplementation(() => ({
    getCltvLimit: jest.fn().mockImplementation(async () => cltvLimit),
  }));
});

const MockedTimeoutDeltaProvider = <jest.Mock<TimeoutDeltaProvider>>(
  (<any>TimeoutDeltaProvider)
);

let sendPaymentError: any;
let trackPaymentResponse: any;

jest.mock('../../../lib/lightning/LndClient', () => {
  return jest.fn().mockImplementation(() => {
    const baseObject = Object.create(LndClient.prototype);
    return Object.assign(baseObject, {
      id: 'lnd-1',
      raceCall,
      resetMissionControl: jest.fn().mockResolvedValue(undefined),
      trackPayment: jest.fn().mockImplementation(async () => {
        return trackPaymentResponse;
      }),
      sendPayment: jest.fn().mockImplementation(async () => {
        if (sendPaymentError !== undefined) {
          throw sendPaymentError;
        }
      }),
    });
  });
});

LndClient.formatPaymentFailureReason = jest.fn();

const MockedLndClient = <jest.Mock<LndClient>>(<any>LndClient);

const sidecar = {
  decodeInvoiceOrOffer: jest.fn().mockResolvedValue(InvoiceType.Bolt11),
} as unknown as Sidecar;

describe('PaymentHandler', () => {
  const nodeSwitch = MockedNodeSwitch();
  const signerControlRegistry = SignerControlRegistry.getInstance();
  let relevantPayments: any[] = [];

  const mockedEmit = jest.fn();

  const sendApprovalHook = {
    hook: jest.fn().mockResolvedValue(SendApprovalAction.Accept),
  };

  const btcLndClient = MockedLndClient();

  const btcCurrency = {
    symbol: 'BTC',
    lndClients: new Map([[btcLndClient.id, btcLndClient]]),
  } as Currency;

  const swap = {
    id: 'test',
    invoice: 'lnbcrt1testinvoice',
    pair: 'BTC/BTC',
    type: SwapType.Submarine,
    preimageHash:
      '8bc944ac6563a0dc50c2666ffc1f6cc6295d5f093859f869c8d065fcb965443a',
    status: SwapUpdateEvent.InvoicePending,
    update: jest.fn().mockImplementation(async () => swap),
  } as any as Swap;

  const handler = new PaymentHandler(
    Logger.disabledLogger,
    sidecar,
    nodeSwitch,
    new Map<string, Currency>([['BTC', btcCurrency]]),
    MockedTimeoutDeltaProvider(),
    {
      sendPayment: jest
        .fn()
        .mockImplementation(
          (_: LightningClient, invoice: string, cltvLimit?: number) => {
            return btcLndClient.sendPayment(invoice, cltvLimit);
          },
        ),
      getRelevantNode: jest
        .fn()
        .mockImplementation(async (_currency, _swap, node) => {
          return {
            node,
            paymentHash: swap.preimageHash,
            payments: relevantPayments,
            existingRelevantAction: relevantPayments.find((p: any) =>
              [
                LightningPaymentStatus.Pending,
                LightningPaymentStatus.Success,
                LightningPaymentStatus.PermanentFailure,
              ].includes(p.status),
            ),
          };
        }),
    } as any,
    { emit: mockedEmit } as any,
    sendApprovalHook as any,
  );
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  handler['selfPaymentClient'] = {
    handleSelfPayment: jest.fn().mockResolvedValue({
      isSelf: false,
      result: undefined,
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    cltvLimit = 100;
    sendPaymentError = undefined;
    trackPaymentResponse = undefined;
    (signerControlRegistry as any)['disabledSigners'].clear();
    (signerControlRegistry as any)['repository'] = undefined;
    sendApprovalHook.hook.mockResolvedValue(SendApprovalAction.Accept);
    (SendApprovalHoldRepository.exists as jest.Mock)
      .mockReset()
      .mockResolvedValue(false);
    (SendApprovalHoldRepository.create as jest.Mock).mockReset();
    (SendApprovalHoldRepository.remove as jest.Mock).mockReset();
    relevantPayments = [];
    (
      handler['selfPaymentClient'].handleSelfPayment as jest.Mock
    ).mockResolvedValue({
      isSelf: false,
      result: undefined,
    });
  });

  test('should check payment for CLTV limits that are too small', async () => {
    cltvLimit = 1;
    sendPaymentError = undefined;
    trackPaymentResponse = {
      status: Payment_PaymentStatus.IN_FLIGHT,
    };

    await expect(handler.payInvoice(swap)).resolves.toEqual(undefined);

    expect(mockedEmit).not.toHaveBeenCalled();
    expect(btcLndClient.trackPayment).toHaveBeenCalledTimes(1);
    expect(btcLndClient.trackPayment).toHaveBeenCalledWith(
      getHexBuffer(swap.preimageHash),
    );
  });

  test('should fail fast for new payments when invoice signer is disabled', async () => {
    await signerControlRegistry.disableSigners([
      Signer.SIGNER_SUBMARINE_INVOICE_PAYMENT,
    ]);

    await expect(handler.payInvoice(swap)).resolves.toEqual(undefined);

    expect(
      handler['selfPaymentClient'].handleSelfPayment,
    ).toHaveBeenCalledTimes(1);
    expect(handler['selfPaymentClient'].handleSelfPayment).toHaveBeenCalledWith(
      swap,
      0,
      cltvLimit,
      [],
    );
    expect(btcLndClient.sendPayment).not.toHaveBeenCalled();
    expect(swap.update).toHaveBeenCalledTimes(1);
    expect(swap.update).toHaveBeenCalledWith({
      failureReason: 'invoice could not be paid',
      status: SwapUpdateEvent.InvoiceFailedToPay,
    });
  });

  test('should fail when the send approval hook rejects', async () => {
    sendApprovalHook.hook.mockResolvedValue(SendApprovalAction.Reject);

    await expect(handler.payInvoice(swap)).resolves.toEqual(undefined);

    expect(sendApprovalHook.hook).toHaveBeenCalledTimes(1);
    expect(btcLndClient.sendPayment).not.toHaveBeenCalled();
    expect(swap.update).toHaveBeenCalledTimes(1);
    expect(swap.update).toHaveBeenCalledWith({
      failureReason: 'invoice could not be paid',
      status: SwapUpdateEvent.InvoiceFailedToPay,
    });
  });

  test('should hold the payment without paying or failing when the send approval hook holds', async () => {
    sendApprovalHook.hook.mockResolvedValue(SendApprovalAction.Hold);

    await expect(handler.payInvoice(swap)).resolves.toEqual(undefined);

    expect(sendApprovalHook.hook).toHaveBeenCalledTimes(1);
    expect(btcLndClient.sendPayment).not.toHaveBeenCalled();
    expect(swap.update).not.toHaveBeenCalled();
    expect(SendApprovalHoldRepository.create).toHaveBeenCalledWith({
      swapId: swap.id,
      type: SwapType.Submarine,
    });
  });

  test('should ask with a hold fallback and not release a held payment', async () => {
    (SendApprovalHoldRepository.exists as jest.Mock).mockResolvedValue(true);
    sendApprovalHook.hook.mockResolvedValue(SendApprovalAction.Hold);

    await expect(handler.payInvoice(swap)).resolves.toEqual(undefined);

    expect(sendApprovalHook.hook).toHaveBeenCalledWith(
      swap.id,
      swap.pair,
      'BTC',
      expect.anything(),
      SendApprovalAction.Hold,
    );
    expect(btcLndClient.sendPayment).not.toHaveBeenCalled();
    expect(SendApprovalHoldRepository.remove).not.toHaveBeenCalled();
  });

  test('should remove the hold and pay when accepted after being held', async () => {
    (SendApprovalHoldRepository.exists as jest.Mock).mockResolvedValue(true);
    sendApprovalHook.hook.mockResolvedValue(SendApprovalAction.Accept);

    await expect(handler.payInvoice(swap)).resolves.toEqual(undefined);

    expect(SendApprovalHoldRepository.remove).toHaveBeenCalledWith(swap.id);
    expect(btcLndClient.sendPayment).toHaveBeenCalledTimes(1);
  });

  test('should remove the hold when a held payment is rejected', async () => {
    (SendApprovalHoldRepository.exists as jest.Mock).mockResolvedValue(true);
    sendApprovalHook.hook.mockResolvedValue(SendApprovalAction.Reject);

    await expect(handler.payInvoice(swap)).resolves.toEqual(undefined);

    expect(SendApprovalHoldRepository.remove).toHaveBeenCalledWith(swap.id);
    expect(btcLndClient.sendPayment).not.toHaveBeenCalled();
    expect(swap.update).toHaveBeenCalledWith({
      failureReason: 'invoice could not be paid',
      status: SwapUpdateEvent.InvoiceFailedToPay,
    });
  });

  test('should clear any hold and pay on a normal accepted payment', async () => {
    await expect(handler.payInvoice(swap)).resolves.toEqual(undefined);

    expect(sendApprovalHook.hook).toHaveBeenCalledWith(
      swap.id,
      swap.pair,
      'BTC',
      expect.anything(),
      undefined,
    );
    expect(SendApprovalHoldRepository.create).not.toHaveBeenCalled();
    expect(SendApprovalHoldRepository.remove).toHaveBeenCalledWith(swap.id);
    expect(btcLndClient.sendPayment).toHaveBeenCalledTimes(1);
  });

  test('should pay once the send approval hook stops holding', async () => {
    sendApprovalHook.hook
      .mockResolvedValueOnce(SendApprovalAction.Hold)
      .mockResolvedValueOnce(SendApprovalAction.Accept);

    await expect(handler.payInvoice(swap)).resolves.toEqual(undefined);
    expect(btcLndClient.sendPayment).not.toHaveBeenCalled();

    await handler.payInvoice(swap);

    expect(sendApprovalHook.hook).toHaveBeenCalledTimes(2);
    expect(btcLndClient.sendPayment).toHaveBeenCalledTimes(1);
  });

  test('should not ask the send approval hook when a payment is already in flight', async () => {
    relevantPayments = [{ status: LightningPaymentStatus.Pending } as any];
    sendApprovalHook.hook.mockResolvedValue(SendApprovalAction.Reject);

    await expect(handler.payInvoice(swap)).resolves.toEqual(undefined);

    expect(sendApprovalHook.hook).not.toHaveBeenCalled();
    expect(btcLndClient.sendPayment).toHaveBeenCalledTimes(1);
    expect(swap.update).not.toHaveBeenCalled();
  });

  test('should ask the send approval hook on a retry after a temporary failure', async () => {
    relevantPayments = [
      { status: LightningPaymentStatus.TemporaryFailure } as any,
    ];
    sendApprovalHook.hook.mockResolvedValue(SendApprovalAction.Reject);

    await expect(handler.payInvoice(swap)).resolves.toEqual(undefined);

    expect(sendApprovalHook.hook).toHaveBeenCalledTimes(1);
    expect(btcLndClient.sendPayment).not.toHaveBeenCalled();
    expect(swap.update).toHaveBeenCalledWith({
      failureReason: 'invoice could not be paid',
      status: SwapUpdateEvent.InvoiceFailedToPay,
    });
  });

  test('should allow an in-flight payment to resolve when signer is disabled', async () => {
    await signerControlRegistry.disableSigners([
      Signer.SIGNER_SUBMARINE_INVOICE_PAYMENT,
    ]);
    relevantPayments = [{ status: LightningPaymentStatus.Pending } as any];

    await expect(handler.payInvoice(swap)).resolves.toEqual(undefined);

    expect(
      handler['selfPaymentClient'].handleSelfPayment,
    ).toHaveBeenCalledTimes(1);
    expect(handler['selfPaymentClient'].handleSelfPayment).toHaveBeenCalledWith(
      swap,
      0,
      cltvLimit,
      relevantPayments,
    );
    expect(btcLndClient.sendPayment).toHaveBeenCalledTimes(1);
    expect(swap.update).not.toHaveBeenCalled();
  });

  test('should fail fast on a temporary-failure retry when signer is disabled', async () => {
    await signerControlRegistry.disableSigners([
      Signer.SIGNER_SUBMARINE_INVOICE_PAYMENT,
    ]);
    relevantPayments = [
      { status: LightningPaymentStatus.TemporaryFailure } as any,
    ];

    await expect(handler.payInvoice(swap)).resolves.toEqual(undefined);

    expect(sendApprovalHook.hook).not.toHaveBeenCalled();
    expect(btcLndClient.sendPayment).not.toHaveBeenCalled();
    expect(swap.update).toHaveBeenCalledWith({
      failureReason: 'invoice could not be paid',
      status: SwapUpdateEvent.InvoiceFailedToPay,
    });
  });

  test.each`
    error
    ${PaymentHandler['errCltvTooSmall']}
    ${{ details: 'invoice is already paid' }}
    ${{ details: 'cltv limit 123 should be greater than 232' }}
  `('should check payment for pay error "$error"', async ({ error }) => {
    cltvLimit = 100;
    sendPaymentError = error;
    trackPaymentResponse = {
      status: Payment_PaymentStatus.FAILED,
    };

    await expect(handler.payInvoice(swap)).resolves.toEqual(undefined);

    expect(mockedEmit).not.toHaveBeenCalled();
    expect(btcLndClient.resetMissionControl).not.toHaveBeenCalled();
    expect(btcLndClient.trackPayment).toHaveBeenCalledTimes(1);
    expect(btcLndClient.trackPayment).toHaveBeenCalledWith(
      getHexBuffer(swap.preimageHash),
    );
  });

  test('should abandon swap when invoice expired', async () => {
    cltvLimit = 100;
    sendPaymentError = { details: 'invoice expired' };
    trackPaymentResponse = {
      status: Payment_PaymentStatus.FAILED,
    };

    expect(mockedEmit).not.toHaveBeenCalled();
    expect(btcLndClient.resetMissionControl).not.toHaveBeenCalled();
    expect(btcLndClient.trackPayment).not.toHaveBeenCalled();

    await expect(handler.payInvoice(swap)).resolves.toEqual(undefined);
    expect(swap.update).toHaveBeenCalledTimes(1);
    expect(swap.update).toHaveBeenCalledWith({
      failureReason: 'invoice could not be paid',
      status: SwapUpdateEvent.InvoiceFailedToPay,
    });
  });

  test('should abandon swap when payment times out', async () => {
    cltvLimit = 100;
    sendPaymentError = LightningErrors.PAYMENT_TIMED_OUT().message;
    trackPaymentResponse = {
      status: Payment_PaymentStatus.FAILED,
    };

    expect(mockedEmit).not.toHaveBeenCalled();
    expect(btcLndClient.resetMissionControl).not.toHaveBeenCalled();
    expect(btcLndClient.trackPayment).not.toHaveBeenCalled();

    await expect(handler.payInvoice(swap)).resolves.toEqual(undefined);
    expect(swap.update).toHaveBeenCalledTimes(1);
    expect(swap.update).toHaveBeenCalledWith({
      failureReason: 'invoice could not be paid',
      status: SwapUpdateEvent.InvoiceFailedToPay,
    });
  });

  test('should reset LND mission control only on interval', async () => {
    cltvLimit = 100;
    sendPaymentError = 'their node is offline';
    trackPaymentResponse = {
      status: Payment_PaymentStatus.FAILED,
    };

    await expect(handler.payInvoice(swap)).resolves.toEqual(undefined);

    expect(btcLndClient.resetMissionControl).toHaveBeenCalledTimes(1);
    expect(handler['lastResetMissionControl']).not.toBeUndefined();
    expect(handler['lastResetMissionControl']! - Date.now()).toBeLessThan(1000);

    // Reset MC not called
    const lastCallBefore = handler['lastResetMissionControl'];

    await expect(handler.payInvoice(swap)).resolves.toEqual(undefined);
    expect(btcLndClient.resetMissionControl).toHaveBeenCalledTimes(1);
    expect(handler['lastResetMissionControl']).toEqual(lastCallBefore);

    // After interval, it is called again
    jest.useFakeTimers();
    jest.advanceTimersByTime(PaymentHandler['resetMissionControlInterval'] + 1);

    await expect(handler.payInvoice(swap)).resolves.toEqual(undefined);
    expect(btcLndClient.resetMissionControl).toHaveBeenCalledTimes(2);
    expect(handler['lastResetMissionControl']! - Date.now()).toBeLessThan(1000);
  });

  test.each`
    hookNodeReturn                                                                              | getSwapNodeReturn       | expected                                                                                            | getSwapNodeCalled
    ${{ action: InvoicePaymentHookAction.Continue, client: 'hookClient' }}                      | ${{ node: 'swapNode' }} | ${{ action: InvoicePaymentHookAction.Continue, client: 'hookClient' }}                              | ${false}
    ${{ action: InvoicePaymentHookAction.Continue, client: 'hookClient', timePreference: 0.5 }} | ${{ node: 'swapNode' }} | ${{ action: InvoicePaymentHookAction.Continue, client: 'hookClient', timePreference: 0.5 }}         | ${false}
    ${{ action: InvoicePaymentHookAction.Hold }}                                                | ${{ node: 'swapNode' }} | ${{ action: InvoicePaymentHookAction.Hold }}                                                        | ${false}
    ${{ action: InvoicePaymentHookAction.Continue, timePreference: 0.5 }}                       | ${{ node: 'swapNode' }} | ${{ action: InvoicePaymentHookAction.Continue, client: { node: 'swapNode' }, timePreference: 0.5 }} | ${true}
    ${undefined}                                                                                | ${{ node: 'swapNode' }} | ${{ action: InvoicePaymentHookAction.Continue, client: { node: 'swapNode' } }}                      | ${true}
  `(
    'should get preferred node (hook: $hookNodeReturn, swap: $getSwapNodeReturn)',
    async ({
      hookNodeReturn,
      getSwapNodeReturn,
      expected,
      getSwapNodeCalled,
    }) => {
      const decodedInvoice = {
        type: InvoiceType.Bolt11,
      } as unknown as DecodedInvoiceSidecar;
      (nodeSwitch.invoicePaymentHook as jest.Mock).mockResolvedValue(
        hookNodeReturn,
      );
      (nodeSwitch.getSwapNode as jest.Mock).mockResolvedValue(
        getSwapNodeReturn,
      );

      const result = await handler['getPreferredNode'](
        btcCurrency,
        swap,
        decodedInvoice,
      );

      expect(result).toEqual(expected);
      expect(nodeSwitch.invoicePaymentHook).toHaveBeenCalledTimes(1);
      expect(nodeSwitch.invoicePaymentHook).toHaveBeenCalledWith(
        btcCurrency,
        { id: swap.id, invoice: swap.invoice },
        decodedInvoice,
      );

      if (getSwapNodeCalled) {
        expect(nodeSwitch.getSwapNode).toHaveBeenCalledTimes(1);
        expect(nodeSwitch.getSwapNode).toHaveBeenCalledWith(
          btcCurrency,
          decodedInvoice,
          swap,
        );
      } else {
        expect(nodeSwitch.getSwapNode).not.toHaveBeenCalled();
      }
    },
  );

  test('should not pay invoice when invoice payment hook holds', async () => {
    (nodeSwitch.invoicePaymentHook as jest.Mock).mockResolvedValueOnce({
      action: InvoicePaymentHookAction.Hold,
    });

    const result = await handler.payInvoice(swap);

    expect(result).toBeUndefined();
    expect(nodeSwitch.invoicePaymentHook).toHaveBeenCalledTimes(1);
    expect(
      handler['pendingPaymentTracker'].getRelevantNode,
    ).not.toHaveBeenCalled();
    expect(
      handler['selfPaymentClient'].handleSelfPayment,
    ).not.toHaveBeenCalled();
    expect(btcLndClient.sendPayment).not.toHaveBeenCalled();
    expect(swap.update).not.toHaveBeenCalled();
  });

  describe('SelfPaymentClient', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      cltvLimit = 100;
      sendPaymentError = undefined;
      trackPaymentResponse = {
        status: Payment_PaymentStatus.SUCCEEDED,
      };
    });

    test('should handle self payment when isSelf is true and result is defined', async () => {
      const mockPaymentResponse = {
        feeMsat: 0,
        preimage: getHexBuffer('abcd1234'),
      };

      (handler['selfPaymentClient'].handleSelfPayment as jest.Mock) = jest
        .fn()
        .mockResolvedValue({
          isSelf: true,
          result: mockPaymentResponse,
        });

      const settleInvoiceSpy = jest.spyOn(handler as any, 'settleInvoice');
      settleInvoiceSpy.mockResolvedValue(mockPaymentResponse.preimage);

      const result = await handler.payInvoice(swap);

      expect(result).toEqual(mockPaymentResponse.preimage);
      expect(
        handler['selfPaymentClient'].handleSelfPayment,
      ).toHaveBeenCalledTimes(1);
      expect(
        handler['selfPaymentClient'].handleSelfPayment,
      ).toHaveBeenCalledWith(swap, 0, cltvLimit, []);
      expect(settleInvoiceSpy).toHaveBeenCalledTimes(1);
      expect(settleInvoiceSpy).toHaveBeenCalledWith(swap, mockPaymentResponse);
      expect(btcLndClient.sendPayment).not.toHaveBeenCalled();
    });

    test('should handle self payment when isSelf is true but result is undefined', async () => {
      (handler['selfPaymentClient'].handleSelfPayment as jest.Mock) = jest
        .fn()
        .mockResolvedValue({
          isSelf: true,
          result: undefined,
        });

      const settleInvoiceSpy = jest.spyOn(handler as any, 'settleInvoice');

      const result = await handler.payInvoice(swap);

      expect(result).toBeUndefined();
      expect(
        handler['selfPaymentClient'].handleSelfPayment,
      ).toHaveBeenCalledTimes(1);
      expect(settleInvoiceSpy).not.toHaveBeenCalled();
      expect(btcLndClient.sendPayment).not.toHaveBeenCalled();
    });

    test('should proceed with normal payment when isSelf is false', async () => {
      (handler['selfPaymentClient'].handleSelfPayment as jest.Mock) = jest
        .fn()
        .mockResolvedValue({
          isSelf: false,
          result: undefined,
        });

      const result = await handler.payInvoice(swap);

      expect(
        handler['selfPaymentClient'].handleSelfPayment,
      ).toHaveBeenCalledTimes(1);
      expect(btcLndClient.sendPayment).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();
    });

    test('should abandon swap when self payment throws any other error', async () => {
      const genericError = new Error('Some self payment error');

      (handler['selfPaymentClient'].handleSelfPayment as jest.Mock) = jest
        .fn()
        .mockRejectedValue(genericError);

      const logPaymentFailureSpy = jest.spyOn(
        handler as any,
        'logPaymentFailure',
      );
      const abandonSwapSpy = jest.spyOn(handler as any, 'abandonSwap');
      abandonSwapSpy.mockResolvedValue(undefined);

      const result = await handler.payInvoice(swap);

      expect(result).toBeUndefined();
      expect(
        handler['selfPaymentClient'].handleSelfPayment,
      ).toHaveBeenCalledTimes(1);
      expect(logPaymentFailureSpy).toHaveBeenCalledTimes(1);
      expect(logPaymentFailureSpy).toHaveBeenCalledWith(
        swap,
        'Some self payment error',
      );
      expect(abandonSwapSpy).toHaveBeenCalledTimes(1);
      expect(abandonSwapSpy).toHaveBeenCalledWith(
        swap,
        'Some self payment error',
      );
      expect(btcLndClient.sendPayment).not.toHaveBeenCalled();
    });
  });
});
