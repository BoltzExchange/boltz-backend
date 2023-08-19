import { Error } from '../consts/Types';
import { ErrorCodePrefix } from '../consts/Enums';
import { concatErrorCode } from '../Utils';

export default {
  COULD_NOT_FIND_FILES: (symbol: string, service: string): Error => ({
    message: `could not find required files for ${symbol} ${service}`,
    code: concatErrorCode(ErrorCodePrefix.Lightning, 0),
  }),
  INVOICE_NOT_FOUND: (): Error => ({
    message: 'hold invoice not found',
    code: concatErrorCode(ErrorCodePrefix.Lightning, 1),
  }),
  NO_ROUTE: (): Error => ({
    message: 'no route found',
    code: concatErrorCode(ErrorCodePrefix.Lightning, 2),
  }),
};
