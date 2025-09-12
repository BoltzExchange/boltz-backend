import Logger from '../../../lib/Logger';
import { getHexBuffer } from '../../../lib/Utils';
import { SwapUpdateEvent } from '../../../lib/consts/Enums';
import type Swap from '../../../lib/db/models/Swap';
import LightningErrors from '../../../lib/lightning/Errors';
import type { LightningClient } from '../../../lib/lightning/LightningClient';
import LndClient from '../../../lib/lightning/LndClient';
import { Payment } from '../../../lib/proto/lnd/rpc_pb';
import TimeoutDeltaProvider from '../../../lib/service/TimeoutDeltaProvider';
import type DecodedInvoiceSidecar from '../../../lib/sidecar/DecodedInvoice';
import { InvoiceType } from '../../../lib/sidecar/DecodedInvoice';
import type Sidecar from '../../../lib/sidecar/Sidecar';
import ChannelNursery from '../../../lib/swap/ChannelNursery';
import NodeSwitch from '../../../lib/swap/NodeSwitch';
import PaymentHandler from '../../../lib/swap/PaymentHandler';
import type { Currency } from '../../../lib/wallet/WalletManager';
import { raceCall } from '../../Utils';

jest.mock('../../../lib/swap/NodeSwitch', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getSwapNode: jest
        .fn()
        .mockImplementation((currency) => currency.lndClient),
      invoicePaymentHook: jest.fn(),
    };
  });
});

const MockedNodeSwitch = <jest.Mock<NodeSwitch>>(<any>NodeSwitch);

jest.mock('../../../lib/swap/ChannelNursery', () => {
  return jest.fn().mockImplementation();
});

const MockedChannelNursery = <jest.Mock<ChannelNursery>>(<any>ChannelNursery);

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

  const mockedEmit = jest.fn();

  const btcCurrency = {
    symbol: 'BTC',
    lndClient: MockedLndClient(),
  } as Currency;

  const swap = {
    id: 'test',
    pair: 'BTC/BTC',
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
    MockedChannelNursery(),
    MockedTimeoutDeltaProvider(),
    {
      sendPayment: jest
        .fn()
        .mockImplementation(
          (
            _: LightningClient,
            invoice: string,
            cltvLimit?: number,
            outgoingChannelId?: string,
          ) => {
            return btcCurrency.lndClient!.sendPayment(
              invoice,
              cltvLimit,
              outgoingChannelId,
            );
          },
        ),
      getRelevantNode: jest
        .fn()
        .mockImplementation(async (_currency, _swap, node) => {
          return { node };
        }),
    } as any,
    { emit: mockedEmit } as any,
  );
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  handler['selfPaymentClient'] = {
    handleSelfPayment: jest.fn().mockResolvedValue({
      isSelf: false,
      result: undefined,
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should check payment for CLTV limits that are too small', async () => {
    cltvLimit = 1;
    sendPaymentError = undefined;
    trackPaymentResponse = {
      status: Payment.PaymentStatus.IN_FLIGHT,
    };

    await expect(handler.payInvoice(swap, null, undefined)).resolves.toEqual(
      undefined,
    );

    expect(mockedEmit).not.toHaveBeenCalled();
    expect(btcCurrency.lndClient!.trackPayment).toHaveBeenCalledTimes(1);
    expect(btcCurrency.lndClient!.trackPayment).toHaveBeenCalledWith(
      getHexBuffer(swap.preimageHash),
    );
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
      status: Payment.PaymentStatus.FAILED,
    };

    await expect(handler.payInvoice(swap, null, undefined)).resolves.toEqual(
      undefined,
    );

    expect(mockedEmit).not.toHaveBeenCalled();
    expect(btcCurrency.lndClient!.resetMissionControl).not.toHaveBeenCalled();
    expect(btcCurrency.lndClient!.trackPayment).toHaveBeenCalledTimes(1);
    expect(btcCurrency.lndClient!.trackPayment).toHaveBeenCalledWith(
      getHexBuffer(swap.preimageHash),
    );
  });

  test('should abandon swap when invoice expired', async () => {
    cltvLimit = 100;
    sendPaymentError = { details: 'invoice expired' };
    trackPaymentResponse = {
      status: Payment.PaymentStatus.FAILED,
    };

    expect(mockedEmit).not.toHaveBeenCalled();
    expect(btcCurrency.lndClient!.resetMissionControl).not.toHaveBeenCalled();
    expect(btcCurrency.lndClient!.trackPayment).not.toHaveBeenCalled();

    await expect(handler.payInvoice(swap, null, undefined)).resolves.toEqual(
      undefined,
    );
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
      status: Payment.PaymentStatus.FAILED,
    };

    expect(mockedEmit).not.toHaveBeenCalled();
    expect(btcCurrency.lndClient!.resetMissionControl).not.toHaveBeenCalled();
    expect(btcCurrency.lndClient!.trackPayment).not.toHaveBeenCalled();

    await expect(handler.payInvoice(swap, null, undefined)).resolves.toEqual(
      undefined,
    );
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
      status: Payment.PaymentStatus.FAILED,
    };

    await expect(handler.payInvoice(swap, null, undefined)).resolves.toEqual(
      undefined,
    );

    expect(btcCurrency.lndClient!.resetMissionControl).toHaveBeenCalledTimes(1);
    expect(handler['lastResetMissionControl']).not.toBeUndefined();
    expect(handler['lastResetMissionControl']! - Date.now()).toBeLessThan(1000);

    // Reset MC not called
    const lastCallBefore = handler['lastResetMissionControl'];

    await expect(handler.payInvoice(swap, null, undefined)).resolves.toEqual(
      undefined,
    );
    expect(btcCurrency.lndClient!.resetMissionControl).toHaveBeenCalledTimes(1);
    expect(handler['lastResetMissionControl']).toEqual(lastCallBefore);

    // After interval, it is called again
    jest.useFakeTimers();
    jest.advanceTimersByTime(PaymentHandler['resetMissionControlInterval'] + 1);

    await expect(handler.payInvoice(swap, null, undefined)).resolves.toEqual(
      undefined,
    );
    expect(btcCurrency.lndClient!.resetMissionControl).toHaveBeenCalledTimes(2);
    expect(handler['lastResetMissionControl']! - Date.now()).toBeLessThan(1000);
  });

  test.each`
    hookNodeReturn                                   | getSwapNodeReturn       | expected                                                 | getSwapNodeCalled
    ${{ client: 'hookClient' }}                      | ${{ node: 'swapNode' }} | ${{ client: 'hookClient' }}                              | ${false}
    ${{ client: 'hookClient', timePreference: 0.5 }} | ${{ node: 'swapNode' }} | ${{ client: 'hookClient', timePreference: 0.5 }}         | ${false}
    ${{ timePreference: 0.5 }}                       | ${{ node: 'swapNode' }} | ${{ client: { node: 'swapNode' }, timePreference: 0.5 }} | ${true}
    ${undefined}                                     | ${{ node: 'swapNode' }} | ${{ client: { node: 'swapNode' } }}                      | ${true}
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

  describe('SelfPaymentClient', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      cltvLimit = 100;
      sendPaymentError = undefined;
      trackPaymentResponse = {
        status: Payment.PaymentStatus.SUCCEEDED,
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

      const result = await handler.payInvoice(swap, null, undefined);

      expect(result).toEqual(mockPaymentResponse.preimage);
      expect(
        handler['selfPaymentClient'].handleSelfPayment,
      ).toHaveBeenCalledTimes(1);
      expect(
        handler['selfPaymentClient'].handleSelfPayment,
      ).toHaveBeenCalledWith(swap, 0, cltvLimit, undefined);
      expect(settleInvoiceSpy).toHaveBeenCalledTimes(1);
      expect(settleInvoiceSpy).toHaveBeenCalledWith(swap, mockPaymentResponse);
      expect(btcCurrency.lndClient!.sendPayment).not.toHaveBeenCalled();
    });

    test('should handle self payment when isSelf is true but result is undefined', async () => {
      (handler['selfPaymentClient'].handleSelfPayment as jest.Mock) = jest
        .fn()
        .mockResolvedValue({
          isSelf: true,
          result: undefined,
        });

      const settleInvoiceSpy = jest.spyOn(handler as any, 'settleInvoice');

      const result = await handler.payInvoice(swap, null, undefined);

      expect(result).toBeUndefined();
      expect(
        handler['selfPaymentClient'].handleSelfPayment,
      ).toHaveBeenCalledTimes(1);
      expect(settleInvoiceSpy).not.toHaveBeenCalled();
      expect(btcCurrency.lndClient!.sendPayment).not.toHaveBeenCalled();
    });

    test('should proceed with normal payment when isSelf is false', async () => {
      (handler['selfPaymentClient'].handleSelfPayment as jest.Mock) = jest
        .fn()
        .mockResolvedValue({
          isSelf: false,
          result: undefined,
        });

      const result = await handler.payInvoice(swap, null, undefined);

      expect(
        handler['selfPaymentClient'].handleSelfPayment,
      ).toHaveBeenCalledTimes(1);
      expect(btcCurrency.lndClient!.sendPayment).toHaveBeenCalledTimes(1);
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

      const result = await handler.payInvoice(swap, null, undefined);

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
      expect(btcCurrency.lndClient!.sendPayment).not.toHaveBeenCalled();
    });
  });
});
