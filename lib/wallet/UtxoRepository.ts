import { Op } from 'sequelize';
import Utxo, { UtxoType } from '../db/models/Utxo';

class UtxoRepository {
  constructor() {}

  public getUtxos = async (currency: string): Promise<Utxo[]> => {
    return Utxo.findAll({
      where: {
        currency: {
          [Op.eq]: currency,
        },
        spent: {
          [Op.eq]: false,
        },
      },
    });
  }

  public getUtxosSorted = async (currency: string): Promise<Utxo[]> => {
    return Utxo.findAll({
      where: {
        currency: {
          [Op.eq]: currency,
        },
        spent: {
          [Op.eq]: false,
        },
      },
      order: [
        ['confirmed', 'DESC'],
        ['value', 'DESC'],
      ],
    });
  }

  public getUnconfirmedUtxos = async (currency: string): Promise<Utxo[]> => {
    return Utxo.findAll({
      where: {
        currency: {
          [Op.eq]: currency,
        },
        confirmed: {
          [Op.eq]: false,
        },
      },
    });
  }

  public getUtxo = async (txId: string, vout: number): Promise<Utxo> => {
    return Utxo.findOne({
      where: {
        txId: {
          [Op.eq]: txId,
        },
        vout: {
          [Op.eq]: vout,
        },
      },
    });
  }

  public addUtxo = async (utxo: UtxoType) => {
    return Utxo.create(utxo);
  }

  public markUtxoSpent = async (id: number) => {
    return Utxo.update({
      spent: true,
    }, {
      where: {
        id: {
          [Op.eq]: id,
        },
      },
    });
  }
}

export default UtxoRepository;
