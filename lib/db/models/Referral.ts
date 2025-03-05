import { DataTypes, Model, Sequelize } from 'sequelize';
import { OrderSide, SwapType } from '../../consts/Enums';

type Limits = {
  minimal?: number;
  maximal?: number;
};

type DirectionalPremium = {
  [OrderSide.BUY]: number;
  [OrderSide.SELL]: number;
};

type Premiums = Partial<{
  [SwapType.Submarine]: number;
  [SwapType.ReverseSubmarine]: number;
  [SwapType.Chain]: DirectionalPremium;
}>;

type LimitsPerType = Partial<Record<SwapType, Limits>>;

// Implemented only for submarine swaps
// Expiration in seconds
type CustomExpirations = Partial<Record<SwapType, number>>;

type ReferralPairConfig = {
  maxRoutingFee?: number;

  limits?: LimitsPerType;
  premiums?: Premiums;
  expirations?: CustomExpirations;
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

  public premium = (
    pair: string,
    type: SwapType,
    orderSide: OrderSide,
  ): number | undefined => {
    const premium =
      this.config?.pairs?.[pair]?.premiums?.[type] ||
      this.config?.premiums?.[type];

    if (type === SwapType.Chain) {
      return premium !== undefined ? premium[orderSide] : undefined;
    }

    return premium as number | undefined;
  };

  public premiumForPairs = (
    pairs: string[],
    type: SwapType,
    orderSide?: OrderSide,
  ): number | undefined => {
    if (type === SwapType.Chain && orderSide === undefined) {
      throw new Error('chain swap premiums require an order side');
    }

    for (const pair of pairs) {
      const premium = this.config?.pairs?.[pair]?.premiums?.[type];
      if (premium !== undefined) {
        if (type === SwapType.Chain) {
          return premium[orderSide!];
        }
        return premium as number | undefined;
      }
    }

    const premium = this.config?.premiums?.[type];
    if (type === SwapType.Chain && premium !== undefined) {
      return premium[orderSide!];
    }

    return premium as number | undefined;
  };
}

export default Referral;
export {
  ReferralType,
  ReferralConfig,
  ReferralPairConfig,
  DirectionalPremium,
  Premiums,
};
