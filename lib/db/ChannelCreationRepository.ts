import { WhereOptions } from 'sequelize';
import { ChannelCreationStatus } from '../consts/Enums';
import ChannelCreation, { ChannelCreationType } from './models/ChannelCreation';

class ChannelCreationRepository {
  public getChannelCreation = (options?: WhereOptions): Promise<ChannelCreation | null> => {
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

  public setAttempted = (channelCreation: ChannelCreation): Promise<ChannelCreation> => {
    return channelCreation.update({
      status: ChannelCreationStatus.Attempted,
    });
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

  public setNodePublicKey = (channelCreation: ChannelCreation, nodePublicKey: string): Promise<ChannelCreation> => {
    return channelCreation.update({
      nodePublicKey,
    });
  }

  public setSettled = (channelCreation: ChannelCreation): Promise<ChannelCreation> => {
    return channelCreation.update({
      status: ChannelCreationStatus.Settled,
    });
  }

  public setAbandoned = (channelCreation: ChannelCreation): Promise<ChannelCreation> => {
    return channelCreation.update({
      status: ChannelCreationStatus.Abandoned,
    });
  }

  public dropTable = (): Promise<void> => {
    return ChannelCreation.drop();
  }
}

export default ChannelCreationRepository;
