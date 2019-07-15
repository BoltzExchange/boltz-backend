import { Op } from 'sequelize';
import Output, { OutputType } from '../db/models/Output';

class OutputRepository {
  constructor() {}

  public getOutputs = async (currency: string): Promise<Output[]> => {
    return Output.findAll({
      where: {
        currency: {
          [Op.eq]: currency,
        },
      },
    });
  }

  public addOutput = async (output: OutputType) => {
    return Output.create(output);
  }
}

export default OutputRepository;
