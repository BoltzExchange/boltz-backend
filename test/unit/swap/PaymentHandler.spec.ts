import Logger from '../../../lib/Logger';
import { getHexBuffer } from '../../../lib/Utils';
import { SwapUpdateEvent } from '../../../lib/consts/Enums';
import type Swap from '../../../lib/db/models/Swap';
import LightningErrors from '../../../lib/lightning/Errors';
import type { LightningClient } from '../../../lib/lightning/LightningClient';
import LndClient from '../../../lib/lightning/LndClient';
import { Payment } from '../../../lib/proto/lnd/rpc_pb';
import TimeoutDeltaProvider from '../../../lib/service/TimeoutDeltaProvider';
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
    mockedEmit,
  );

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
    hookNodeReturn                               | getSwapNodeReturn       | expected                                     | getSwapNodeCalled
    ${{ node: 'hookNode' }}                      | ${{ node: 'swapNode' }} | ${{ node: 'hookNode' }}                      | ${false}
    ${{ node: 'hookNode', timePreference: 0.5 }} | ${{ node: 'swapNode' }} | ${{ node: 'hookNode', timePreference: 0.5 }} | ${false}
    ${undefined}                                 | ${{ node: 'swapNode' }} | ${{ client: { node: 'swapNode' } }}          | ${true}
  `(
    'should get preferred node (hook: $hookNodeReturn, swap: $getSwapNodeReturn)',
    async ({
      hookNodeReturn,
      getSwapNodeReturn,
      expected,
      getSwapNodeCalled,
    }) => {
      const decodedInvoice = { type: InvoiceType.Bolt11 };
      sidecar.decodeInvoiceOrOffer = jest
        .fn()
        .mockResolvedValue(decodedInvoice);
      (nodeSwitch.invoicePaymentHook as jest.Mock).mockResolvedValue(
        hookNodeReturn,
      );
      (nodeSwitch.getSwapNode as jest.Mock).mockResolvedValue(
        getSwapNodeReturn,
      );

      const result = await handler['getPreferredNode'](btcCurrency, swap);

      expect(result).toEqual(expected);
      expect(sidecar.decodeInvoiceOrOffer).toHaveBeenCalledTimes(1);
      expect(sidecar.decodeInvoiceOrOffer).toHaveBeenCalledWith(swap.invoice);
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
});
