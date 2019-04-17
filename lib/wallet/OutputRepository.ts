import { Op } from 'sequelize';
import Output from '../db/models/Output';

class OutputRepository {
  constructor() {}

  public getOutputs = async (currency: string) => {
    return Output.findAll({
      where: {
        currency: {
          [Op.eq]: currency,
        },
      },
    });
  }

  public addOutput = async (output: {
    script: string,
    redeemScript: string | null,

    currency: string,
    keyIndex: number,

    type: number }) => {

    return Output.create(output);
  }
}

export default OutputRepository;
