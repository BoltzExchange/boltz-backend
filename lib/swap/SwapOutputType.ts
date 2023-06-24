import { OutputType } from 'boltz-core';
import { CurrencyType } from '../consts/Enums';

class SwapOutputType {
  constructor(private defaultType: OutputType) {}

  public get = (type: CurrencyType): OutputType => {
    if (type === CurrencyType.Liquid) {
      return OutputType.Bech32;
    }

    return this.defaultType;
  };
}

export default SwapOutputType;
