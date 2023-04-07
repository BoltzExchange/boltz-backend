import { WhereOptions } from 'sequelize';
import { ChannelCreationStatus } from '../../consts/Enums';
import ChannelCreation, { ChannelCreationType } from '../models/ChannelCreation';

class ChannelCreationRepository {
  public static getChannelCreation = (options?: WhereOptions): Promise<ChannelCreation | null> => {
    return ChannelCreation.findOne({
      where: options,
    });
  };

  public static getChannelCreations = (options?: WhereOptions): Promise<ChannelCreation[]> => {
    return ChannelCreation.findAll({
      where: options,
    });
  };

  public static addChannelCreation = (channelCreation: ChannelCreationType): Promise<ChannelCreation> => {
    return ChannelCreation.create(channelCreation);
  };

  public static setAttempted = (channelCreation: ChannelCreation): Promise<ChannelCreation> => {
    return channelCreation.update({
      status: ChannelCreationStatus.Attempted,
    });
  };

  public static setFundingTransaction = (
    channelCreation: ChannelCreation,
    fundingTransactionId: string,
    fundingTransactionVout: number,
  ): Promise<ChannelCreation> => {
    return channelCreation.update({
      fundingTransactionId,
      fundingTransactionVout,
      status: ChannelCreationStatus.Created,
    });
  };

  public static setNodePublicKey = (channelCreation: ChannelCreation, nodePublicKey: string): Promise<ChannelCreation> => {
    return channelCreation.update({
      nodePublicKey,
    });
  };

  public static setSettled = (channelCreation: ChannelCreation): Promise<ChannelCreation> => {
    return channelCreation.update({
      status: ChannelCreationStatus.Settled,
    });
  };

  public static setAbandoned = (channelCreation: ChannelCreation): Promise<ChannelCreation> => {
    return channelCreation.update({
      status: ChannelCreationStatus.Abandoned,
    });
  };

  public static dropTable = (): Promise<void> => {
    return ChannelCreation.drop();
  };
}

export default ChannelCreationRepository;
