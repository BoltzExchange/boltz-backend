import { Model, Sequelize, DataTypes } from 'sequelize';
import Pair from './Pair';
import { SwapVersion } from '../../consts/Enums';

enum NodeType {
  LND = 0,
  CLN = 1,
}

type ReverseSwapType = {
  id: string;
  version: SwapVersion;

  lockupAddress: string;

  keyIndex?: number;
  redeemScript?: string;

  claimAddress?: string;

  fee: number;
  referral?: string;

  minerFee?: number;

  pair: string;
  orderSide: number;

  status: string;
  failureReason?: string;

  timeoutBlockHeight: number;

  node: NodeType;
  invoice: string;
  invoiceAmount: number;

  minerFeeInvoice?: string;
  minerFeeInvoicePreimage?: string;

  minerFeeOnchainAmount?: number;

  preimageHash: string;
  preimage?: string;

  onchainAmount: number;
  transactionId?: string;
  transactionVout?: number;
};

class ReverseSwap extends Model implements ReverseSwapType {
  public id!: string;
  public version!: SwapVersion;

  public lockupAddress!: string;

  public keyIndex?: number;
  public redeemScript?: string;

  public claimAddress?: string;

  public fee!: number;
  public referral?: string;

  public minerFee!: number;

  public pair!: string;
  public orderSide!: number;

  public status!: string;
  public failureReason?: string;

  public timeoutBlockHeight!: number;

  public node!: NodeType;

  public invoice!: string;
  public invoiceAmount!: number;

  public minerFeeInvoice?: string;
  public minerFeeInvoicePreimage?: string;

  public minerFeeOnchainAmount?: number;

  public preimageHash!: string;
  public preimage?: string;

  public onchainAmount!: number;
  public transactionId?: string;
  public transactionVout?: number;

  public createdAt!: Date;
  public updatedAt!: Date;

  public static load = (sequelize: Sequelize): void => {
    ReverseSwap.init(
      {
        id: {
          type: new DataTypes.STRING(255),
          primaryKey: true,
          allowNull: false,
        },
        version: {
          type: new DataTypes.INTEGER(),
          allowNull: false,
          validate: {
            isIn: [
              Object.values(SwapVersion).filter(
                (val) => typeof val === 'number',
              ),
            ],
          },
        },
        lockupAddress: { type: new DataTypes.STRING(255), allowNull: false },
        keyIndex: { type: new DataTypes.INTEGER(), allowNull: true },
        redeemScript: { type: new DataTypes.TEXT(), allowNull: true },
        claimAddress: { type: new DataTypes.STRING(255), allowNull: true },
        fee: { type: new DataTypes.BIGINT(), allowNull: false },
        referral: { type: new DataTypes.STRING(255), allowNull: true },
        minerFee: { type: new DataTypes.BIGINT(), allowNull: true },
        pair: { type: new DataTypes.STRING(255), allowNull: false },
        orderSide: { type: new DataTypes.INTEGER(), allowNull: false },
        status: { type: new DataTypes.STRING(255), allowNull: false },
        failureReason: { type: new DataTypes.STRING(255), allowNull: true },
        timeoutBlockHeight: { type: new DataTypes.INTEGER(), allowNull: false },
        node: {
          type: new DataTypes.INTEGER(),
          allowNull: false,
          validate: {
            isIn: [
              Object.values(NodeType).filter((val) => typeof val === 'number'),
            ],
          },
        },
        invoice: {
          type: new DataTypes.TEXT(),
          allowNull: false,
          unique: true,
        },
        invoiceAmount: { type: new DataTypes.BIGINT(), allowNull: false },
        minerFeeInvoice: {
          type: new DataTypes.TEXT(),
          allowNull: true,
          unique: true,
        },
        minerFeeInvoicePreimage: {
          type: new DataTypes.STRING(64),
          allowNull: true,
          unique: true,
        },
        minerFeeOnchainAmount: {
          type: new DataTypes.BIGINT(),
          allowNull: true,
        },
        preimageHash: {
          type: new DataTypes.STRING(64),
          allowNull: false,
          unique: true,
        },
        preimage: { type: new DataTypes.STRING(64), allowNull: true },
        onchainAmount: { type: new DataTypes.BIGINT(), allowNull: false },
        transactionId: { type: new DataTypes.STRING(255), allowNull: true },
        transactionVout: { type: new DataTypes.INTEGER(), allowNull: true },
      },
      {
        sequelize,
        tableName: 'reverseSwaps',
        indexes: [
          {
            unique: true,
            fields: ['id'],
          },
          {
            unique: false,
            fields: ['status'],
          },
          {
            unique: true,
            fields: ['preimageHash'],
          },
          {
            unique: true,
            fields: ['invoice'],
          },
          {
            unique: true,
            fields: ['minerFeeInvoice'],
          },
          {
            unique: false,
            fields: ['referral'],
          },
          {
            unique: false,
            fields: ['lockupAddress'],
          },
          {
            unique: false,
            fields: ['transactionId'],
          },
        ],
      },
    );

    ReverseSwap.belongsTo(Pair, {
      foreignKey: 'pair',
    });
  };
}

export default ReverseSwap;
export { ReverseSwapType, NodeType };
