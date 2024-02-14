import Logger from '../../../lib/Logger';
import { getHexBuffer } from '../../../lib/Utils';
import { SwapUpdateEvent } from '../../../lib/consts/Enums';
import Swap from '../../../lib/db/models/Swap';
import LndClient from '../../../lib/lightning/LndClient';
import { Payment } from '../../../lib/proto/lnd/rpc_pb';
import TimeoutDeltaProvider from '../../../lib/service/TimeoutDeltaProvider';
import ChannelNursery from '../../../lib/swap/ChannelNursery';
import NodeSwitch from '../../../lib/swap/NodeSwitch';
import PaymentHandler from '../../../lib/swap/PaymentHandler';
import { Currency } from '../../../lib/wallet/WalletManager';
import { raceCall } from '../../Utils';

jest.mock('../../../lib/swap/NodeSwitch', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getSwapNode: jest
        .fn()
        .mockImplementation((currency) => currency.lndClient),
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

const MockedLndClient = <jest.Mock<LndClient>>(<any>LndClient);

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
    nodeSwitch,
    new Map<string, Currency>([['BTC', btcCurrency]]),
    MockedChannelNursery(),
    MockedTimeoutDeltaProvider(),
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

    expect(mockedEmit).toHaveBeenCalledTimes(0);
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

    expect(mockedEmit).toHaveBeenCalledTimes(0);
    expect(btcCurrency.lndClient!.resetMissionControl).toHaveBeenCalledTimes(0);
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

    expect(mockedEmit).toHaveBeenCalledTimes(0);
    expect(btcCurrency.lndClient!.resetMissionControl).toHaveBeenCalledTimes(0);
    expect(btcCurrency.lndClient!.trackPayment).toHaveBeenCalledTimes(0);

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
});
