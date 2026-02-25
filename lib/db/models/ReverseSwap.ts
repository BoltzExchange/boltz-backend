import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import {
  getChainCurrency,
  getLightningCurrency,
  splitPairId,
} from '../../Utils';
import { SwapType, SwapVersion } from '../../consts/Enums';
import type { IncorrectAmountDetails } from '../../consts/Types';
import Pair from './Pair';

enum NodeType {
  LND = 0,
  CLN = 1,
  SelfPayment = 2,
}

type ReverseSwapType = {
  id: string;
  version: SwapVersion;

  lockupAddress: string;

  keyIndex?: number;
  claimPublicKey?: string;
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

  nodeId: string;
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
  declare id: string;
  declare version: SwapVersion;

  declare lockupAddress: string;

  declare keyIndex?: number;
  declare claimPublicKey?: string;
  declare redeemScript?: string;

  declare claimAddress?: string;

  declare fee: number;
  declare referral?: string;

  declare minerFee?: number;

  declare pair: string;
  declare orderSide: number;

  declare status: string;
  declare failureReason?: string;

  declare timeoutBlockHeight: number;

  declare nodeId: string;

  declare invoice: string;
  declare invoiceAmount: number;

  declare minerFeeInvoice?: string;
  declare minerFeeInvoicePreimage?: string;

  declare minerFeeOnchainAmount?: number;

  declare preimageHash: string;
  declare preimage?: string;

  declare onchainAmount: number;
  declare transactionId?: string;
  declare transactionVout?: number;

  declare createdAt: Date;
  declare updatedAt: Date;

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
        claimPublicKey: { type: new DataTypes.STRING(), allowNull: true },
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
        nodeId: {
          type: new DataTypes.STRING(255),
          allowNull: false,
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
            unique: false,
            fields: ['nodeId'],
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

  get type() {
    return SwapType.ReverseSubmarine;
  }

  get chainCurrency() {
    const { base, quote } = splitPairId(this.pair);
    return getChainCurrency(base, quote, this.orderSide, true);
  }

  get lightningCurrency() {
    const { base, quote } = splitPairId(this.pair);
    return getLightningCurrency(base, quote, this.orderSide, true);
  }

  get refundCurrency() {
    return this.chainCurrency;
  }

  get serverLockupTransactionId() {
    return this.transactionId;
  }

  get theirPublicKey() {
    return this.claimPublicKey;
  }

  get expectedAmount() {
    return this.onchainAmount;
  }

  get failureDetails(): IncorrectAmountDetails | undefined {
    return undefined;
  }
}

const nodeTypeToPrettyString = (type: NodeType) => {
  switch (type) {
    case NodeType.LND:
      return 'LND';
    case NodeType.CLN:
      return 'CLN';
    case NodeType.SelfPayment:
      return 'SelfPayment';
  }
};

export default ReverseSwap;
export { NodeType, nodeTypeToPrettyString, ReverseSwapType };
