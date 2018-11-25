import { Error } from '../consts/Types';
import { ErrorCodePrefix } from '../consts/Enums';
import { concatErrorCode } from '../Utils';

export default {
  PAIR_NOT_FOUND: (pairId: string): Error => ({
    message: `could not find pair ${pairId}`,
    code: concatErrorCode(ErrorCodePrefix.Swap, 0),
  }),
};
