import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import { fromOutputScript } from '../../Core';
import type { Currency } from '../../wallet/WalletManager';
import ReverseSwap from './ReverseSwap';

type ReverseRoutingHintsType = {
  swapId: string;
  symbol: string;
  scriptPubkey: Buffer;
  blindingPubkey?: Buffer;
  params?: string;
  signature: Buffer;
};

class ReverseRoutingHint extends Model {
  public swapId!: string;

  public symbol!: string;
  public scriptPubkey!: Buffer;
  public blindingPubkey?: Buffer;
  public params?: string;
  public signature!: Buffer;

  public address = (currencies: Map<string, Currency>) => {
    const currency = currencies.get(this.symbol);
    if (currency === undefined) {
      throw new Error(`Currency ${this.symbol} not found`);
    }
    return fromOutputScript(
      currency.type,
      this.scriptPubkey,
      currency.network!,
      this.blindingPubkey,
    );
  };

  public static load = (sequelize: Sequelize) => {
    ReverseRoutingHint.init(
      {
        swapId: {
          type: new DataTypes.STRING(255),
          primaryKey: true,
          allowNull: false,
        },
        symbol: { type: new DataTypes.TEXT(), allowNull: false },
        scriptPubkey: { type: new DataTypes.BLOB(), allowNull: false },
        blindingPubkey: { type: new DataTypes.BLOB(), allowNull: true },
        params: { type: new DataTypes.TEXT(), allowNull: true },
        signature: { type: new DataTypes.BLOB(), allowNull: false },
      },
      {
        sequelize,
        tableName: 'reverseRoutingHints',
        indexes: [
          {
            fields: ['scriptPubkey'],
            name: 'reverseRoutingHints_scriptPubkey',
            using: 'HASH',
          },
        ],
      },
    );

    ReverseRoutingHint.belongsTo(ReverseSwap, {
      foreignKey: 'swapId',
    });
  };
}

export default ReverseRoutingHint;
export { ReverseRoutingHintsType };
