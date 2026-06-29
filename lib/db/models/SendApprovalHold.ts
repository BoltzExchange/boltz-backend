import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import { SwapType } from '../../consts/Enums';

type SendApprovalHoldType = {
  swapId: string;
  type: SwapType;
};

class SendApprovalHold extends Model implements SendApprovalHoldType {
  declare swapId: string;
  declare type: SwapType;

  declare createdAt: Date;
  declare updatedAt: Date;

  public static load = (sequelize: Sequelize) => {
    SendApprovalHold.init(
      {
        swapId: {
          type: new DataTypes.STRING(255),
          allowNull: false,
          primaryKey: true,
        },
        type: {
          type: new DataTypes.INTEGER(),
          allowNull: false,
          validate: {
            isIn: [
              Object.values(SwapType).filter((val) => typeof val === 'number'),
            ],
          },
        },
      },
      {
        sequelize,
        tableName: 'send_approval_holds',
      },
    );
  };
}

export default SendApprovalHold;
export { SendApprovalHoldType };
