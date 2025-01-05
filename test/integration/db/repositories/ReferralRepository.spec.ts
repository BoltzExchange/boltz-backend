import Logger from '../../../../lib/Logger';
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
    const newCfg = {
      maxRoutingFee: 0.1,
    };

    test('should set config', async () => {
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
        config: newCfg,
      });
      ref = await ReferralRepository.setConfig(ref, value);

      expect(ref.config).toBeNull();
    });
  });
});
