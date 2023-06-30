import { randomBytes } from 'crypto';
import Logger from '../../../lib/Logger';
import { bitcoinLndClient } from '../Nodes';
import Errors from '../../../lib/service/Errors';
import { ConfigType } from '../../../lib/Config';
import { splitPairId } from '../../../lib/Utils';
import { OrderSide } from '../../../lib/consts/Enums';
import TimeoutDeltaProvider from '../../../lib/service/TimeoutDeltaProvider';

describe('TimeoutDeltaProvider', () => {
  const deltaProvider = new TimeoutDeltaProvider(Logger.disabledLogger, {
    configpath: '',
    pairs: [],
  } as any as ConfigType);

  const pair = 'LTC/BTC';
  const { base, quote } = splitPairId(pair);
  const timeoutDelta = {
    reverse: 1400,
    swapMinimal: 190,
    swapMaximal: 2800,
  };

  beforeAll(async () => {
    await bitcoinLndClient.connect(false);
  });

  test('should init', () => {
    deltaProvider.init([
      {
        base,
        quote,
        timeoutDelta,
        minSwapAmount: 0,
        maxSwapAmount: 1,
      },
    ]);
  });

  test('should get timeouts of swaps without invoices', () => {
    expect(deltaProvider.getTimeout(pair, OrderSide.BUY, false)).toEqual(
      timeoutDelta.swapMinimal / TimeoutDeltaProvider.blockTimes.get(quote)!,
    );
    expect(deltaProvider.getTimeout(pair, OrderSide.SELL, false)).toEqual(
      timeoutDelta.swapMinimal / TimeoutDeltaProvider.blockTimes.get(base)!,
    );
  });

  test('should get timeouts of swaps with invoices', async () => {
    const createInvoice = async (cltvExpiry: number) => {
      const { paymentRequest } = await bitcoinLndClient.addHoldInvoice(
        1,
        randomBytes(32),
        cltvExpiry,
      );
      return paymentRequest;
    };

    // Minima
    expect(
      deltaProvider.getTimeout(
        pair,
        OrderSide.BUY,
        false,
        await createInvoice(18),
      ),
    ).toEqual(
      timeoutDelta.swapMinimal / TimeoutDeltaProvider.blockTimes.get(quote)!,
    );
    expect(
      deltaProvider.getTimeout(
        pair,
        OrderSide.BUY,
        false,
        await createInvoice(40),
      ),
    ).toEqual(
      timeoutDelta.swapMinimal / TimeoutDeltaProvider.blockTimes.get(quote)!,
    );

    // Greater than minimum
    for (const cltvDelta of [140, 150, 274]) {
      const ltcBlocks = Math.ceil(
        cltvDelta / TimeoutDeltaProvider.blockTimes.get(base)!,
      );
      expect(
        deltaProvider.getTimeout(
          pair,
          OrderSide.BUY,
          false,
          await createInvoice(ltcBlocks),
        ),
      ).toEqual(
        Math.ceil(
          (cltvDelta + TimeoutDeltaProvider.minCltvOffset) /
            TimeoutDeltaProvider.blockTimes.get(quote)!,
        ),
      );
    }

    // Greater than maximum
    const swapMaximal =
      timeoutDelta.swapMaximal / TimeoutDeltaProvider.blockTimes.get(base)!;
    const invoiceCltv =
      swapMaximal -
      TimeoutDeltaProvider.minCltvOffset /
        TimeoutDeltaProvider.blockTimes.get(base)! +
      1;
    const invoice = await createInvoice(invoiceCltv);

    expect(() =>
      deltaProvider.getTimeout(pair, OrderSide.BUY, false, invoice),
    ).toThrow(
      Errors.MIN_EXPIRY_TOO_BIG(
        timeoutDelta.swapMaximal / TimeoutDeltaProvider.blockTimes.get(quote)!,
        timeoutDelta.swapMaximal / TimeoutDeltaProvider.blockTimes.get(quote)! +
          1,
      ).message,
    );
  });

  test('should get timeouts of reverse swaps', () => {
    expect(deltaProvider.getTimeout(pair, OrderSide.BUY, true)).toEqual(
      timeoutDelta.reverse / TimeoutDeltaProvider.blockTimes.get(base)!,
    );
    expect(deltaProvider.getTimeout(pair, OrderSide.SELL, true)).toEqual(
      timeoutDelta.reverse / TimeoutDeltaProvider.blockTimes.get(quote)!,
    );
  });

  afterAll(() => {
    bitcoinLndClient.disconnect();
  });
});
