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

  public static addFundingAddress = (
    fundingAddress: FundingAddressType,
  ): Promise<FundingAddress> => {
    return FundingAddress.create(fundingAddress);
  };

  public static setSwapId = (id: string, swapId: string | null) => {
    return FundingAddress.update({ swapId }, { where: { id } });
  };
}

export default FundingAddressRepository;
