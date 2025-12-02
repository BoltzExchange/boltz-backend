import { Op } from 'sequelize';
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

  public static addFundingAddress = (
    fundingAddress: FundingAddressType,
  ): Promise<FundingAddress> => {
    return FundingAddress.create(fundingAddress);
  };

  public static getBySwapId = (
    swapId: string,
  ): Promise<FundingAddress | null> => {
    return FundingAddress.findOne({
      where: { swapId },
    });
  };
}

export default FundingAddressRepository;
