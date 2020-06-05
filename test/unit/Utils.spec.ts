// tslint:disable: max-line-length

import os from 'os';
import { OutputType } from 'boltz-core';
import { Transaction } from 'bitcoinjs-lib';
import * as utils from '../../lib/Utils';
import commitHash from '../../lib/Version';
import { OrderSide } from '../../lib/consts/Enums';
import { constructTransaction, randomRange } from '../Utils';

const packageJson = require('../../package.json');

describe('Utils', () => {
  let pairId: string;

  const pair = {
    base: 'BTC',
    quote: 'LTC',
  };

  const sampleTransactions = [
    Transaction.fromHex('01000000017fa897c3556271c34cb28c03c196c2d912093264c9d293cb4980a2635474467d010000000f5355540b6f93598893578893588851ffffffff01501e0000000000001976a914aa2482ce71d219018ef334f6cc551ee88abd920888ac00000000'),
    Transaction.fromHex('010000000001010dabcc426e9f5f57c1000e1560d06ebd21f510c74fe2d0c30fe8eefcabaf31f50200000000fdffffff02a086010000000000160014897ab9fb4e4bf920af9047b5a1896b4689a65bff0e52090000000000160014b3330dbbb43be7a4e2df367f58cf76c74f68141602483045022100ef83bcabb40debd4e13c0eda6b918b940b404344f41253a42c51fc76319ca64502205a1ad86d0bb92f25de75a6b37edf7118863ba9b7c438473ecde07765dedbb9ed012103df1535396d6f4c68458ef3ae86a32e5484e89d7bfc94cabd6c0c09ceaab0b2ab00000000'),
  ];

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

  test('should capitalize the first letter', () => {
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
    expect(utils.getHexString(Buffer.from(string))).toEqual(Buffer.from(string).toString('hex'));
  });

  test('should check whether it is an object', () => {
    expect(utils.isObject({})).toBeTruthy;
    expect(utils.isObject([])).toBeFalsy;
  });

  test('should split host and port', () => {
    const host = 'localhost';
    const port = '9000';

    const input = `${host}:${port}`;

    expect(utils.splitListen(input)).toEqual({ host, port });
  });

  test('should detect whether a transaction signals RBF', () => {
    const inputHash = '9788d1d096dfb41c429a5e76bf2c6e6eb6e3b9aa57feecae3b33c57b4f6fea62';

    expect(utils.transactionSignalsRbfExplicitly(constructTransaction(true, inputHash))).toBeTruthy();
    expect(utils.transactionSignalsRbfExplicitly(constructTransaction(false, inputHash))).toBeFalsy();

    expect(utils.transactionSignalsRbfExplicitly(Transaction.fromHex(sampleTransactions[0].toHex()))).toBeFalsy();
    expect(utils.transactionSignalsRbfExplicitly(Transaction.fromHex(sampleTransactions[1].toHex()))).toBeTruthy();
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

  test('should capitalize the first letter', () => {
    const input = 'boltz';
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

  test('should convert minutes into milliseconds', () => {
    const random = randomRange(10);
    const milliseconds = random * 60 * 1000;

    expect(utils.minutesToMilliseconds(random)).toEqual(milliseconds);
  });

  test('should decode invoices', () => {
    // Sanity checks
    let decoded = utils.decodeInvoice('lnbcrt100u1pwddnw3pp5rykwp0q399hrcluxnyhv7kfpmk4uttpu00wx9098cesacr9yzk8sdqqcqzpgn9g5vjr0qcudrgu66phz5tx0j0fnxe0gzyl5u6yat9y3xskrqyhherceutcuh9m6h89anphe5un3qac8f2r9j5hykn3uh6z0zkp9racp5lecss');

    expect(decoded.satoshis).toEqual(10000);
    expect(decoded.routingInfo).toEqual(undefined);
    expect(decoded.paymentHash).toEqual('192ce0bc11296e3c7f86992ecf5921ddabc5ac3c7bdc62bca7c661dc0ca4158f');

    decoded = utils.decodeInvoice('lnbcrt987650n1pwddnskpp5d4tw4gpjgqdqlgkq5yc309r2kguure53cff8a0kjta5hurltc4yqdqqcqzpgzeu404h9udp5ay39kdvau7m5kdkvycajfhx46slgkfgyhpngnztptulxpx8s7qncp45v5nxjulje5268cu22gxysg9hm3ul8ktrw5zgqcg98hg');

    expect(decoded.satoshis).toEqual(98765);
    expect(decoded.routingInfo).toEqual(undefined);
    expect(decoded.paymentHash).toEqual('6d56eaa032401a0fa2c0a13117946ab239c1e691c2527ebed25f697e0febc548');

    // Invoices with zero amount
    decoded = utils.decodeInvoice('lntb1p0p7f6lpp58zpsxk88e8uz2lndqrf9radths484jqlhmas92kt7md2cqszpn6qdqqcqzpgrzjqtejjv7p39kcv5gezydzgse8ea3kcw8zqe36afy64zem09us5hjgcxgphsqqqzsqqyqqqqlgqqqqqqgq9q4wqv5a4uwhhvfh93k2ue75lrre50tk99pk689qgf6ul5my5vr749689wcunnv7zjcuk7jlpwz44fv87ra2snsjzw34pnfs5d477u82cpm6cym6');

    expect(decoded.satoshis).toEqual(0);

    // Routing info
    decoded = utils.decodeInvoice('lnbc1p023g0zpp5rrr09tcxfymsyxgywe0vpeqzt8ppc7dzlme9e0wa3qqch0fpt8tsdqqxqrrss9qy9qsqsp56xpafe94rfkt5qtc00lua7pwem9znvvq4en9sr2t24kmdq4ll2mqrzjqt3xwz3vyes6nm4p8d70mnwh74f0tydeaesw2eut02l80dle29hevz905gqqjdsqqqqqqqlgqqqqqeqqjqrzjqfsktpgyjffp7jkg40vmmqygzg6yd5fx7eyv5d0xp7ypwlwpf88tyzx0ccqq8msqqqqqqqlgqqqqqeqqjqtk44jdc0f78c6cg8jd02889jud0phxea7nxtj7sue7ft44daf9nye99ekujxxgkgw82t0kxfwetxp9vs5rt54lkfd35vjle0sexhv2qqpv7aq4');

    expect(decoded.routingInfo).toEqual([{
      fee_base_msat: 1000,
      cltv_expiry_delta: 144,
      fee_proportional_millionths: 100,
      short_channel_id: '08cfc60003ee0000',
      pubkey: '026165850492521f4ac8abd9bd8088123446d126f648ca35e60f88177dc149ceb2',
    }]);
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

    expect(utils.getChainCurrency(base, quote, OrderSide.BUY, true)).toEqual(base);
    expect(utils.getChainCurrency(base, quote, OrderSide.SELL, true)).toEqual(quote);

    expect(utils.getChainCurrency(base, quote, OrderSide.BUY, false)).toEqual(quote);
    expect(utils.getChainCurrency(base, quote, OrderSide.SELL, false)).toEqual(base);
  });

  test('should the lightning currency', () => {
    const { base, quote } = pair;

    expect(utils.getLightningCurrency(base, quote, OrderSide.BUY, true)).toEqual(quote);
    expect(utils.getLightningCurrency(base, quote, OrderSide.SELL, true)).toEqual(base);

    expect(utils.getLightningCurrency(base, quote, OrderSide.BUY, false)).toEqual(base);
    expect(utils.getLightningCurrency(base, quote, OrderSide.SELL, false)).toEqual(quote);
  });

  test('should get output type', () => {
    expect(utils.getOutputType(0)).toEqual(OutputType.Bech32);
    expect(utils.getOutputType(1)).toEqual(OutputType.Compatibility);
    expect(utils.getOutputType(2)).toEqual(OutputType.Legacy);

    expect(utils.getOutputType()).toEqual(OutputType.Legacy);

    expect(() => utils.getOutputType(123)).toThrow(new Error('type does not exist'));
  });

  test('should get memo for swaps', () => {
    expect(utils.getSwapMemo('LTC', false)).toBe('Send to LTC lightning');
    expect(utils.getSwapMemo('BTC', true)).toBe('Send to BTC address');
  });

  test('should get memo for miner fee invoices', () => {
    expect(utils.getPrepayMinerFeeInvoiceMemo('BTC')).toBe('Miner fee for Reverse Swap to BTC address');
  });

  test('should get sending and receiving currency', () => {
    const baseCurrency = 'LTC';
    const quoteCurrency = 'BTC';

    expect(utils.getSendingReceivingCurrency(baseCurrency, quoteCurrency, OrderSide.BUY)).toEqual({
      sending: baseCurrency,
      receiving: quoteCurrency,
    });

    expect(utils.getSendingReceivingCurrency(baseCurrency, quoteCurrency, OrderSide.SELL)).toEqual({
      sending: quoteCurrency,
      receiving: baseCurrency,
    });
  });

  test('should format errors', () => {
    const test = 'error';
    const object = { test };
    const objectMessage = { message: test };

    expect(utils.formatError(test)).toEqual(test);
    expect(utils.formatError(object)).toEqual(JSON.stringify(object));
    expect(utils.formatError(objectMessage)).toEqual(test);
  });

  test('should get version', () => {
    expect(utils.getVersion()).toEqual(`${packageJson.version}${commitHash}`);
  });

  test('should get UNIX time', () => {
    expect(utils.getUnixTime()).toEqual(Math.round(new Date().getTime() / 1000));
  });
});
