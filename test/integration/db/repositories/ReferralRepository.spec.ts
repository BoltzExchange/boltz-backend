import Logger from '../../../../lib/Logger';
import { OrderSide, SwapType } from '../../../../lib/consts/Enums';
import Database from '../../../../lib/db/Database';
import Referral from '../../../../lib/db/models/Referral';
import ReferralRepository from '../../../../lib/db/repositories/ReferralRepository';

describe('ReferralRepository', () => {
  const fixture = {
    id: 'test',
    feeShare: 0,
    apiKey: '',
    apiSecret: '',
  };

  let database: Database;

  beforeAll(async () => {
    database = new Database(Logger.disabledLogger, Database.memoryDatabase);
    await database.init();
  });

  beforeEach(async () => {
    await Referral.truncate();
  });

  afterAll(async () => {
    await database.close();
  });

  describe('setConfig', () => {
    test('should set config', async () => {
      const newCfg = {
        maxRoutingFee: 0.001,
      };

      let ref = await ReferralRepository.addReferral(fixture);
      ref = await ReferralRepository.setConfig(ref, newCfg);

      expect(ref.config).toEqual(newCfg);
    });

    test.each`
      value
      ${null}
      ${undefined}
    `('should handle $value', async ({ value }) => {
      let ref = await ReferralRepository.addReferral({
        ...fixture,
        config: {},
      });
      ref = await ReferralRepository.setConfig(ref, value);

      expect(ref.config).toBeNull();
    });

    describe('sanityCheckConfig', () => {
      test.each`
        value
        ${-1}
        ${-0.0001}
        ${0.006}
        ${1}
      `(
        'should throw if maxRoutingFee is out of range ($value)',
        async ({ value }) => {
          await expect(
            ReferralRepository.addReferral({
              ...fixture,
              config: {
                maxRoutingFee: value,
              },
            }),
          ).rejects.toEqual('maxRoutingFee out of range');
        },
      );

      test.each`
        value
        ${-101}
        ${101}
      `(
        'should throw if premium is out of range ($value)',
        async ({ value }) => {
          await expect(
            ReferralRepository.addReferral({
              ...fixture,
              config: {
                premiums: {
                  [SwapType.Submarine]: value,
                },
              },
            }),
          ).rejects.toEqual('premium out of range');
        },
      );

      test.each`
        value
        ${119}
        ${60 * 60 * 24 + 1}
      `(
        'should throw if expiration is out of range ($value)',
        async ({ value }) => {
          await expect(
            ReferralRepository.addReferral({
              ...fixture,
              config: {
                expirations: {
                  [SwapType.Submarine]: value,
                },
              },
            }),
          ).rejects.toEqual('expiration out of range');
        },
      );

      test.each`
        value               | field
        ${0.006}            | ${'maxRoutingFee'}
        ${101}              | ${'premium'}
        ${60 * 60 * 24 + 1} | ${'expiration'}
      `(
        'should throw if $field in pair config is out of range ($value)',
        async ({ value, field }) => {
          const config: any = {
            pairs: {
              'BTC/BTC': {},
            },
          };

          if (field === 'maxRoutingFee') {
            config.pairs['BTC/BTC'].maxRoutingFee = value;
          } else if (field === 'premium') {
            config.pairs['BTC/BTC'].premiums = {
              [SwapType.Submarine]: value,
            };
          } else {
            config.pairs['BTC/BTC'].expirations = {
              [SwapType.Submarine]: value,
            };
          }

          await expect(
            ReferralRepository.addReferral({
              ...fixture,
              config,
            }),
          ).rejects.toEqual(`${field} out of range`);
        },
      );

      test('should throw if chain swap premium is not a DirectionalPremium object', async () => {
        await expect(
          ReferralRepository.addReferral({
            ...fixture,
            config: {
              premiums: {
                [SwapType.Chain]: 10 as any,
              },
            },
          }),
        ).rejects.toEqual(
          'Chain swap premiums must specify both BUY and SELL values',
        );
      });

      test.each`
        premiumValue
        ${10}
        ${{ [OrderSide.BUY]: 10 }}
        ${{ [OrderSide.SELL]: 10 }}
      `(
        'should throw if chain swap premium is invalid or incomplete ($premiumValue)',
        async ({ premiumValue }) => {
          await expect(
            ReferralRepository.addReferral({
              ...fixture,
              config: {
                premiums: {
                  [SwapType.Chain]: premiumValue,
                },
              },
            }),
          ).rejects.toEqual(
            'Chain swap premiums must specify both BUY and SELL values',
          );
        },
      );

      test.each`
        buy     | sell
        ${101}  | ${10}
        ${10}   | ${-101}
        ${-101} | ${10}
        ${10}   | ${101}
      `(
        'should throw if chain swap premium values are out of range (buy: $buy, sell: $sell)',
        async ({ buy, sell }) => {
          await expect(
            ReferralRepository.addReferral({
              ...fixture,
              config: {
                premiums: {
                  [SwapType.Chain]: {
                    [OrderSide.BUY]: buy,
                    [OrderSide.SELL]: sell,
                  },
                },
              },
            }),
          ).rejects.toEqual('premium out of range');
        },
      );

      test.each`
        buy     | sell
        ${10}   | ${20}
        ${-100} | ${-100}
        ${0}    | ${0}
        ${100}  | ${100}
      `(
        'should accept valid chain swap premiums (buy: $buy, sell: $sell)',
        async ({ buy, sell }) => {
          const ref = await ReferralRepository.addReferral({
            ...fixture,
            config: {
              premiums: {
                [SwapType.Chain]: {
                  [OrderSide.BUY]: buy,
                  [OrderSide.SELL]: sell,
                },
              },
            },
          });

          expect(ref.config?.premiums?.[SwapType.Chain]).toEqual({
            [OrderSide.BUY]: buy,
            [OrderSide.SELL]: sell,
          });
        },
      );
    });
  });
});
