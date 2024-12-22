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
    submarinePremium: 10,
    reversePremium: 20,
    chainPremium: 30,
  };

  beforeAll(async () => {
    await db.init();

    await ReferralRepository.addReferral(referralValues);
  });

  afterAll(async () => {
    await db.close();
  });

  test.each`
    type                         | value
    ${SwapType.Submarine}        | ${referralValues.submarinePremium}
    ${SwapType.ReverseSubmarine} | ${referralValues.reversePremium}
    ${SwapType.Chain}            | ${referralValues.chainPremium}
  `('should get premium for type $type', async ({ type, value }) => {
    const ref = await ReferralRepository.getReferralById(referralValues.id);
    expect(ref).not.toBeNull();

    expect(ref!.premiumForType(type)).toEqual(value);
  });
});
