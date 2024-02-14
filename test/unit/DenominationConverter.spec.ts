import {
  coinsToSatoshis,
  satoshisToCoins,
  satoshisToPaddedCoins,
  satoshisToSatcomma,
} from '../../lib/DenominationConverter';
import { randomRange } from '../Utils';

describe('DenominationConverter', () => {
  test('should convert satoshis to whole coins', () => {
    const randomSat = randomRange(7000);
    const coins = Number((randomSat / 100000000).toFixed(8));

    expect(satoshisToCoins(randomSat)).toEqual(coins);
    expect(satoshisToCoins(1000)).toEqual(0.00001);
  });

  test.each`
    sats              | expected
    ${100_000_000}    | ${'1.00000000'}
    ${103_050_087}    | ${'1.03050087'}
    ${0}              | ${'0.00000000'}
    ${1}              | ${'0.00000001'}
    ${1_000}          | ${'0.00001000'}
    ${10_000}         | ${'0.00010000'}
    ${34_578_934_789} | ${'345.78934789'}
    ${2_868_926}      | ${'0.02868926'}
  `(
    'should convert $sats satoshis to whole padded coins',
    ({ sats, expected }) => {
      expect(satoshisToPaddedCoins(sats)).toEqual(expected);
    },
  );

  test('should convert whole coins to satoshis', () => {
    const randomCoins = randomRange(1000);
    const sats = Number((randomCoins * 100000000).toFixed(8));

    expect(coinsToSatoshis(randomCoins)).toEqual(sats);
    expect(coinsToSatoshis(100)).toEqual(10000000000);
  });

  test.each`
    sats              | expected
    ${100_000_000}    | ${'1.00,000,000'}
    ${103_050_087}    | ${'1.03,050,087'}
    ${0}              | ${'0.00,000,000'}
    ${1}              | ${'0.00,000,001'}
    ${1_000}          | ${'0.00,001,000'}
    ${10_000}         | ${'0.00,010,000'}
    ${34_578_934_789} | ${'345.78,934,789'}
    ${2_868_926}      | ${'0.02,868,926'}
  `('should convert $sats satoshis to satcomma', ({ sats, expected }) => {
    expect(satoshisToSatcomma(sats)).toEqual(expected);
  });
});
