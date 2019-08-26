import { Error } from '../consts/Types';
import { concatErrorCode } from '../Utils';
import { ErrorCodePrefix } from '../consts/Enums';

export default {
  BACKUP_DISABLED: (): Error => ({
    message: 'backups are disabled beacuse of incomplete configuration',
    code: concatErrorCode(ErrorCodePrefix.Bakcup, 0),
  }),
};
