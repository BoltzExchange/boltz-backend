import { Models } from '../db/Database';
import * as db from '../consts/Database';

class OutputRepository {
  constructor(private models: Models) {}

  public getOutputs = async (currency: string) => {
    return this.models.Output.findAll({
      where: {
        currency,
      },
    });
  }

  public addOutput = async (output: db.OutputFactory) => {
    return this.models.Output.create(<db.OutputAttributes>output);
  }
}

export default OutputRepository;
