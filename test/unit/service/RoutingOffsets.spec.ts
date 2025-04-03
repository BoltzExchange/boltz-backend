import type { ConfigType } from '../../../lib/Config';
import Logger from '../../../lib/Logger';
import { getPairId } from '../../../lib/Utils';
import RoutingOffsets from '../../../lib/service/RoutingOffsets';

describe('RoutingOffsets', () => {
  const config = {
    currencies: [
      {
        symbol: 'BTC',
        routingOffsetExceptions: [
          {
            nodeId: 'node 1',
            offset: 150,
          },
          {
            nodeId: 'node 2',
            offset: 120,
          },
        ],
      },
      {
        symbol: 'L-BTC',
      },
    ],
    pairs: [
      {
        base: 'BTC',
        quote: 'BTC',
        minSwapAmount: 50_000,
        maxSwapAmount: 10_000_000,
      },
      {
        base: 'L-BTC',
        quote: 'BTC',
        minSwapAmount: 10_000,
        maxSwapAmount: 10_000_000,
      },
    ],
  } as unknown as ConfigType;

  const offs = new RoutingOffsets(Logger.disabledLogger, config);

  test('should calculate formula params on init', () => {
    expect(offs['params'].size).toEqual(config.pairs.length);
    expect(Array.from(offs['params'].keys()).sort()).toEqual(
      config.pairs.map((pair) => getPairId(pair)).sort(),
    );
  });

  test('should populate routing offset exceptions on init', () => {
    expect(offs['exceptions'].size).toEqual(config.currencies.length);
    for (const [currency, exceptions] of offs['exceptions'].entries()) {
      const configExceptions = config.currencies.find(
        (cur) => cur.symbol === currency,
      )!;

      expect(Array.from(exceptions.entries()).sort()).toEqual(
        (configExceptions.routingOffsetExceptions || [])
          .map((ex) => [ex.nodeId, ex.offset])
          .sort(),
      );
    }
  });

  test.each`
    pair           | amount           | expected
    ${'BTC/BTC'}   | ${0}             | ${RoutingOffsets['minOffset']}
    ${'BTC/BTC'}   | ${10_000}        | ${RoutingOffsets['minOffset']}
    ${'BTC/BTC'}   | ${10_000_000}    | ${RoutingOffsets['maxOffset']}
    ${'BTC/BTC'}   | ${50_000}        | ${60}
    ${'BTC/BTC'}   | ${1_000_000}     | ${141}
    ${'BTC/BTC'}   | ${5_000_000}     | ${478}
    ${'BTC/BTC'}   | ${5_000_000_000} | ${RoutingOffsets['maxOffset']}
    ${'L-BTC/BTC'} | ${10_000}        | ${60}
    ${'L-BTC/BTC'} | ${50_000}        | ${64}
    ${'L-BTC/BTC'} | ${1_000_000}     | ${144}
    ${'not/found'} | ${0}             | ${RoutingOffsets['maxOffset']}
    ${'not/found'} | ${200_000}       | ${RoutingOffsets['maxOffset']}
    ${'not/found'} | ${123_123_123}   | ${RoutingOffsets['maxOffset']}
  `(
    'should calculate routing offset for $pair $amount',
    ({ pair, amount, expected }) => {
      expect(offs['calculateOffset'](pair, amount)).toEqual(expected);
    },
  );

  test.each`
    lightningCurrency | destination           | expected
    ${'BTC'}          | ${'node 1'}           | ${150}
    ${'BTC'}          | ${'node 2'}           | ${120}
    ${'notFound'}     | ${'node 1'}           | ${undefined}
    ${'BTC'}          | ${'not an exception'} | ${undefined}
  `(
    'should get routing offset exception for $lightningCurrency $destination',
    ({ lightningCurrency, destination, expected }) => {
      expect(
        offs['getOffsetException'](lightningCurrency, destination),
      ).toEqual(expected);
    },
  );

  test.each`
    pair         | amount    | lightningCurrency | destination                                | expected
    ${'BTC/BTC'} | ${50_000} | ${'BTC'}          | ${['node 1']}                              | ${150}
    ${'BTC/BTC'} | ${50_000} | ${'BTC'}          | ${['some other node', 'node 1']}           | ${150}
    ${'BTC/BTC'} | ${50_000} | ${'BTC'}          | ${['some other node', 'node 2']}           | ${120}
    ${'BTC/BTC'} | ${50_000} | ${'BTC'}          | ${['some other node', 'node 2', 'node 1']} | ${150}
    ${'BTC/BTC'} | ${50_000} | ${'BTC'}          | ${['not found']}                           | ${60}
  `(
    'should take offset exception over calculation',
    ({ pair, amount, lightningCurrency, destination, expected }) => {
      expect(
        offs.getOffset(pair, amount, lightningCurrency, destination),
      ).toEqual(expected);
    },
  );
});
