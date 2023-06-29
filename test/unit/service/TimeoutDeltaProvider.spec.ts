import { parse } from '@iarna/toml';
import { existsSync, readFileSync, unlinkSync } from 'fs';
import Logger from '../../../lib/Logger';
import Errors from '../../../lib/service/Errors';
import { ConfigType } from '../../../lib/Config';
import { OrderSide } from '../../../lib/consts/Enums';
import { PairConfig } from '../../../lib/consts/Types';
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

  const deltaProvider = new TimeoutDeltaProvider(Logger.disabledLogger, {
    configpath,
    pairs: [
      {
        base: 'LTC',
        quote: 'BTC',
      },
    ],
  } as ConfigType);

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

  test('should get timeout deltas', () => {
    const pairId = 'LTC/BTC';

    expect(deltaProvider.getTimeout(pairId, OrderSide.BUY, true)).toEqual(8);
    expect(deltaProvider.getTimeout(pairId, OrderSide.BUY, false)).toEqual(2);

    expect(deltaProvider.getTimeout(pairId, OrderSide.SELL, true)).toEqual(2);
    expect(deltaProvider.getTimeout(pairId, OrderSide.SELL, false)).toEqual(8);

    // Should throw if pair cannot be found
    const notFound = 'notFound';

    expect(() =>
      deltaProvider.getTimeout(notFound, OrderSide.SELL, true),
    ).toThrow(Errors.PAIR_NOT_FOUND(notFound).message);
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

  test.each`
    desc                                     | chain      | lightning | deltas         | timeout | invoice
    ${'routing hints'}                       | ${'BTC'}   | ${'BTC'}  | ${'BTC/BTC'}   | ${240}  | ${'lnbc100u1pjfmfrcpp533fk6s5pjp55cv2zms6x4z0kkwyyrt2252pgxdxpklk6tnlw99yqdqqxqyjw5q9q7sqqqqqqqqqqqqqqqqqqqqqqqqq9qsqsp5cdt869pnacqmw60ugma0sdgtsrh3g66mhheh3pwvjxrpn4l364fsrzjqwryaup9lh50kkranzgcdnn2fgvx390wgj5jd07rwr3vxeje0glcllcyzdrt8pcdlgqqqqlgqqqqqeqqjqpnppy43z486f0d5u856svstzwax80a8x53xa8lksrr40fprd8fckkewhkke59q4cex9udhp9u9dgsy8j60g7kytfm9aj904phm8mdsgp3329uv'}
    ${'minFinalCltvExpiry'}                  | ${'BTC'}   | ${'BTC'}  | ${'BTC/BTC'}   | ${153}  | ${'lnbc4651250n1pjfmvphpp58xdd4f4kycjhvr2cq3g8jljz6phfrehqhm9jxk7gyc84m4sfyjlsdql2djkuepqw3hjqsj5gvsxzerywfjhxuccqzynxqrrsssp55wjzuzjkcqaam5e94wcjzva6hgx69xu30exqxeqwccuzk4um46ys9qyyssq3fwqktxlgn6vunvcgnrqcg04e8yes8fk5658nnnml5zmwajr9p9y8jc60dhmhw269k9wfjdjflkhwe9edygg2ae2u0hz2tynwh4c9lgp7qq23f'}
    ${'block time conversion routing hints'} | ${'L-BTC'} | ${'BTC'}  | ${'L-BTC/BTC'} | ${2400} | ${'lnbc100u1pjfmfrcpp533fk6s5pjp55cv2zms6x4z0kkwyyrt2252pgxdxpklk6tnlw99yqdqqxqyjw5q9q7sqqqqqqqqqqqqqqqqqqqqqqqqq9qsqsp5cdt869pnacqmw60ugma0sdgtsrh3g66mhheh3pwvjxrpn4l364fsrzjqwryaup9lh50kkranzgcdnn2fgvx390wgj5jd07rwr3vxeje0glcllcyzdrt8pcdlgqqqqlgqqqqqeqqjqpnppy43z486f0d5u856svstzwax80a8x53xa8lksrr40fprd8fckkewhkke59q4cex9udhp9u9dgsy8j60g7kytfm9aj904phm8mdsgp3329uv'}
    ${'block time conversion'}               | ${'L-BTC'} | ${'BTC'}  | ${'L-BTC/BTC'} | ${1530} | ${'lnbc4651250n1pjfmvphpp58xdd4f4kycjhvr2cq3g8jljz6phfrehqhm9jxk7gyc84m4sfyjlsdql2djkuepqw3hjqsj5gvsxzerywfjhxuccqzynxqrrsssp55wjzuzjkcqaam5e94wcjzva6hgx69xu30exqxeqwccuzk4um46ys9qyyssq3fwqktxlgn6vunvcgnrqcg04e8yes8fk5658nnnml5zmwajr9p9y8jc60dhmhw269k9wfjdjflkhwe9edygg2ae2u0hz2tynwh4c9lgp7qq23f'}
  `(
    'should get timeout for invoice with routing hints for case "$desc"',
    ({ chain, lightning, deltas, timeout, invoice }) => {
      expect(
        deltaProvider['getTimeoutInvoice'](
          chain,
          lightning,
          deltaProvider['timeoutDeltas'].get(deltas)!.base,
          invoice,
        ),
      ).toEqual(timeout);
    },
  );
});
