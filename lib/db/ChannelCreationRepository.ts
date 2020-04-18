import { WhereOptions } from 'sequelize';
import ChannelCreation, { ChannelCreationType } from './models/ChannelCreation';
import { ChannelCreationStatus } from '../consts/Enums';

class ChannelCreationRepository {
  public getChannelCreation = (options?: WhereOptions): Promise<ChannelCreation | undefined> => {
    return ChannelCreation.findOne({
      where: options,
    });
  }

  public getChannelCreations = (options?: WhereOptions): Promise<ChannelCreation[]> => {
    return ChannelCreation.findAll({
      where: options,
    });
  }

  public addChannelCreation = (channelCreation: ChannelCreationType): Promise<ChannelCreation> => {
    return ChannelCreation.create(channelCreation);
  }

  public setFundingTransaction = (
    channelCreation: ChannelCreation,
    fundingTransactionId: string,
    fundingTransactionVout: number,
  ): Promise<ChannelCreation> => {
    return channelCreation.update({
      fundingTransactionId,
      fundingTransactionVout,
      status: ChannelCreationStatus.Created,
    });
  }

  public setSettled = (channelCreation: ChannelCreation): Promise<ChannelCreation> => {
    return channelCreation.update({
      status: ChannelCreationStatus.Settled,
    });
  }

  public dropTable = () => {
    return ChannelCreation.drop();
  }
}

export default ChannelCreationRepository;
