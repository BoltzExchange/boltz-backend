import { Error } from '../consts/Types';
import { concatErrorCode } from '../Utils';
import { ErrorCodePrefix } from '../consts/Enums';

export default {
  BACKUP_DISABLED: (): Error => ({
    message: 'backups are disabled because of incomplete configuration',
    code: concatErrorCode(ErrorCodePrefix.Backup, 0),
  }),
};
