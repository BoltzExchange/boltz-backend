import { Error } from '../../consts/Types';
import { concatErrorCode } from '../../Utils';
import { ErrorCodePrefix } from '../../consts/Enums';

export default {
  NO_LOCKUP_FOUND: (): Error => ({
    message: 'no lockup transaction found',
    code: concatErrorCode(ErrorCodePrefix.Ethereum, 0),
  }),
  INVALID_LOCKUP_TRANSACTION: (transactionHash: string): Error => ({
    message: `lockup transaction is invalid: ${transactionHash}`,
    code: concatErrorCode(ErrorCodePrefix.Ethereum, 1),
  }),
};
