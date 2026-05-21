import { Op } from 'sequelize';
import JwtToken from '../models/JwtToken';

type IssueParams = {
  label: string;
  allowedMethods: string[];
  issuedAt: Date;
  expiresAt?: Date | null;
};

class JwtTokenRepository {
  public static getActive = (id: string): Promise<JwtToken | null> => {
    return JwtToken.findOne({
      where: {
        id,
        revokedAt: null,
        [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gt]: new Date() } }],
      },
    });
  };

  public static get = (id: string): Promise<JwtToken | null> => {
    return JwtToken.findOne({ where: { id } });
  };

  public static issue = (params: IssueParams): Promise<JwtToken> => {
    return JwtToken.create({
      label: params.label,
      allowedMethods: params.allowedMethods,
      issuedAt: params.issuedAt,
      expiresAt: params.expiresAt ?? null,
      revokedAt: null,
    });
  };

  public static revoke = async (id: string): Promise<JwtToken | null> => {
    const token = await JwtToken.findOne({ where: { id } });
    if (token === null) {
      return null;
    }

    if (token.revokedAt !== null) {
      return token;
    }

    return token.update({ revokedAt: new Date() });
  };

  public static list = (): Promise<JwtToken[]> => {
    return JwtToken.findAll({ order: [['issuedAt', 'DESC']] });
  };
}

export default JwtTokenRepository;
