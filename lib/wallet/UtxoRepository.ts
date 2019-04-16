import { Op } from 'sequelize';
import Utxo from '../db/models/Utxo';

class UtxoRepository {
  constructor() {}

  public getUtxos = async (currency: string) => {
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

  public getUtxosSorted = async (currency: string) => {
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

  public getUnconfirmedUtxos = async (currency: string) => {
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

  public getUtxo = async (txHash: string, vout: number) => {
    return Utxo.findOne({
      where: {
        txHash: {
          [Op.eq]: txHash,
        },
        vout: {
          [Op.eq]: vout,
        },
      },
    });
  }

  public addUtxo = async (utxo: {
    outputId: number,
    currency: string,

    txHash: string,
    vout: number,
    value: number,

    confirmed: boolean,
    spent: boolean,
  }) => {
    return Utxo.create(utxo);
  }

  public markUtxoSpent = async (id: number) => {
    const existing = await Utxo.findOne({
      where: {
        id: {
          [Op.eq]: id,
        },
      },
    });

    return existing.update({
      spent: true,
    });
  }
}

export default UtxoRepository;
