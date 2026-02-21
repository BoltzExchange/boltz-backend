import { Signature } from 'ethers';
import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import { getHexString } from '../../Utils';

type CommitmentType = {
  swapId: string;
  lockupHash: string;
  transactionHash: string;
  signature: Buffer;
};

class Commitment extends Model implements CommitmentType {
  declare swapId: string;
  declare lockupHash: string;
  declare transactionHash: string;
  declare signature: Buffer;

  declare createdAt: Date;
  declare updatedAt: Date;

  public static load = (sequelize: Sequelize): void => {
    Commitment.init(
      {
        swapId: {
          type: new DataTypes.STRING(255),
          primaryKey: true,
          allowNull: false,
        },
        lockupHash: {
          type: new DataTypes.STRING(66),
          allowNull: false,
        },
        transactionHash: {
          type: new DataTypes.STRING(66),
          allowNull: false,
        },
        signature: {
          type: new DataTypes.BLOB(),
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: 'commitments',
        indexes: [
          {
            unique: true,
            fields: ['lockupHash'],
          },
        ],
      },
    );
  };

  public get signatureEthers() {
    return Signature.from(`0x${getHexString(this.signature)}`);
  }
}

export default Commitment;
export { CommitmentType };
