import { Error } from '../consts/Types';
import { concatErrorCode } from '../Utils';
import { ErrorCodePrefix } from '../consts/Enums';

export default {
  COULD_NOT_FIND_RATE: (pair: string): Error => ({
    message: `could not find rate of pair: ${pair}`,
    code: concatErrorCode(ErrorCodePrefix.Rates, 0),
  }),
  CONFIGURATION_INCOMPLETE: (symbol: string, missingValue: string): Error => ({
    message: `could not init currency ${symbol} because of missing config value: ${missingValue}`,
    code: concatErrorCode(ErrorCodePrefix.Rates, 1),
  }),
};
