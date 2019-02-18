import { Models } from '../db/Database';
import * as db from '../consts/Database';

class UtxoRepository {
  constructor(private models: Models) {}

  public getUtxos = async (currency: string) => {
    return this.models.Utxo.findAll({
      where: {
        currency,
        spent: false,
      },
    });
  }

  public getUtxosSorted = async (currency: string) => {
    return this.models.Utxo.findAll({
      where: {
        currency,
        spent: false,
      },
      order: [
        ['confirmed', 'DESC'],
        ['value', 'DESC'],
      ],
    });
  }

  public getUnconfirmedUtxos = async (currency: string) => {
    return this.models.Utxo.findAll({
      where: {
        currency,
        confirmed: false,
      },
    });
  }

  public getUtxo = async (txHash: string, vout: number) => {
    return this.models.Utxo.findOne({
      where: {
        vout,
        txHash,
      },
    });
  }

  public addUtxo = async (utxo: db.UtxoFactory) => {
    return this.models.Utxo.create(<db.UtxoAttributes>utxo);
  }

  public markUtxoSpent = async (id: number) => {
    const existing = await this.models.Utxo.findOne({
      where: {
        id,
      },
    });

    return existing!.update({
      spent: true,
    });
  }
}

export default UtxoRepository;
