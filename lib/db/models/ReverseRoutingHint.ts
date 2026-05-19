import type { Network as LiquidNetwork } from 'liquidjs-lib/src/networks';
import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import { addressFromOutputScript } from '../../AddressUtils';
import type { BitcoinNetwork } from '../../consts/BitcoinNetworks';
import type { CurrencyType } from '../../consts/Enums';
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
  declare swapId: string;

  declare symbol: string;
  declare scriptPubkey: Buffer;
  declare blindingPubkey?: Buffer;
  declare params?: string;
  declare signature: Buffer;

  public address = (
    type: CurrencyType,
    network: BitcoinNetwork | LiquidNetwork,
  ) => {
    return addressFromOutputScript(
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
