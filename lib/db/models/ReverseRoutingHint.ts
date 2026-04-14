import type { Network } from 'bitcoinjs-lib';
import type { Network as LiquidNetwork } from 'liquidjs-lib/src/networks';
import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import { fromOutputScript } from '../../Core';
import { CurrencyType } from '../../consts/Enums';
import ReverseSwap from './ReverseSwap';

type ReverseRoutingHintsType = {
  swapId: string;
  symbol: string;
  address?: string;
  scriptPubkey?: Buffer;
  blindingPubkey?: Buffer;
  params?: string;
  signature: Buffer;
};

class ReverseRoutingHint extends Model {
  declare swapId: string;

  declare symbol: string;
  declare address?: string;
  declare scriptPubkey?: Buffer;
  declare blindingPubkey?: Buffer;
  declare params?: string;
  declare signature: Buffer;

  public getAddress = (
    type: CurrencyType,
    network?: Network | LiquidNetwork,
  ) => {
    if (type === CurrencyType.Ark) {
      if (this.address === undefined || this.address === null) {
        throw new Error('reverse routing hint address missing');
      }

      return this.address;
    }

    if (this.scriptPubkey === undefined || this.scriptPubkey === null) {
      throw new Error('reverse routing hint script pubkey missing');
    }
    if (network === undefined) {
      throw new Error('reverse routing hint network missing');
    }

    return fromOutputScript(
      type,
      this.scriptPubkey,
      network,
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
        address: { type: new DataTypes.TEXT(), allowNull: true },
        scriptPubkey: { type: new DataTypes.BLOB(), allowNull: true },
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
