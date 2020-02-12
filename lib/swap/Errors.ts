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
  NO_LND_CLIENT: (symbol: string): Error => ({
    message: `${symbol} has no LND client`,
    code: concatErrorCode(ErrorCodePrefix.Swap, 2),
  }),
  INVOICE_INVALID_PREIMAGE_HASH: (preimageHash: string): Error => ({
    message: `the preimage hash of the invoice does not match: ${preimageHash}`,
    code: concatErrorCode(ErrorCodePrefix.Service, 3),
  }),
};
