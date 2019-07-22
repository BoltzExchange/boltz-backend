import { Error } from '../consts/Types';
import { ErrorCodePrefix } from '../consts/Enums';
import { concatErrorCode } from '../Utils';

export default {
  CURRENCY_NOT_FOUND: (currency: string): Error => ({
    message: `could not find currency ${currency}`,
    code: concatErrorCode(ErrorCodePrefix.Service, 0),
  }),
  ORDER_SIDE_NOT_FOUND: (side: string): Error => ({
    message: `could not find order side: ${side}`,
    code: concatErrorCode(ErrorCodePrefix.Service, 1),
  }),
  SWAP_NOT_FOUND: (swapIdentifier: string): Error => ({
    message: `could not find swap with identifier: ${swapIdentifier}`,
    code: concatErrorCode(ErrorCodePrefix.Service, 2),
  }),
  SCRIPT_TYPE_NOT_FOUND: (scriptType: string): Error => ({
    message: `could not find script type of address: ${scriptType}`,
    code: concatErrorCode(ErrorCodePrefix.Service, 3),
  }),
  PAIR_NOT_FOUND: (pairId: string): Error => ({
    message: `could not find pair with id: ${pairId}`,
    code: concatErrorCode(ErrorCodePrefix.Service, 4),
  }),
  SWAP_WITH_INVOICE_EXISTS: (): Error => ({
    message: 'a swap with this invoice exists already',
    code: concatErrorCode(ErrorCodePrefix.Service, 5),
  }),
  EXCEED_MAXIMAL_AMOUNT: (amount: number, maximalAmount: number) => ({
    message: `${amount} is more than maximal ${maximalAmount}`,
    code: concatErrorCode(ErrorCodePrefix.Service, 6),
  }),
  BENEATH_MINIMAL_AMOUNT: (amount: number, minimalAmount: number) => ({
    message: `${amount} is less than minimal ${minimalAmount}`,
    code: concatErrorCode(ErrorCodePrefix.Service, 7),
  }),
  REVERSE_SWAPS_DISABLED: (): Error => ({
    message: 'reverse swaps are disabled',
    code: concatErrorCode(ErrorCodePrefix.Service, 8),
  }),
  AMOUNT_TOO_LOW: (): Error => ({
    message: 'onchain amount is too low',
    code: concatErrorCode(ErrorCodePrefix.Service, 9),
  }),
  INVOICE_COULD_NOT_BE_PAID: (): Error => ({
    message: 'invoice could not be paid',
    code: concatErrorCode(ErrorCodePrefix.Service, 10),
  }),
  ONCHAIN_HTLC_TIMED_OUT: (): Error => ({
    message: 'onchain HTLC timed out',
    code: concatErrorCode(ErrorCodePrefix.Service, 11),
  }),
};
