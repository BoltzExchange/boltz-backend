import { WhereOptions } from 'sequelize';
import { ChannelCreationStatus } from '../consts/Enums';
import ChannelCreation, { ChannelCreationType } from './models/ChannelCreation';

class ChannelCreationRepository {
  public getChannelCreation = (options?: WhereOptions) => {
    return ChannelCreation.findOne({
      where: options,
    });
  }

  public getChannelCreations = (options?: WhereOptions) => {
    return ChannelCreation.findAll({
      where: options,
    });
  }

  public addChannelCreation = (channelCreation: ChannelCreationType) => {
    return ChannelCreation.create(channelCreation);
  }

  public setAttempted = (channelCreation: ChannelCreation) => {
    return channelCreation.update({
      status: ChannelCreationStatus.Attempted,
    });
  }

  public setFundingTransaction = (
    channelCreation: ChannelCreation,
    fundingTransactionId: string,
    fundingTransactionVout: number,
  ) => {
    return channelCreation.update({
      fundingTransactionId,
      fundingTransactionVout,
      status: ChannelCreationStatus.Created,
    });
  }

  public setNodePublicKey = (channelCreation: ChannelCreation, nodePublicKey: string) => {
    return channelCreation.update({
      nodePublicKey,
    });
  }

  public setSettled = (channelCreation: ChannelCreation) => {
    return channelCreation.update({
      status: ChannelCreationStatus.Settled,
    });
  }

  public setAbandoned = (channelCreation: ChannelCreation) => {
    return channelCreation.update({
      status: ChannelCreationStatus.Abandoned,
    });
  }

  public dropTable = () => {
    return ChannelCreation.drop();
  }
}

export default ChannelCreationRepository;
