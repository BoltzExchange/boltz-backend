import { Error } from '../consts/Types';
import { concatErrorCode } from '../Utils';
import { ErrorCodePrefix } from '../consts/Enums';

export default {
  CURRENCY_NOT_FOUND: (currency: string): Error => ({
    message: `could not find currency: ${currency}`,
    code: concatErrorCode(ErrorCodePrefix.Swap, 0),
  }),
  NO_ROUTE_FOUND: (): Error => ({
    message: 'could not find route to pay invoice',
    code: concatErrorCode(ErrorCodePrefix.Swap, 1),
  }),
  AMOUNT_TOO_LOW: (): Error => ({
    message: 'onchain amount is too low',
    code: concatErrorCode(ErrorCodePrefix.Swap, 2),
  }),
};
