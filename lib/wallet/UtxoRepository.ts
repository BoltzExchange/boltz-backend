import { Models } from '../db/Database';
import * as db from '../consts/Database';

class UtxoRepository {
  constructor(private models: Models) {}

  public getUtxos = async (currency: string) => {
    return this.models.Utxo.findAll({
      where: {
        currency,
      },
    });
  }

  public getUtxosSorted = async (currency: string) => {
    return this.models.Utxo.findAll({
      where: {
        currency,
      },
      order: [
        ['value', 'DESC'],
        ['confirmed', 'DESC'],
      ],
    });
  }

  public getUtxo = async (txHash: string) => {
    return this.models.Utxo.findAll({
      where: {
        txHash,
      },
    });
  }

  /**
   * Creates a new or updates an existing UTXO
   */
  public upsertUtxo = async (utxo: db.UtxoFactory) => {
    const existing = await this.models.Utxo.findOne({
      where: {
        txHash: utxo.txHash,
      },
    });

    if (existing) {
      return existing.update(utxo);
    } else {
      return this.addUtxo(utxo);
    }
  }

  public addUtxo = async (utxo: db.UtxoFactory) => {
    return this.models.Utxo.create(utxo);
  }

  public removeUtxo = async (txHash: string) => {
    return this.models.Utxo.destroy({
      where: {
        txHash,
      },
    });
  }
}

export default UtxoRepository;
