import { Error } from '../consts/Types';
import { concatErrorCode } from '../Utils';
import { ErrorCodePrefix } from '../consts/Enums';

export default {
  NO_RAWTX: (): Error => ({
    message: 'pubrawtx ZMQ notifications are not enabled',
    code: concatErrorCode(ErrorCodePrefix.Chain, 1),
  }),
  NO_BLOCK_NOTIFICATIONS: (): Error => ({
    message: 'no ZMQ block notifications are enabled',
    code: concatErrorCode(ErrorCodePrefix.Chain, 2),
  }),
  NO_BLOCK_FALLBACK: (): Error => ({
    message: 'could not fall back to pubhashblock ZMQ filter because it is not enabled',
    code: concatErrorCode(ErrorCodePrefix.Chain, 3),
  }),
  INVALID_COOKIE_FILE: (path: string): Error => ({
    message: `invalid cookie authentication file: ${path}`,
    code: concatErrorCode(ErrorCodePrefix.Chain, 4),
  }),
};
