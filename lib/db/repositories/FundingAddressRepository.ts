import { Op, Transaction } from 'sequelize';
import Database from '../Database';
import type { FundingAddressType } from '../models/FundingAddress';
import FundingAddress from '../models/FundingAddress';

class FundingAddressRepository {
  public static getFundingAddressById = (
    id: string,
  ): Promise<FundingAddress | null> => {
    return FundingAddress.findOne({
      where: { id },
    });
  };

  public static getFundingAddressesByIds = (
    ids: string[],
  ): Promise<FundingAddress[]> => {
    return FundingAddress.findAll({
      where: { id: { [Op.in]: ids } },
    });
  };

  public static getBySwapId = (
    swapId: string,
  ): Promise<FundingAddress | null> => {
    return FundingAddress.findOne({
      where: { swapId },
    });
  };

  public static addFundingAddress = (
    fundingAddress: FundingAddressType,
  ): Promise<FundingAddress> => {
    return FundingAddress.create(fundingAddress);
  };

  public static setSwapId = (id: string, swapId: string | null) => {
    return Database.sequelize.transaction(
      {
        isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
      },
      async (transaction) => {
        // The combination of SERIALIZABLE isolation level and adding swapId: null to the where clause
        // ensures that the update will only succeed if the funding address is not already associated with a swap
        // and no race condition can happen
        return FundingAddress.update(
          { swapId },
          { where: { id, swapId: null }, transaction },
        );
      },
    );
  };
}

export default FundingAddressRepository;
