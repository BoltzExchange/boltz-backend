import { Signature } from 'ethers';
import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import { getHexString } from '../../Utils';

type CommitmentType = {
  lockupHash: string;
  swapId?: string | null;
  transactionHash: string;
  signature?: Buffer | null;
  refunded?: boolean;
};

class Commitment extends Model implements CommitmentType {
  declare swapId: string | null;
  declare lockupHash: string;
  declare transactionHash: string;
  declare signature: Buffer | null;
  declare refunded: boolean;

  declare createdAt: Date;
  declare updatedAt: Date;

  public static load = (sequelize: Sequelize): void => {
    Commitment.init(
      {
        lockupHash: {
          type: new DataTypes.STRING(66),
          allowNull: false,
          primaryKey: true,
        },
        swapId: {
          type: new DataTypes.STRING(255),
          allowNull: true,
          unique: true,
        },
        transactionHash: {
          type: new DataTypes.STRING(66),
          allowNull: false,
        },
        signature: {
          type: new DataTypes.BLOB(),
          allowNull: true,
        },
        refunded: {
          type: new DataTypes.BOOLEAN(),
          allowNull: false,
          defaultValue: false,
        },
      },
      {
        sequelize,
        tableName: 'commitments',
      },
    );
  };

  public get signatureEthers() {
    if (this.signature === null) {
      throw new Error('commitment does not have a signature');
    }

    return Signature.from(`0x${getHexString(this.signature)}`);
  }
}

export default Commitment;
export { CommitmentType };
