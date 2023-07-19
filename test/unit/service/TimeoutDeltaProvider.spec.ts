import { parse } from '@iarna/toml';
import { existsSync, readFileSync, unlinkSync } from 'fs';
import Logger from '../../../lib/Logger';
import Errors from '../../../lib/service/Errors';
import { ConfigType } from '../../../lib/Config';
import { OrderSide } from '../../../lib/consts/Enums';
import { PairConfig } from '../../../lib/consts/Types';
import { PayReq } from '../../../lib/proto/lnd/rpc_pb';
import LndClient from '../../../lib/lightning/LndClient';
import { Currency } from '../../../lib/wallet/WalletManager';
import EthereumManager from '../../../lib/wallet/ethereum/EthereumManager';
import TimeoutDeltaProvider, {
  PairTimeoutBlocksDelta,
} from '../../../lib/service/TimeoutDeltaProvider';

const currencies = [
  {
    base: 'BTC',
    quote: 'BTC',
    timeoutDelta: {
      reverse: 1440,
      swapMinimal: 360,
      swapMaximal: 2880,
    },
  },
  {
    base: 'LTC',
    quote: 'BTC',
    timeoutDelta: 20,
  },
  {
    base: 'L-BTC',
    quote: 'BTC',
    timeoutDelta: {
      reverse: 1440,
      swapMinimal: 1400,
      swapMaximal: 2880,
    },
  },
] as any as PairConfig[];

describe('TimeoutDeltaProvider', () => {
  const newDelta = 120;
  const configpath = 'config.toml';

  const cleanup = () => {
    if (existsSync(configpath)) {
      unlinkSync(configpath);
    }
  };

  const deltaProvider = new TimeoutDeltaProvider(
    Logger.disabledLogger,
    {
      configpath,
      pairs: [
        {
          base: 'LTC',
          quote: 'BTC',
        },
      ],
    } as ConfigType,
    new Map<string, Currency>(),
    {} as unknown as EthereumManager,
  );

  const createDeltas = (val: number): PairTimeoutBlocksDelta => {
    return {
      reverse: val,
      swapMinimal: val,
      swapMaximal: val,
    };
  };

  beforeAll(() => {
    cleanup();

    deltaProvider.init(currencies);
  });

  afterAll(() => {
    cleanup();
  });

  test('should init', () => {
    const deltas = deltaProvider['timeoutDeltas'];

    expect(deltas.size).toEqual(currencies.length);
    expect(deltas.get('BTC/BTC')).toEqual({
      base: {
        reverse: 144,
        swapMinimal: 36,
        swapMaximal: 288,
      },
      quote: {
        reverse: 144,
        swapMinimal: 36,
        swapMaximal: 288,
      },
    });
    expect(deltas.get('LTC/BTC')).toEqual({
      base: createDeltas(8),
      quote: createDeltas(2),
    });
  });

  test('should not init if no timeout delta was provided', () => {
    expect(() =>
      deltaProvider.init([
        {
          base: 'should',
          quote: 'throw',
        },
      ] as PairConfig[]),
    ).toThrow(Errors.NO_TIMEOUT_DELTA('should/throw').message);
  });

  test('should get timeout deltas', async () => {
    const pairId = 'LTC/BTC';

    await expect(
      deltaProvider.getTimeout(pairId, OrderSide.BUY, true),
    ).resolves.toEqual([8, false]);
    await expect(
      deltaProvider.getTimeout(pairId, OrderSide.BUY, false),
    ).resolves.toEqual([2, true]);

    await expect(
      deltaProvider.getTimeout(pairId, OrderSide.SELL, true),
    ).resolves.toEqual([2, false]);
    await expect(
      deltaProvider.getTimeout(pairId, OrderSide.SELL, false),
    ).resolves.toEqual([8, true]);

    // Should throw if pair cannot be found
    const notFound = 'notFound';

    await expect(
      deltaProvider.getTimeout(notFound, OrderSide.SELL, true),
    ).rejects.toEqual(Errors.PAIR_NOT_FOUND(notFound));
  });

  test('should set timeout deltas', () => {
    const pairId = 'LTC/BTC';

    deltaProvider.setTimeout(pairId, {
      reverse: newDelta,
      swapMinimal: newDelta,
      swapMaximal: newDelta,
    });

    expect(deltaProvider['timeoutDeltas'].get(pairId)).toEqual({
      base: createDeltas(120 / 2.5),
      quote: createDeltas(120 / 10),
    });

    // Should throw if pair cannot be found
    const notFound = 'notFound';

    expect(() => deltaProvider.setTimeout(notFound, createDeltas(20))).toThrow(
      Errors.PAIR_NOT_FOUND(notFound).message,
    );

    // Should throw if the new delta is invalid
    expect(() =>
      deltaProvider.setTimeout(pairId, {
        reverse: -newDelta,
        swapMinimal: -newDelta,
        swapMaximal: -newDelta,
      }),
    ).toThrow(Errors.INVALID_TIMEOUT_BLOCK_DELTA().message);
    expect(() =>
      deltaProvider.setTimeout(pairId, {
        reverse: 5,
        swapMinimal: 5,
        swapMaximal: 5,
      }),
    ).toThrow(Errors.INVALID_TIMEOUT_BLOCK_DELTA().message);
  });

  test('should write updated timeout deltas to config file', () => {
    const writtenConfig = parse(
      readFileSync(configpath, 'utf-8'),
    ) as ConfigType;

    expect(writtenConfig.pairs[0].timeoutDelta).toEqual(createDeltas(newDelta));
  });

  test('should use Ethereum block times if symbols that are not hardcoded are calculated', () => {
    const minutesToBlocks = deltaProvider['minutesToBlocks'];

    expect(
      minutesToBlocks('USDT/USDC', {
        reverse: 1,
        swapMinimal: 1,
        swapMaximal: 1,
      }),
    ).toEqual({
      base: createDeltas(5),
      quote: createDeltas(5),
    });
  });

  test('should convert blocks', () => {
    expect(TimeoutDeltaProvider.convertBlocks('LTC', 'BTC', 1)).toEqual(1);
    expect(TimeoutDeltaProvider.convertBlocks('LTC', 'BTC', 11)).toEqual(3);

    expect(TimeoutDeltaProvider.convertBlocks('BTC', 'LTC', 1)).toEqual(4);
    expect(TimeoutDeltaProvider.convertBlocks('BTC', 'LTC', 3)).toEqual(12);
  });

  test('should detect invoice MPP support', async () => {
    const mockQueryRoutes = jest.fn().mockResolvedValue({ routesList: [] });
    const lnd = {
      queryRoutes: mockQueryRoutes,
    } as unknown as LndClient;

    const dec = {
      getNumSatoshis: () => 10_000,
      getDestination: () => 'dest',
      getCltvExpiry: () => 80,
      getRouteHintsList: () => [],
    } as unknown as PayReq;

    const cltvLimit = 123;

    await deltaProvider.checkRoutability(
      lnd,
      {
        ...dec,
        toObject: () => ({ featuresMap: [] }),
      } as unknown as PayReq,
      cltvLimit,
    );
    expect(mockQueryRoutes).toHaveBeenNthCalledWith(
      1,
      dec.getDestination(),
      dec.getNumSatoshis(),
      cltvLimit,
      dec.getCltvExpiry(),
      dec.getRouteHintsList(),
    );

    await deltaProvider.checkRoutability(
      lnd,
      {
        ...dec,
        toObject: () => ({
          featuresMap: [
            [
              0,
              { name: 'multi-path-payments', isKnown: true, isRequired: false },
            ],
          ],
        }),
      } as unknown as PayReq,
      cltvLimit,
    );
    expect(mockQueryRoutes).toHaveBeenNthCalledWith(
      2,
      dec.getDestination(),
      Math.ceil(dec.getNumSatoshis() / LndClient.paymentMaxParts),
      cltvLimit,
      dec.getCltvExpiry(),
      dec.getRouteHintsList(),
    );
  });

  test('should have a floor of 1 sat for querying routes', async () => {
    const mockQueryRoutes = jest.fn().mockResolvedValue({ routesList: [] });
    const lnd = {
      queryRoutes: mockQueryRoutes,
    } as unknown as LndClient;

    const dec = {
      getNumSatoshis: () => 0,
      getDestination: () => 'dest',
      getCltvExpiry: () => 80,
      getRouteHintsList: () => [],
      toObject: () => ({ featuresMap: [] }),
    } as unknown as PayReq;

    const cltvLimit = 210;

    await deltaProvider.checkRoutability(lnd, dec, cltvLimit);
    expect(mockQueryRoutes).toHaveBeenNthCalledWith(
      1,
      dec.getDestination(),
      1,
      cltvLimit,
      dec.getCltvExpiry(),
      dec.getRouteHintsList(),
    );
  });
});
