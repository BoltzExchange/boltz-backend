import { concatErrorCode } from '../Utils';
import { ErrorCodePrefix } from './Enums';
import { Error } from './Types';

export default {
  IS_DISCONNECTED: (clientName: string): Error => ({
    message: `${clientName} is disconnected`,
    code: concatErrorCode(ErrorCodePrefix.General, 1),
  }),
  COULD_NOT_PARSE_CONFIG: (filename: string, error: string): Error => ({
    message: `could not parse ${filename} config: ${error}`,
    code: concatErrorCode(ErrorCodePrefix.General, 2),
  }),
};
