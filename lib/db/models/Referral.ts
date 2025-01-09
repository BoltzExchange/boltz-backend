import { DataTypes, Model, Sequelize } from 'sequelize';
import { SwapType } from '../../consts/Enums';

type Limits = {
  minimal?: number;
  maximal?: number;
};

// TODO: direction of chain swaps
type Premiums = Partial<Record<SwapType, number>>;

type LimitsPerType = Partial<Record<SwapType, Limits>>;

type ReferralPairConfig = {
  maxRoutingFee?: number;

  limits?: LimitsPerType;
  premiums?: Premiums;
};

type ReferralConfig = ReferralPairConfig & {
  // Pair configs beat the ones of the type
  pairs?: Record<string, ReferralPairConfig>;
};

type ReferralType = {
  id: string;

  apiKey: string;
  apiSecret: string;

  feeShare: number;
  routingNode?: string;

  config?: ReferralConfig | null;
};

class Referral extends Model implements ReferralType {
  public id!: string;

  public apiKey!: string;
  public apiSecret!: string;

  public feeShare!: number;
  public routingNode?: string;

  public config!: ReferralConfig | null;

  public static load = (sequelize: Sequelize): void => {
    Referral.init(
      {
        id: {
          type: new DataTypes.STRING(255),
          primaryKey: true,
          allowNull: false,
        },
        apiKey: {
          type: new DataTypes.STRING(255),
          unique: true,
          allowNull: false,
        },
        apiSecret: {
          type: new DataTypes.STRING(255),
          unique: true,
          allowNull: false,
        },
        feeShare: { type: new DataTypes.INTEGER(), allowNull: false },
        routingNode: {
          type: new DataTypes.STRING(),
          allowNull: true,
          unique: true,
        },
        config: { type: new DataTypes.JSON(), allowNull: true },
      },
      {
        sequelize,
        tableName: 'referrals',
        indexes: [
          {
            unique: true,
            fields: ['id'],
          },
          {
            unique: true,
            fields: ['apiKey'],
          },
        ],
      },
    );
  };

  public maxRoutingFeeRatio = (pair: string): number | undefined => {
    return (
      this.config?.pairs?.[pair]?.maxRoutingFee || this.config?.maxRoutingFee
    );
  };

  public maxRoutingFeeRatioForPairs = (pairs: string[]): number | undefined => {
    for (const pair of pairs) {
      const ratio = this.config?.pairs?.[pair]?.maxRoutingFee;
      if (ratio !== undefined) {
        return ratio;
      }
    }

    return this.config?.maxRoutingFee;
  };

  public limits = (pair: string, type: SwapType): Limits | undefined => {
    return (
      this.config?.pairs?.[pair]?.limits?.[type] || this.config?.limits?.[type]
    );
  };

  public limitsForPairs = (
    pairs: string[],
    type: SwapType,
  ): Limits | undefined => {
    for (const pair of pairs) {
      const limits = this.config?.pairs?.[pair]?.limits?.[type];
      if (limits !== undefined) {
        return limits;
      }
    }

    return this.config?.limits?.[type];
  };

  public premium = (pair: string, type: SwapType): number | undefined => {
    return (
      this.config?.pairs?.[pair]?.premiums?.[type] ||
      this.config?.premiums?.[type]
    );
  };

  public premiumForPairs = (
    pairs: string[],
    type: SwapType,
  ): number | undefined => {
    for (const pair of pairs) {
      const premium = this.config?.pairs?.[pair]?.premiums?.[type];
      if (premium !== undefined) {
        return premium;
      }
    }

    return this.config?.premiums?.[type];
  };
}

export default Referral;
export { ReferralType, ReferralConfig };
