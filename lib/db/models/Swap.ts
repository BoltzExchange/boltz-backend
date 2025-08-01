import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import {
  getChainCurrency,
  getLightningCurrency,
  splitPairId,
} from '../../Utils';
import {
  SwapType as SwapKindType,
  SwapUpdateEvent,
  SwapVersion,
} from '../../consts/Enums';
import type { IncorrectAmountDetails } from '../../consts/Types';
import Pair from './Pair';

type SwapType = {
  id: string;
  version: SwapVersion;

  keyIndex?: number;
  refundPublicKey?: string;
  redeemScript?: string;

  fee?: number;
  referral?: string;

  routingFee?: number;
  minerFee?: number;
  paymentTimeout?: number;

  pair: string;
  orderSide: number;

  status: string;
  failureReason?: string;

  preimageHash: string;
  preimage?: string;
  invoice?: string;
  invoiceAmount?: number;

  acceptZeroConf?: boolean;
  timeoutBlockHeight: number;
  rate?: number;
  expectedAmount?: number;
  onchainAmount?: number;
  lockupAddress: string;
  lockupTransactionId?: string;
  lockupTransactionVout?: number;

  createdRefundSignature: boolean;
};

class Swap extends Model implements SwapType {
  public id!: string;
  public version!: SwapVersion;

  public keyIndex?: number;
  public refundPublicKey?: string;
  public redeemScript?: string;

  public fee?: number;
  public referral?: string;

  public routingFee?: number;
  public minerFee?: number;
  public paymentTimeout?: number;

  public pair!: string;
  public orderSide!: number;

  public status!: string;
  public failureReason?: string;

  public preimageHash!: string;
  public preimage?: string;
  public invoice?: string;
  public invoiceAmount?: number;

  public acceptZeroConf?: boolean;
  public timeoutBlockHeight!: number;
  public rate?: number;
  public expectedAmount?: number;
  public onchainAmount?: number;
  public lockupAddress!: string;
  public lockupTransactionId?: string;
  public lockupTransactionVout?: number;

  public createdRefundSignature!: boolean;

  public createdAt!: Date;
  public updatedAt!: Date;

  public static load = (sequelize: Sequelize): void => {
    Swap.init(
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
        keyIndex: { type: new DataTypes.INTEGER(), allowNull: true },
        refundPublicKey: { type: new DataTypes.STRING(), allowNull: true },
        redeemScript: { type: new DataTypes.TEXT(), allowNull: true },
        fee: { type: new DataTypes.BIGINT(), allowNull: true },
        referral: { type: new DataTypes.STRING(255), allowNull: true },
        routingFee: { type: new DataTypes.INTEGER(), allowNull: true },
        minerFee: { type: new DataTypes.BIGINT(), allowNull: true },
        paymentTimeout: {
          type: new DataTypes.INTEGER(),
          allowNull: true,
          validate: {
            min: 1,
          },
        },
        pair: { type: new DataTypes.STRING(255), allowNull: false },
        orderSide: { type: new DataTypes.INTEGER(), allowNull: false },
        status: { type: new DataTypes.STRING(255), allowNull: false },
        failureReason: { type: new DataTypes.TEXT(), allowNull: true },
        preimageHash: {
          type: new DataTypes.STRING(64),
          allowNull: false,
          unique: true,
        },
        preimage: {
          type: new DataTypes.STRING(64),
          allowNull: true,
          unique: true,
        },
        invoice: {
          type: new DataTypes.TEXT(),
          allowNull: true,
        },
        invoiceAmount: { type: new DataTypes.BIGINT(), allowNull: true },
        acceptZeroConf: { type: DataTypes.BOOLEAN, allowNull: true },
        timeoutBlockHeight: { type: new DataTypes.INTEGER(), allowNull: false },
        rate: { type: new DataTypes.REAL(), allowNull: true },
        expectedAmount: { type: new DataTypes.BIGINT(), allowNull: true },
        onchainAmount: { type: new DataTypes.BIGINT(), allowNull: true },
        lockupAddress: { type: new DataTypes.STRING(255), allowNull: false },
        lockupTransactionId: {
          type: new DataTypes.STRING(255),
          allowNull: true,
        },
        lockupTransactionVout: {
          type: new DataTypes.INTEGER(),
          allowNull: true,
        },
        createdRefundSignature: {
          type: DataTypes.BOOLEAN(),
          allowNull: false,
          defaultValue: false,
        },
      },
      {
        sequelize,
        tableName: 'swaps',
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
            using: 'HASH',
            unique: false,
            fields: ['invoice'],
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
            fields: ['lockupTransactionId'],
          },
          {
            unique: false,
            fields: ['refundPublicKey'],
          },
        ],
      },
    );

    Swap.belongsTo(Pair, {
      foreignKey: 'pair',
    });
  };

  get type() {
    return SwapKindType.Submarine;
  }

  get theirPublicKey() {
    return this.refundPublicKey;
  }

  get lightningCurrency() {
    const { base, quote } = splitPairId(this.pair);
    return getLightningCurrency(base, quote, this.orderSide, false);
  }

  get chainCurrency() {
    const { base, quote } = splitPairId(this.pair);
    return getChainCurrency(base, quote, this.orderSide, false);
  }

  get failureDetails(): IncorrectAmountDetails | undefined {
    if (
      this.status === SwapUpdateEvent.TransactionLockupFailed &&
      [this.onchainAmount, this.expectedAmount].every(
        (val) => val !== undefined && val !== null,
      )
    ) {
      if (this.onchainAmount! !== this.expectedAmount!) {
        return {
          actual: this.onchainAmount!,
          expected: this.expectedAmount!,
        };
      }
    }

    return undefined;
  }
}

export default Swap;
export { SwapType };
