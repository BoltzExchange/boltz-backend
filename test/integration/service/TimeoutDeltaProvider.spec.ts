import { randomBytes } from 'crypto';
import { ConfigType } from '../../../lib/Config';
import Logger from '../../../lib/Logger';
import { splitPairId } from '../../../lib/Utils';
import { OrderSide, SwapVersion } from '../../../lib/consts/Enums';
import Errors from '../../../lib/service/Errors';
import TimeoutDeltaProvider from '../../../lib/service/TimeoutDeltaProvider';
import NodeSwitch from '../../../lib/swap/NodeSwitch';
import { Currency } from '../../../lib/wallet/WalletManager';
import {
  bitcoinClient,
  bitcoinLndClient,
  bitcoinLndClient2,
  elementsClient,
} from '../Nodes';

const mockGetOffsetValue = 60;
const mockGetOffset = jest.fn().mockReturnValue(mockGetOffsetValue);

jest.mock('../../../lib/service/RoutingOffsets', () => {
  return jest.fn().mockImplementation(() => ({
    getOffset: mockGetOffset,
  }));
});

jest.mock('../../../lib/db/repositories/ChainTipRepository');

jest.mock('../../../lib/wallet/ethereum/EthereumManager', () => {
  return jest.fn().mockImplementation(() => {});
});

describe('TimeoutDeltaProvider', () => {
  const deltaProvider = new TimeoutDeltaProvider(
    Logger.disabledLogger,
    {
      configpath: '',
      pairs: [],
    } as any as ConfigType,
    new Map<string, Currency>([
      [
        'BTC',
        {
          chainClient: bitcoinClient,
          lndClient: bitcoinLndClient,
        } as Currency,
      ],
      [
        'L-BTC',
        {
          chainClient: elementsClient,
        } as unknown as Currency,
      ],
    ]),
    new NodeSwitch(Logger.disabledLogger),
  );

  const pair = 'L-BTC/BTC';
  const { base, quote } = splitPairId(pair);
  const timeoutDelta = {
    reverse: 1400,
    swapMinimal: 1400,
    swapMaximal: 2800,
    swapTaproot: 10080,
  };

  beforeAll(async () => {
    await Promise.all([
      bitcoinClient.connect(),
      elementsClient.connect(),
      bitcoinLndClient.connect(false),
      bitcoinLndClient2.connect(false),
    ]);

    await bitcoinClient.generate(1);
  });

  afterAll(() => {
    [bitcoinClient, elementsClient, bitcoinLndClient, bitcoinLndClient2].map(
      (client) => client.disconnect(),
    );
  });

  test('should init', () => {
    deltaProvider.init(
      [
        {
          base,
          quote,
          timeoutDelta,
          minSwapAmount: 0,
          maxSwapAmount: 1,
        },
      ],
      [],
    );
  });

  test('should get timeouts of swaps without invoices', async () => {
    await expect(
      deltaProvider.getTimeout(pair, OrderSide.BUY, false, SwapVersion.Legacy),
    ).resolves.toEqual([
      timeoutDelta.swapMinimal / TimeoutDeltaProvider.blockTimes.get(quote)!,
      true,
    ]);
    await expect(
      deltaProvider.getTimeout(pair, OrderSide.SELL, false, SwapVersion.Legacy),
    ).resolves.toEqual([
      timeoutDelta.swapMinimal / TimeoutDeltaProvider.blockTimes.get(base)!,
      true,
    ]);
  });

  test('should get timeouts of swaps with invoices', async () => {
    const createInvoice = (cltvExpiry: number) => {
      return bitcoinLndClient2.addHoldInvoice(1, randomBytes(32), cltvExpiry);
    };

    // Minima
    await expect(
      deltaProvider.getTimeout(
        pair,
        OrderSide.SELL,
        false,
        SwapVersion.Legacy,
        await createInvoice(18),
      ),
    ).resolves.toEqual([
      timeoutDelta.swapMinimal / TimeoutDeltaProvider.blockTimes.get(base)!,
      true,
    ]);
    await expect(
      deltaProvider.getTimeout(
        pair,
        OrderSide.SELL,
        false,
        SwapVersion.Legacy,
        await createInvoice(40),
      ),
    ).resolves.toEqual([
      timeoutDelta.swapMinimal / TimeoutDeltaProvider.blockTimes.get(base)!,
      true,
    ]);

    // Greater than minimum
    for (const cltvDelta of [140, 150, 274]) {
      await expect(
        deltaProvider.getTimeout(
          pair,
          OrderSide.SELL,
          false,
          SwapVersion.Legacy,
          await createInvoice(
            Math.ceil(cltvDelta / TimeoutDeltaProvider.blockTimes.get(base)!),
          ),
        ),
      ).resolves.toEqual([
        Math.ceil(
          (cltvDelta * TimeoutDeltaProvider.blockTimes.get(quote)! +
            mockGetOffsetValue) /
            TimeoutDeltaProvider.blockTimes.get(base)!,
        ),
        true,
      ]);
    }

    // Greater than maximum
    const swapMaximal =
      timeoutDelta.swapMaximal / TimeoutDeltaProvider.blockTimes.get(quote)!;
    const invoiceCltv =
      swapMaximal -
      mockGetOffsetValue / TimeoutDeltaProvider.blockTimes.get(quote)! +
      1;
    const invoice = await createInvoice(invoiceCltv);
    await expect(
      deltaProvider.getTimeout(
        pair,
        OrderSide.SELL,
        false,
        SwapVersion.Legacy,
        invoice,
      ),
    ).rejects.toEqual(
      Errors.MIN_EXPIRY_TOO_BIG(
        timeoutDelta.swapMaximal,
        invoiceCltv * TimeoutDeltaProvider.blockTimes.get(quote)!,
        mockGetOffsetValue,
      ),
    );
  });

  test('should return max timeout for invoices that cannot be routed', async () => {
    await expect(
      deltaProvider.getTimeout(
        pair,
        OrderSide.SELL,
        false,
        SwapVersion.Legacy,
        'lnbcrt1n1pjtwpszsp53ap24lskmwzre57a7dzyvv3fr4j0xpnj84zedp2mx4xkvyd00mmqpp57dxxsvrtw6dhxzv09ufvjl2nwta65csqqv5rw7akvscv9aqlqclsdqqxqyjw5qcqp29qxpqysgq7t354a4juq8869psw0fp59g57fdh63cad4gdd0hl6pp7t2ytsexzq8qex4nx0a05n8u4kvh5ttv5zdm7d3uwjf6cglxstu7gfy56fqqp6wscqc',
      ),
    ).resolves.toEqual([
      timeoutDelta.swapMaximal * TimeoutDeltaProvider.blockTimes.get(base)!,
      false,
    ]);
  });

  test('should get timeouts of reverse swaps', async () => {
    await expect(
      deltaProvider.getTimeout(pair, OrderSide.BUY, true, SwapVersion.Legacy),
    ).resolves.toEqual([
      timeoutDelta.reverse / TimeoutDeltaProvider.blockTimes.get(base)!,
      false,
    ]);
    await expect(
      deltaProvider.getTimeout(pair, OrderSide.SELL, true, SwapVersion.Legacy),
    ).resolves.toEqual([
      timeoutDelta.reverse / TimeoutDeltaProvider.blockTimes.get(quote)!,
      false,
    ]);
  });

  afterAll(() => {
    bitcoinLndClient.disconnect();
  });
});
