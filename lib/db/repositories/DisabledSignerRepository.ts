import { Op } from 'sequelize';
import DisabledSigner from '../models/DisabledSigner';

class DisabledSignerRepository {
  public static getDisabledSigners = async (): Promise<string[]> => {
    const disabledSigners = await DisabledSigner.findAll({
      attributes: ['signer'],
    });

    return disabledSigners.map(({ signer }) => signer);
  };

  public static addSigners = async (signers: string[]): Promise<void> => {
    if (signers.length === 0) {
      return;
    }

    await DisabledSigner.bulkCreate(
      signers.map((signer) => ({ signer })),
      { ignoreDuplicates: true },
    );
  };

  public static removeSigners = async (signers: string[]): Promise<void> => {
    if (signers.length === 0) {
      return;
    }

    await DisabledSigner.destroy({
      where: {
        signer: {
          [Op.in]: signers,
        },
      },
    });
  };
}

export default DisabledSignerRepository;
