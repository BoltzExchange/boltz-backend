import type Swap from '../../../db/models/Swap';
import type { ChainSwapInfo } from '../../../db/repositories/ChainSwapRepository';

abstract class SweepTrigger {
  public abstract check(
    chainCurrency: string,
    swap: Swap | ChainSwapInfo,
  ): Promise<boolean>;
}

export default SweepTrigger;
