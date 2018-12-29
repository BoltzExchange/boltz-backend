import { Error } from '../consts/Types';
import { ErrorCodePrefix } from '../consts/Enums';
import { concatErrorCode } from '../Utils';

export default {
  COULD_NOT_FIND_FILES: (chainType: string): Error => ({
    message: `could not find required files for ${chainType} LND`,
    code: concatErrorCode(ErrorCodePrefix.Lnd, 0),
  }),
};
