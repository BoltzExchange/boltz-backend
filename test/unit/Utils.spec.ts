import { Transaction } from 'bitcoinjs-lib';
import { OutputType, Scripts } from 'boltz-core';
import os from 'os';
import * as utils from '../../lib/Utils';
import {
  TAPROOT_NOT_SUPPORTED,
  bigIntMax,
  generateSwapId,
  getPubkeyHashFunction,
  getScriptHashFunction,
  mapToObject,
  objectMap,
  splitChannelPoint,
  stringify,
} from '../../lib/Utils';
import commitHash from '../../lib/Version';
import { OrderSide, SwapType, SwapVersion } from '../../lib/consts/Enums';
import Errors from '../../lib/service/Errors';
import packageJson from '../../package.json';
import { constructTransaction, randomRange } from '../Utils';

describe('Utils', () => {
  let pairId: string;

  const pair = {
    base: 'BTC',
    quote: 'LTC',
  };

  const sampleTransactions = [
    Transaction.fromHex(
      '01000000017fa897c3556271c34cb28c03c196c2d912093264c9d293cb4980a2635474467d010000000f5355540b6f93598893578893588851ffffffff01501e0000000000001976a914aa2482ce71d219018ef334f6cc551ee88abd920888ac00000000',
    ),
    Transaction.fromHex(
      '010000000001010dabcc426e9f5f57c1000e1560d06ebd21f510c74fe2d0c30fe8eefcabaf31f50200000000fdffffff02a086010000000000160014897ab9fb4e4bf920af9047b5a1896b4689a65bff0e52090000000000160014b3330dbbb43be7a4e2df367f58cf76c74f68141602483045022100ef83bcabb40debd4e13c0eda6b918b940b404344f41253a42c51fc76319ca64502205a1ad86d0bb92f25de75a6b37edf7118863ba9b7c438473ecde07765dedbb9ed012103df1535396d6f4c68458ef3ae86a32e5484e89d7bfc94cabd6c0c09ceaab0b2ab00000000',
    ),
  ];

  test.each`
    version                | expectedLength
    ${SwapVersion.Legacy}  | ${6}
    ${SwapVersion.Taproot} | ${12}
  `(
    'should generate swap id for version $version',
    ({ version, expectedLength }) => {
      expect(generateSwapId(version)).toHaveLength(expectedLength);
    },
  );

  describe('stringify', () => {
    test('should stringify objects', () => {
      expect(stringify({ test: 'data' })).toMatchSnapshot();
    });

    test('should stringify bigint', () => {
      expect(stringify({ big: 1n })).toMatchSnapshot();
    });
  });

  test('should split derivation path', () => {
    const master = 'm';
    const sub = [0, 2, 543];
    const derivationPath = `${master}/${sub[0]}/${sub[1]}/${sub[2]}`;

    const result = utils.splitDerivationPath(derivationPath);

    expect(result.master).toEqual(master);
    expect(result.sub.length).toEqual(sub.length);

    sub.forEach((value, index) => {
      expect(result.sub[index]).toEqual(value);
    });
  });

  test('should concat error code', () => {
    const prefix = 0;
    const code = 1;

    expect(utils.concatErrorCode(prefix, code)).toEqual(`${prefix}.${code}`);
  });

  test('should capitalize first letter', () => {
    const input = 'test123';
    const result = input.charAt(0).toUpperCase() + input.slice(1);

    expect(utils.capitalizeFirstLetter(input)).toEqual(result);
  });

  test('should resolve home', () => {
    const input = '~.boltz';

    if (os.platform() !== 'win32') {
      expect(utils.resolveHome(input).charAt(0)).toEqual('/');
    } else {
      expect(utils.resolveHome(input)).toEqual(input);
    }
  });

  test('should get a hex encoded Buffers and strings', () => {
    const string = 'test';

    expect(utils.getHexBuffer(string)).toEqual(Buffer.from(string, 'hex'));
    expect(utils.getHexString(Buffer.from(string))).toEqual(
      Buffer.from(string).toString('hex'),
    );
  });

  test('should check whether it is an object', () => {
    expect(utils.isObject({})).toBeTruthy();
    expect(utils.isObject([])).toBeFalsy();
    expect(utils.isObject(undefined)).toBeFalsy();
  });

  test('should split host and port', () => {
    const host = 'localhost';
    const port = '9000';

    const input = `${host}:${port}`;

    expect(utils.splitListen(input)).toEqual({ host, port });
  });

  test('should detect whether a transaction signals RBF', () => {
    const inputHash =
      '9788d1d096dfb41c429a5e76bf2c6e6eb6e3b9aa57feecae3b33c57b4f6fea62';

    expect(
      utils.transactionSignalsRbfExplicitly(
        constructTransaction(true, inputHash),
      ),
    ).toBeTruthy();
    expect(
      utils.transactionSignalsRbfExplicitly(
        constructTransaction(false, inputHash),
      ),
    ).toBeFalsy();

    expect(
      utils.transactionSignalsRbfExplicitly(
        Transaction.fromHex(sampleTransactions[0].toHex()),
      ),
    ).toBeFalsy();
    expect(
      utils.transactionSignalsRbfExplicitly(
        Transaction.fromHex(sampleTransactions[1].toHex()),
      ),
    ).toBeTruthy();
  });

  test('should generate ids', () => {
    expect(utils.generateId().length).toEqual(6);

    const random = randomRange(10);
    expect(utils.generateId(random).length).toEqual(random);
  });

  test('should get pair ids', () => {
    pairId = utils.getPairId(pair);
    expect(pairId).toEqual('BTC/LTC');
  });

  test('should split pair ids', () => {
    const split = utils.splitPairId(pairId);
    expect(pair.base === split.base && pair.quote === split.quote).toBeTruthy();
  });

  test('should concat error codes', () => {
    const prefix = 0;
    const code = 1;

    expect(utils.concatErrorCode(prefix, code)).toEqual(`${prefix}.${code}`);
  });

  test('should check types of variables', () => {
    expect(utils.isObject([])).toBeFalsy();
    expect(utils.isObject({})).toBeTruthy();
  });

  test('should convert minutes into milliseconds', () => {
    const random = randomRange(10);
    const milliseconds = random * 60 * 1000;

    expect(utils.minutesToMilliseconds(random)).toEqual(milliseconds);
  });

  test('should get rate', () => {
    const rate = 2;
    const reverseRate = 1 / rate;

    expect(utils.getRate(rate, OrderSide.BUY, true)).toEqual(reverseRate);
    expect(utils.getRate(rate, OrderSide.SELL, true)).toEqual(rate);

    expect(utils.getRate(rate, OrderSide.BUY, false)).toEqual(rate);
    expect(utils.getRate(rate, OrderSide.SELL, false)).toEqual(reverseRate);
  });

  test('should the chain currency', () => {
    const { base, quote } = pair;

    expect(utils.getChainCurrency(base, quote, OrderSide.BUY, true)).toEqual(
      base,
    );
    expect(utils.getChainCurrency(base, quote, OrderSide.SELL, true)).toEqual(
      quote,
    );

    expect(utils.getChainCurrency(base, quote, OrderSide.BUY, false)).toEqual(
      quote,
    );
    expect(utils.getChainCurrency(base, quote, OrderSide.SELL, false)).toEqual(
      base,
    );
  });

  test('should the lightning currency', () => {
    const { base, quote } = pair;

    expect(
      utils.getLightningCurrency(base, quote, OrderSide.BUY, true),
    ).toEqual(quote);
    expect(
      utils.getLightningCurrency(base, quote, OrderSide.SELL, true),
    ).toEqual(base);

    expect(
      utils.getLightningCurrency(base, quote, OrderSide.BUY, false),
    ).toEqual(base);
    expect(
      utils.getLightningCurrency(base, quote, OrderSide.SELL, false),
    ).toEqual(quote);
  });

  test('should get output type', () => {
    expect(utils.getOutputType(0)).toEqual(OutputType.Bech32);
    expect(utils.getOutputType(1)).toEqual(OutputType.Compatibility);
    expect(utils.getOutputType(2)).toEqual(OutputType.Legacy);

    expect(utils.getOutputType()).toEqual(OutputType.Legacy);

    expect(() => utils.getOutputType(123)).toThrow(
      new Error('type does not exist'),
    );
  });

  test('should get memo for swaps', () => {
    expect(utils.getSwapMemo('LTC', SwapType.Submarine)).toBe(
      'Send to LTC lightning',
    );
    expect(utils.getSwapMemo('BTC', SwapType.ReverseSubmarine)).toBe(
      'Send to BTC address',
    );
    expect(utils.getSwapMemo('BTC', SwapType.Chain)).toBe(
      'Send to BTC address',
    );
  });

  test('should get memo for miner fee invoices', () => {
    expect(utils.getPrepayMinerFeeInvoiceMemo('BTC')).toBe(
      'Miner fee for sending to BTC address',
    );
  });

  test('should get sending and receiving currency', () => {
    const baseCurrency = 'LTC';
    const quoteCurrency = 'BTC';

    expect(
      utils.getSendingReceivingCurrency(
        baseCurrency,
        quoteCurrency,
        OrderSide.BUY,
      ),
    ).toEqual({
      sending: baseCurrency,
      receiving: quoteCurrency,
    });
    expect(
      utils.getSendingChain(baseCurrency, quoteCurrency, OrderSide.BUY),
    ).toEqual(baseCurrency);
    expect(
      utils.getReceivingChain(baseCurrency, quoteCurrency, OrderSide.BUY),
    ).toEqual(quoteCurrency);

    expect(
      utils.getSendingReceivingCurrency(
        baseCurrency,
        quoteCurrency,
        OrderSide.SELL,
      ),
    ).toEqual({
      sending: quoteCurrency,
      receiving: baseCurrency,
    });
    expect(
      utils.getSendingChain(baseCurrency, quoteCurrency, OrderSide.SELL),
    ).toEqual(quoteCurrency);
    expect(
      utils.getReceivingChain(baseCurrency, quoteCurrency, OrderSide.SELL),
    ).toEqual(baseCurrency);
  });

  test.each`
    error                                                   | expected
    ${'error string'}                                       | ${'error string'}
    ${{ test: 'data' }}                                     | ${JSON.stringify({ test: 'data' })}
    ${{ message: 'error data' }}                            | ${'error data'}
    ${{ details: 'details data', message: 'message data' }} | ${'details data'}
    ${4}                                                    | ${'4'}
  `('should format errors', ({ error, expected }) => {
    expect(utils.formatError(error)).toEqual(expected);
  });

  test('should get version', () => {
    expect(utils.getVersion()).toEqual(`${packageJson.version}${commitHash}`);
  });

  test('should get UNIX time', () => {
    expect(utils.getUnixTime()).toEqual(
      Math.round(new Date().getTime() / 1000),
    );
  });

  test('should hash strings', () => {
    expect(utils.hashString('foo')).toEqual(
      '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
    );
    expect(utils.hashString('bar')).toEqual(
      'fcde2b2edba56bf408601fb721fe9b5c338d10ee429ea04fae5511b68fbf8fb9',
    );
  });

  test('should split channel points', () => {
    expect(
      splitChannelPoint(
        '059a4a673f9984e236037b04317f7d042378227bfdd82e12dd55b0bf67a6773e:1',
      ),
    ).toEqual({
      vout: 1,
      id: '059a4a673f9984e236037b04317f7d042378227bfdd82e12dd55b0bf67a6773e',
    });
  });

  test.each`
    outputType                  | expectedFunc
    ${OutputType.Legacy}        | ${Scripts.p2pkhOutput}
    ${OutputType.Compatibility} | ${Scripts.p2shP2wpkhOutput}
    ${OutputType.Bech32}        | ${Scripts.p2wpkhOutput}
  `(
    'should get public key hash function for type $outputType',
    ({ outputType, expectedFunc }) => {
      expect(getPubkeyHashFunction(outputType)).toEqual(expectedFunc);
    },
  );

  test('should throw when getting public key hash function for Taproot', () => {
    expect(() => getPubkeyHashFunction(OutputType.Taproot)).toThrow(
      TAPROOT_NOT_SUPPORTED,
    );
  });

  test.each`
    outputType                  | expectedFunc
    ${OutputType.Legacy}        | ${Scripts.p2shOutput}
    ${OutputType.Compatibility} | ${Scripts.p2shP2wshOutput}
    ${OutputType.Bech32}        | ${Scripts.p2wshOutput}
  `(
    'should get script hash function for type $outputType',
    ({ outputType, expectedFunc }) => {
      expect(getScriptHashFunction(outputType)).toEqual(expectedFunc);
    },
  );

  test('should throw when getting script hash function for Taproot', () => {
    expect(() => getScriptHashFunction(OutputType.Taproot)).toThrow(
      TAPROOT_NOT_SUPPORTED,
    );
  });

  test('should convert nested maps to objects', () => {
    const map = new Map<string, number | Map<string, number>>([
      ['a', new Map<string, number>([['aa', 2]])],
      ['b', new Map<string, number>()],
      ['c', 21],
    ]);

    expect(mapToObject(map)).toEqual({
      a: {
        aa: 2,
      },
      b: {},
      c: 21,
    });
  });

  test('mapToObjectInternal should throw when recursion level is too deep', () => {
    const a = new Map();
    const b = new Map();
    a.set('b', b);
    b.set('a', a);

    expect(() => mapToObject(a)).toThrow('nested map recursion level too deep');
  });

  test('should check EVM address', () => {
    expect(
      utils.checkEvmAddress('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'),
    ).toEqual('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
  });

  test('should throw when checking invalid EVM addresses', () => {
    expect(() => utils.checkEvmAddress('')).toThrow(
      Errors.INVALID_ETHEREUM_ADDRESS().message,
    );
  });

  test('should map objects', () => {
    const data = { test: 2, data: 3 };
    expect(objectMap(data, (key, value) => [key, value * 2])).toEqual({
      test: 4,
      data: 6,
    });
  });

  test.each`
    data                              | size  | chunks
    ${[0, 1]}                         | ${1}  | ${[[0, 1]]}
    ${[0, 1]}                         | ${2}  | ${[[0], [1]]}
    ${[0, 1]}                         | ${3}  | ${[[0], [1]]}
    ${[0, 1]}                         | ${15} | ${[[0], [1]]}
    ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]} | ${2}  | ${[[0, 2, 4, 6, 8], [1, 3, 5, 7, 9]]}
    ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]} | ${3}  | ${[[0, 3, 6, 9], [1, 4, 7], [2, 5, 8]]}
  `('should chunk arrays', ({ data, size, chunks }) => {
    const res = utils.chunkArray(data, size);
    expect(res.length).toEqual(chunks.length);
    expect(res).toEqual(chunks);
  });

  test.each`
    data            | count | chunks
    ${[0, 1]}       | ${1}  | ${[[0], [1]]}
    ${[0, 1, 2, 3]} | ${1}  | ${[[0], [1], [2], [3]]}
    ${[0, 1, 2, 3]} | ${2}  | ${[[0, 1], [2, 3]]}
    ${[0, 1, 2, 3]} | ${3}  | ${[[0, 1, 2], [3]]}
    ${[0, 1, 2, 3]} | ${4}  | ${[[0, 1, 2, 3]]}
    ${[0, 1, 2, 3]} | ${5}  | ${[[0, 1, 2, 3]]}
    ${[0, 1, 2, 3]} | ${21} | ${[[0, 1, 2, 3]]}
  `('should chunk array into pieces', ({ data, count, chunks }) => {
    expect(utils.arrayToChunks(data, count)).toEqual(chunks);
  });

  test.each`
    a       | b      | expected
    ${0n}   | ${1n}  | ${1n}
    ${0n}   | ${-1n} | ${0n}
    ${123n} | ${-1n} | ${123n}
  `('should get maximal bigint', ({ a, b, expected }) => {
    expect(bigIntMax(a, b)).toEqual(expected);
  });

  test.each`
    value         | decimals | expected
    ${1.23456789} | ${2}     | ${1.23}
    ${1.23456789} | ${4}     | ${1.2346}
    ${0.35001}    | ${4}     | ${0.35}
    ${0.3500999}  | ${4}     | ${0.3501}
  `('should round to decimals', ({ value, decimals, expected }) => {
    expect(utils.roundToDecimals(value, decimals)).toEqual(expected);
  });
});
