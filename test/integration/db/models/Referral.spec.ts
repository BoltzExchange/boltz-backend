import Logger from '../../../../lib/Logger';
import { createApiCredential } from '../../../../lib/Utils';
import { SwapType } from '../../../../lib/consts/Enums';
import Database from '../../../../lib/db/Database';
import ReferralRepository, {
  ReferralType,
} from '../../../../lib/db/repositories/ReferralRepository';

describe('Referral', () => {
  const db = new Database(Logger.disabledLogger, Database.memoryDatabase);

  const referralValues: ReferralType = {
    id: 'test',
    apiKey: createApiCredential(),
    apiSecret: createApiCredential(),
    feeShare: 0,
    config: {
      maxRoutingFee: 0.01,
      premiums: {
        [SwapType.Submarine]: -15,
        [SwapType.ReverseSubmarine]: 21,
      },
      limits: {
        [SwapType.ReverseSubmarine]: {
          minimal: 101_00,
          maximal: 512_321,
        },
      },
      pairs: {
        'RBTC/BTC': {
          maxRoutingFee: 0.025,
          premiums: {
            [SwapType.Chain]: -25,
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
    pair          | type                         | expected
    ${'BTC/BTC'}  | ${SwapType.Submarine}        | ${referralValues.config!.premiums![SwapType.Submarine]}
    ${'BTC/BTC'}  | ${SwapType.ReverseSubmarine} | ${referralValues.config!.premiums![SwapType.ReverseSubmarine]}
    ${'BTC/BTC'}  | ${SwapType.Chain}            | ${referralValues.config!.premiums![SwapType.Chain]}
    ${'RBTC/BTC'} | ${SwapType.Chain}            | ${referralValues.config!.pairs!['RBTC/BTC']!.premiums![SwapType.Chain]}
  `(
    'should get premium for pair $pair and type $type',
    async ({ pair, type, expected }) => {
      const ref = await ReferralRepository.getReferralById(referralValues.id);

      expect(ref).not.toBeNull();
      expect(ref!.premium(pair, type)).toEqual(expected);
    },
  );

  test.each`
    pairs                      | type              | expected
    ${['BTC/BTC']}             | ${SwapType.Chain} | ${referralValues.config!.premiums![SwapType.Chain]}
    ${['BTC/BTC', 'RBTC/BTC']} | ${SwapType.Chain} | ${referralValues.config!.pairs!['RBTC/BTC']!.premiums![SwapType.Chain]}
  `('should get premium for pairs', async ({ pairs, type, expected }) => {
    const ref = await ReferralRepository.getReferralById(referralValues.id);

    expect(ref).not.toBeNull();
    expect(ref!.premiumForPairs(pairs, type)).toEqual(expected);
  });
});
