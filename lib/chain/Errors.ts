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
  NO_BLOCK_FALLBACK: (symbol: string): Error => ({
    message: `could not fall back to ${symbol} pubhashblock ZMQ filter because it is not enabled`,
    code: concatErrorCode(ErrorCodePrefix.Chain, 3),
  }),
};
