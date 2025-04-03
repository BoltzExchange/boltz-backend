import Logger from '../../../../lib/Logger';
import { createApiCredential } from '../../../../lib/Utils';
import { OrderSide, SwapType } from '../../../../lib/consts/Enums';
import Database from '../../../../lib/db/Database';
import type { ReferralType } from '../../../../lib/db/repositories/ReferralRepository';
import ReferralRepository from '../../../../lib/db/repositories/ReferralRepository';

describe('Referral', () => {
  const db = new Database(Logger.disabledLogger, Database.memoryDatabase);

  const referralValues: ReferralType = {
    id: 'test',
    apiKey: createApiCredential(),
    apiSecret: createApiCredential(),
    feeShare: 0,
    config: {
      maxRoutingFee: 0.001,
      premiums: {
        [SwapType.Submarine]: -15,
        [SwapType.ReverseSubmarine]: 21,
        [SwapType.Chain]: { [OrderSide.BUY]: -15, [OrderSide.SELL]: -10 },
      },
      limits: {
        [SwapType.ReverseSubmarine]: {
          minimal: 101_00,
          maximal: 512_321,
        },
      },
      pairs: {
        'RBTC/BTC': {
          maxRoutingFee: 0.0025,
          premiums: {
            [SwapType.Chain]: { [OrderSide.BUY]: -25, [OrderSide.SELL]: -20 },
          },
          limits: {
            [SwapType.Submarine]: {
              minimal: 1,
            },
          },
        },
      },
    },
  };

  beforeAll(async () => {
    await db.init();

    await ReferralRepository.addReferral(referralValues);
  });

  afterAll(async () => {
    await db.close();
  });

  test.each`
    pair           | expected
    ${'BTC/BTC'}   | ${referralValues.config!.maxRoutingFee}
    ${'L-BTC/BTC'} | ${referralValues.config!.maxRoutingFee}
    ${'RBTC/BTC'}  | ${referralValues.config!.pairs!['RBTC/BTC']!.maxRoutingFee}
  `('should get maxRoutingFee for pair $pair', async ({ pair, expected }) => {
    const ref = await ReferralRepository.getReferralById(referralValues.id);

    expect(ref).not.toBeNull();
    expect(ref!.maxRoutingFeeRatio(pair)).toEqual(expected);
  });

  test.each`
    pairs                      | expected
    ${['BTC/BTC']}             | ${referralValues.config!.maxRoutingFee}
    ${['L-BTC/BTC']}           | ${referralValues.config!.maxRoutingFee}
    ${['RBTC/BTC']}            | ${referralValues.config!.pairs!['RBTC/BTC']!.maxRoutingFee}
    ${['BTC/BTC', 'RBTC/BTC']} | ${referralValues.config!.pairs!['RBTC/BTC']!.maxRoutingFee}
  `(
    'should get maxRoutingFeeRatioForPairs for pairs $pairs',
    async ({ pairs, expected }) => {
      const ref = await ReferralRepository.getReferralById(referralValues.id);

      expect(ref).not.toBeNull();
      expect(ref!.maxRoutingFeeRatioForPairs(pairs)).toEqual(expected);
    },
  );

  test.each`
    pair          | type                         | expected
    ${'BTC/BTC'}  | ${SwapType.ReverseSubmarine} | ${referralValues.config!.limits![SwapType.ReverseSubmarine]}
    ${'BTC/BTC'}  | ${SwapType.Submarine}        | ${undefined}
    ${'RBTC/BTC'} | ${SwapType.Submarine}        | ${referralValues.config!.pairs!['RBTC/BTC']!.limits![SwapType.Submarine]}
    ${'RBTC/BTC'} | ${SwapType.Chain}            | ${undefined}
  `(
    'should get limits for pair $pair and type $type',
    async ({ pair, type, expected }) => {
      const ref = await ReferralRepository.getReferralById(referralValues.id);

      expect(ref).not.toBeNull();
      expect(ref!.limits(pair, type)).toEqual(expected);
    },
  );

  test.each`
    pairs                      | type                  | expected
    ${['BTC/BTC']}             | ${SwapType.Submarine} | ${undefined}
    ${['BTC/BTC', 'RBTC/BTC']} | ${SwapType.Submarine} | ${referralValues.config!.pairs!['RBTC/BTC']!.limits![SwapType.Submarine]}
  `('should get limits for pairs', async ({ pairs, type, expected }) => {
    const ref = await ReferralRepository.getReferralById(referralValues.id);

    expect(ref).not.toBeNull();
    expect(ref!.limitsForPairs(pairs, type)).toEqual(expected);
  });

  test.each`
    pair          | type                         | orderSide         | expected
    ${'BTC/BTC'}  | ${SwapType.Submarine}        | ${undefined}      | ${referralValues.config!.premiums![SwapType.Submarine]}
    ${'BTC/BTC'}  | ${SwapType.ReverseSubmarine} | ${undefined}      | ${referralValues.config!.premiums![SwapType.ReverseSubmarine]}
    ${'BTC/BTC'}  | ${SwapType.Chain}            | ${OrderSide.BUY}  | ${referralValues.config!.premiums![SwapType.Chain]![OrderSide.BUY]}
    ${'BTC/BTC'}  | ${SwapType.Chain}            | ${OrderSide.SELL} | ${referralValues.config!.premiums![SwapType.Chain]![OrderSide.SELL]}
    ${'RBTC/BTC'} | ${SwapType.Chain}            | ${OrderSide.BUY}  | ${referralValues.config!.pairs!['RBTC/BTC']!.premiums![SwapType.Chain]![OrderSide.BUY]}
    ${'RBTC/BTC'} | ${SwapType.Chain}            | ${OrderSide.SELL} | ${referralValues.config!.pairs!['RBTC/BTC']!.premiums![SwapType.Chain]![OrderSide.SELL]}
  `(
    'should get premium for pair $pair and type $type',
    async ({ pair, type, orderSide, expected }) => {
      const ref = await ReferralRepository.getReferralById(referralValues.id);

      expect(ref).not.toBeNull();
      expect(ref!.premium(pair, type, orderSide)).toEqual(expected);
    },
  );

  test.each`
    pairs                      | type              | orderSide         | expected
    ${['BTC/BTC']}             | ${SwapType.Chain} | ${OrderSide.BUY}  | ${referralValues.config!.premiums![SwapType.Chain]![OrderSide.BUY]}
    ${['BTC/BTC']}             | ${SwapType.Chain} | ${OrderSide.SELL} | ${referralValues.config!.premiums![SwapType.Chain]![OrderSide.SELL]}
    ${['BTC/BTC', 'RBTC/BTC']} | ${SwapType.Chain} | ${OrderSide.BUY}  | ${referralValues.config!.pairs!['RBTC/BTC']!.premiums![SwapType.Chain]![OrderSide.BUY]}
    ${['BTC/BTC', 'RBTC/BTC']} | ${SwapType.Chain} | ${OrderSide.SELL} | ${referralValues.config!.pairs!['RBTC/BTC']!.premiums![SwapType.Chain]![OrderSide.SELL]}
  `(
    'should get premium for pairs',
    async ({ pairs, type, orderSide, expected }) => {
      const ref = await ReferralRepository.getReferralById(referralValues.id);

      expect(ref).not.toBeNull();
      expect(ref!.premiumForPairs(pairs, type, orderSide)).toEqual(expected);
    },
  );
});
