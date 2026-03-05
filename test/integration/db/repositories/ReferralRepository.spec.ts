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
    ReferralRepository.setConfiguredReferrals(undefined);
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
        ${'true'}
        ${1}
        ${{}}
      `(
        'should throw if showHidden has invalid type ($value)',
        async ({ value }) => {
          await expect(
            ReferralRepository.addReferral({
              ...fixture,
              config: {
                pairs: {
                  'BTC/BTC': {
                    showHidden: value as any,
                  },
                },
              },
            }),
          ).rejects.toEqual('showHidden must be a boolean');
        },
      );

      test.each`
        value
        ${true}
        ${false}
      `('should accept valid showHidden values ($value)', async ({ value }) => {
        const ref = await ReferralRepository.addReferral({
          ...fixture,
          config: {
            pairs: {
              'BTC/BTC': {
                showHidden: value,
              },
            },
          },
        });

        expect(ref.config?.pairs?.['BTC/BTC']?.showHidden).toEqual(value);
      });

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

      test.each`
        premium                                 | description
        ${{ [OrderSide.BUY]: 'not-a-number' }}  | ${'invalid BUY value type'}
        ${{ [OrderSide.SELL]: 'not-a-number' }} | ${'invalid SELL value type'}
        ${{ [OrderSide.BUY]: true }}            | ${'invalid BUY value type'}
        ${{ [OrderSide.SELL]: {} }}             | ${'invalid SELL value type'}
        ${{ [OrderSide.BUY]: () => {} }}        | ${'invalid BUY value type'}
        ${{ [OrderSide.SELL]: [1, 2] }}         | ${'invalid SELL value type'}
      `(
        'should throw if chain swap premium has $description',
        async ({ premium }) => {
          await expect(
            ReferralRepository.addReferral({
              ...fixture,
              config: {
                premiums: {
                  [SwapType.Chain]: premium,
                },
              },
            }),
          ).rejects.toEqual('premium values must be numbers');
        },
      );

      test.each`
        premium                                          | description
        ${{}}                                            | ${'empty object'}
        ${{ [OrderSide.BUY]: 10 }}                       | ${'only BUY'}
        ${{ [OrderSide.SELL]: 10 }}                      | ${'only SELL'}
        ${{ [OrderSide.BUY]: 10, [OrderSide.SELL]: 10 }} | ${'both BUY and SELL'}
      `(
        'should accept valid chain swap premium ($description)',
        async ({ premium }) => {
          const ref = await ReferralRepository.addReferral({
            ...fixture,
            config: {
              premiums: {
                [SwapType.Chain]: premium,
              },
            },
          });

          expect(ref.config?.premiums?.[SwapType.Chain]).toEqual(premium);
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

    describe('config file merge', () => {
      test('should apply file config when db config is empty', async () => {
        ReferralRepository.setConfiguredReferrals({
          test: {
            pairs: {
              'BTC/BTC': {
                showHidden: true,
              },
            },
          },
        });

        await ReferralRepository.addReferral({
          ...fixture,
          config: undefined,
        });

        const ref = await ReferralRepository.getReferralById('test');
        expect(ref?.config).toEqual({
          pairs: {
            'BTC/BTC': {
              showHidden: true,
            },
          },
        });
      });

      test('should prefer db config for duplicate values', async () => {
        ReferralRepository.setConfiguredReferrals({
          test: {
            maxRoutingFee: 0.001,
            pairs: {
              'BTC/BTC': {
                showHidden: false,
                maxRoutingFee: 0.001,
              },
            },
          },
        });

        await ReferralRepository.addReferral({
          ...fixture,
          config: {
            maxRoutingFee: 0.002,
            pairs: {
              'BTC/BTC': {
                showHidden: true,
                maxRoutingFee: 0.002,
              },
            },
          },
        });

        const ref = await ReferralRepository.getReferralById('test');
        expect(ref?.config).toEqual({
          maxRoutingFee: 0.002,
          pairs: {
            'BTC/BTC': {
              showHidden: true,
              maxRoutingFee: 0.002,
            },
          },
        });
      });

      test('should preserve non-conflicting nested values from both configs', async () => {
        ReferralRepository.setConfiguredReferrals({
          test: {
            pairs: {
              'BTC/BTC': {
                showHidden: true,
              },
            },
          },
        });

        await ReferralRepository.addReferral({
          ...fixture,
          config: {
            pairs: {
              'BTC/BTC': {
                premiums: {
                  [SwapType.Submarine]: 1,
                },
              },
            },
          },
        });

        const ref = await ReferralRepository.getReferralById('test');
        expect(ref?.config).toEqual({
          pairs: {
            'BTC/BTC': {
              showHidden: true,
              premiums: {
                [SwapType.Submarine]: 1,
              },
            },
          },
        });
      });

      test('should return db config unchanged when no file config exists for referral', async () => {
        ReferralRepository.setConfiguredReferrals({
          other: {
            maxRoutingFee: 0.001,
          },
        });

        const dbConfig = {
          maxRoutingFee: 0.003,
        };

        await ReferralRepository.addReferral({
          ...fixture,
          config: dbConfig,
        });

        const ref = await ReferralRepository.getReferralById('test');
        expect(ref?.config).toEqual(dbConfig);
      });

      test('should merge config in getReferrals', async () => {
        ReferralRepository.setConfiguredReferrals({
          test: {
            pairs: {
              'BTC/BTC': {
                showHidden: true,
              },
            },
          },
        });

        await ReferralRepository.addReferral({
          ...fixture,
          config: undefined,
        });

        const refs = await ReferralRepository.getReferrals();
        expect(refs).toHaveLength(1);
        expect(refs[0].config).toEqual({
          pairs: {
            'BTC/BTC': {
              showHidden: true,
            },
          },
        });
      });

      test('should merge config in getReferralByApiKey', async () => {
        ReferralRepository.setConfiguredReferrals({
          test: {
            pairs: {
              'BTC/BTC': {
                showHidden: true,
              },
            },
          },
        });

        await ReferralRepository.addReferral({
          ...fixture,
          apiKey: 'testKey',
          config: undefined,
        });

        const ref = await ReferralRepository.getReferralByApiKey('testKey');
        expect(ref?.config).toEqual({
          pairs: {
            'BTC/BTC': {
              showHidden: true,
            },
          },
        });
      });

      test('should merge config in getReferralByRoutingNode', async () => {
        ReferralRepository.setConfiguredReferrals({
          test: {
            pairs: {
              'BTC/BTC': {
                showHidden: true,
              },
            },
          },
        });

        await ReferralRepository.addReferral({
          ...fixture,
          routingNode: '02abc',
          config: undefined,
        });

        const ref = await ReferralRepository.getReferralByRoutingNode('02abc');
        expect(ref?.config).toEqual({
          pairs: {
            'BTC/BTC': {
              showHidden: true,
            },
          },
        });
      });

      test('should reject invalid file config in setConfiguredReferrals', () => {
        expect(() =>
          ReferralRepository.setConfiguredReferrals({
            bad: {
              maxRoutingFee: 1,
            },
          }),
        ).toThrow('maxRoutingFee out of range');
      });

      test('should reject file config with invalid showHidden type', () => {
        expect(() =>
          ReferralRepository.setConfiguredReferrals({
            bad: {
              pairs: {
                'BTC/BTC': {
                  showHidden: 'yes' as any,
                },
              },
            },
          }),
        ).toThrow('showHidden must be a boolean');
      });
    });

    describe('lookups', () => {
      test('should return null when referral does not exist', async () => {
        await expect(
          ReferralRepository.getReferralById('missing'),
        ).resolves.toBe(null);
        await expect(
          ReferralRepository.getReferralByApiKey('missing-key'),
        ).resolves.toBe(null);
        await expect(
          ReferralRepository.getReferralByRoutingNode('missing-node'),
        ).resolves.toBe(null);
      });
    });
  });
});
