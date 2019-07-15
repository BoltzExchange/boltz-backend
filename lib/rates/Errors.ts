import { Error } from '../consts/Types';
import { concatErrorCode } from '../Utils';
import { ErrorCodePrefix } from '../consts/Enums';

export default {
  COULD_NOT_GET_RATE: (error: string): Error => ({
    message: `could not get rate: ${error}`,
    code: concatErrorCode(ErrorCodePrefix.Rates, 0),
  }),
};
