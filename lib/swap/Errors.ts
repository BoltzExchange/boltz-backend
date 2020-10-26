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
    message: `the preimage hash of the invoice does not match the one of the Swap: ${preimageHash}`,
    code: concatErrorCode(ErrorCodePrefix.Swap, 3),
  }),
  INVOICE_EXPIRES_TOO_EARLY: (invoiceExpiry: number, timeoutTimestamp: number): Error => ({
    message: `invoice expiry ${invoiceExpiry} is before Swap timeout: ${timeoutTimestamp}`,
    code: concatErrorCode(ErrorCodePrefix.Swap, 4),
  }),
  COINS_COULD_NOT_BE_SENT: (): Error => ({
    message: 'onchain coins could not be sent',
    code: concatErrorCode(ErrorCodePrefix.Swap, 5),
  }),
  INSUFFICIENT_AMOUNT: (actualAmount: number, expectedAmount: number): Error => ({
    message: `locked ${actualAmount} is less than expected ${expectedAmount}`,
    code: concatErrorCode(ErrorCodePrefix.Swap, 6),
  }),
  INVALID_TOKEN_LOCKED: (actualToken: string, expectedToken: string): Error => ({
    message: `the locked token ${actualToken} is not expected ${expectedToken}`,
    code: concatErrorCode(ErrorCodePrefix.Swap, 7),
  }),
  INVALID_CLAIM_ADDRESS: (actualAddress: string, expectedAddress: string): Error => ({
    message: `the specified claim address ${actualAddress} is not expected ${expectedAddress}`,
    code: concatErrorCode(ErrorCodePrefix.Swap, 8),
  }),
  INVALID_TIMELOCK: (actualTimelock: number, expectedTimelock: number): Error => ({
    message: `the specified timelock ${actualTimelock} is not expected ${expectedTimelock}`,
    code: concatErrorCode(ErrorCodePrefix.Swap, 9),
  }),
  INVOICE_COULD_NOT_BE_PAID: (): Error => ({
    message: 'invoice could not be paid',
    code: concatErrorCode(ErrorCodePrefix.Swap, 10),
  }),
  REFUNDED_COINS: (refundedTransactionId: string): Error => ({
    message: `refunded onchain coins: ${refundedTransactionId}`,
    code: concatErrorCode(ErrorCodePrefix.Swap, 11),
  }),
  ONCHAIN_HTLC_TIMED_OUT: (): Error => ({
    message: 'onchain HTLC timed out',
    code: concatErrorCode(ErrorCodePrefix.Swap, 12),
  }),
  INVOICE_EXPIRED_ALREADY: (): Error => ({
    message: 'the provided invoice expired already',
    code: concatErrorCode(ErrorCodePrefix.Swap, 13),
  }),
};
