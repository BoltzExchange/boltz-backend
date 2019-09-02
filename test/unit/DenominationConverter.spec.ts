import { randomRange } from '../Utils';
import { coinsToSatoshis, satoshisToCoins } from '../../lib/DenominationConverter';

describe('DenomationConverter', () => {
  test('should convert satoshis to whole coins', () => {
    const randomSat = randomRange(7000);
    const coins = Number((randomSat / 100000000).toFixed(8));

    expect(satoshisToCoins(randomSat)).toEqual(coins);
    expect(satoshisToCoins(1000)).toEqual(0.00001);
  });

  test('should convert whole coins to satoshis', () => {
    const randomCoins = randomRange(1000);
    const sats = Number((randomCoins * 100000000).toFixed(8));

    expect(coinsToSatoshis(randomCoins)).toEqual(sats);
    expect(coinsToSatoshis(100)).toEqual(10000000000);
  });
});
