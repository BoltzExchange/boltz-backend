import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';

type FundingAddressType = {
  id: string;
  symbol: string;
  keyIndex: number;
  theirPublicKey: string;
  timeoutBlockHeight: number;
  lockupTransactionId?: string;
  lockupConfirmed: boolean;
  lockupAmount?: number;
  swapId?: string;
  presignedTx?: Buffer;
};

class FundingAddress extends Model implements FundingAddressType {
  public id!: string;
  public symbol!: string;
  public keyIndex!: number;
  public theirPublicKey!: string;
  public timeoutBlockHeight!: number;
  public lockupTransactionId?: string;
  public lockupConfirmed!: boolean;
  public lockupAmount?: number;
  public swapId?: string;
  public presignedTx?: Buffer;
}

export default FundingAddress;
export { FundingAddressType };
