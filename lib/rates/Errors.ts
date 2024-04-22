import { concatErrorCode } from '../Utils';
import { ErrorCodePrefix } from '../consts/Enums';
import { Error } from '../consts/Types';

export default {
  COULD_NOT_FIND_RATE: (pair: string): Error => ({
    message: `could not find rate of pair: ${pair}`,
    code: concatErrorCode(ErrorCodePrefix.Rates, 0),
  }),
  CONFIGURATION_INCOMPLETE: (symbol: string, missingValue: string): Error => ({
    message: `could not init currency ${symbol} because of missing config value: ${missingValue}`,
    code: concatErrorCode(ErrorCodePrefix.Rates, 1),
  }),
  SYMBOL_LOCKUPS_NOT_BEING_TRACKED: (symbol: string): Error => ({
    message: `${symbol} lockup transactions are not being tracked`,
    code: concatErrorCode(ErrorCodePrefix.Rates, 2),
  }),
};
