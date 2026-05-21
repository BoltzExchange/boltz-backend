import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';

type JwtTokenType = {
  id: string;
  label: string;
  allowedMethods: string[];
  issuedAt: Date;
  expiresAt?: Date | null;
  revokedAt?: Date | null;
};

class JwtToken extends Model implements JwtTokenType {
  public static readonly tableName = 'jwt_tokens';

  declare id: string;
  declare label: string;
  declare allowedMethods: string[];
  declare issuedAt: Date;
  declare expiresAt: Date | null;
  declare revokedAt: Date | null;

  public static load = (sequelize: Sequelize): void => {
    // Postgres (prod target) gets a real TEXT[]; SQLite (tests-only) falls back
    // to JSON because it has no array type. Sequelize returns string[] either way
    const allowedMethodsType =
      sequelize.getDialect() === 'postgres'
        ? DataTypes.ARRAY(new DataTypes.STRING(255))
        : new DataTypes.JSON();

    JwtToken.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        label: { type: new DataTypes.STRING(255), allowNull: false },
        allowedMethods: {
          type: allowedMethodsType,
          allowNull: false,
          field: 'allowed_methods',
        },
        issuedAt: {
          type: new DataTypes.DATE(),
          allowNull: false,
          field: 'issued_at',
        },
        expiresAt: {
          type: new DataTypes.DATE(),
          allowNull: true,
          field: 'expires_at',
        },
        revokedAt: {
          type: new DataTypes.DATE(),
          allowNull: true,
          field: 'revoked_at',
        },
      },
      {
        sequelize,
        tableName: JwtToken.tableName,
        timestamps: false,
      },
    );
  };
}

export default JwtToken;
export { JwtTokenType };
