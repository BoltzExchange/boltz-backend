import { concatErrorCode } from '../Utils';
import { ErrorCodePrefix } from '../consts/Enums';
import type { Error } from '../consts/Types';

export default {
  CURRENCY_NOT_FOUND: (currency: string): Error => ({
    message: `could not find currency: ${currency}`,
    code: concatErrorCode(ErrorCodePrefix.Swap, 0),
  }),
  NO_ROUTE_FOUND: (): Error => ({
    message: 'could not find route to pay invoice',
    code: concatErrorCode(ErrorCodePrefix.Swap, 1),
  }),
  NO_LIGHTNING_SUPPORT: (symbol: string): Error => ({
    message: `${symbol} has no lightning support`,
    code: concatErrorCode(ErrorCodePrefix.Swap, 2),
  }),
  INVOICE_INVALID_PREIMAGE_HASH: (preimageHash: string): Error => ({
    message: `the preimage hash of the invoice does not match the one of the Swap: ${preimageHash}`,
    code: concatErrorCode(ErrorCodePrefix.Swap, 3),
  }),
  INVOICE_EXPIRES_TOO_EARLY: (
    invoiceExpiry: number,
    timeoutTimestamp: number,
  ): Error => ({
    message: `invoice expiry ${invoiceExpiry} is before Swap timeout: ${timeoutTimestamp}`,
    code: concatErrorCode(ErrorCodePrefix.Swap, 4),
  }),
  COINS_COULD_NOT_BE_SENT: (): Error => ({
    message: 'onchain coins could not be sent',
    code: concatErrorCode(ErrorCodePrefix.Swap, 5),
  }),
  INSUFFICIENT_AMOUNT: (
    actualAmount: number,
    expectedAmount: number,
  ): Error => ({
    message: `locked ${actualAmount} is less than expected ${expectedAmount}`,
    code: concatErrorCode(ErrorCodePrefix.Swap, 6),
  }),
  INVALID_TOKEN_LOCKED: (
    actualToken: string,
    expectedToken: string,
  ): Error => ({
    message: `the locked token ${actualToken} is not expected ${expectedToken}`,
    code: concatErrorCode(ErrorCodePrefix.Swap, 7),
  }),
  INVALID_CLAIM_ADDRESS: (
    actualAddress: string,
    expectedAddress: string,
  ): Error => ({
    message: `the specified claim address ${actualAddress} is not expected ${expectedAddress}`,
    code: concatErrorCode(ErrorCodePrefix.Swap, 8),
  }),
  INVALID_TIMELOCK: (
    actualTimelock: number,
    expectedTimelock: number,
  ): Error => ({
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
  SWAP_DOES_NOT_ACCEPT_ZERO_CONF: (): Error => ({
    message: 'Swap does not accept 0-conf',
    code: concatErrorCode(ErrorCodePrefix.Swap, 14),
  }),
  LOCKUP_TRANSACTION_SIGNALS_RBF: (): Error => ({
    message: 'transaction or one of its unconfirmed ancestors signals RBF',
    code: concatErrorCode(ErrorCodePrefix.Swap, 15),
  }),
  LOCKUP_TRANSACTION_FEE_TOO_LOW: (): Error => ({
    message: 'transaction fee is too low',
    code: concatErrorCode(ErrorCodePrefix.Swap, 16),
  }),
  LIGHTNING_CLIENT_CALL_TIMEOUT: (): Error => ({
    message: 'lightning client call timeout',
    code: concatErrorCode(ErrorCodePrefix.Swap, 17),
  }),
  NO_AVAILABLE_LIGHTNING_CLIENT: (): Error => ({
    message: 'no available lightning client',
    code: concatErrorCode(ErrorCodePrefix.Swap, 18),
  }),
  INVALID_ADDRESS: (): Error => ({
    message: 'invalid address',
    code: concatErrorCode(ErrorCodePrefix.Swap, 19),
  }),
  BLOCKED_ADDRESS: (): Error => ({
    message: 'blocked address',
    code: concatErrorCode(ErrorCodePrefix.Swap, 20),
  }),
  INVALID_ADDRESS_SIGNATURE: (): Error => ({
    message: 'invalid address signature',
    code: concatErrorCode(ErrorCodePrefix.Swap, 21),
  }),
  INVALID_INVOICE_MEMO: (): Error => ({
    message: 'invalid invoice memo',
    code: concatErrorCode(ErrorCodePrefix.Swap, 22),
  }),
  OVERPAID_AMOUNT: (actualAmount: number, expectedAmount: number): Error => ({
    message: `locked ${actualAmount} is more than expected ${expectedAmount}`,
    code: concatErrorCode(ErrorCodePrefix.Swap, 23),
  }),
  INVALID_DESCRIPTION_HASH: (): Error => ({
    message: 'invalid description hash',
    code: concatErrorCode(ErrorCodePrefix.Swap, 24),
  }),
  INVALID_INVOICE_EXPIRY: (): Error => ({
    message: 'invalid invoice expiry',
    code: concatErrorCode(ErrorCodePrefix.Swap, 25),
  }),
  NO_OFFERS_ALLOWED: (): Error => ({
    message: 'no offers allowed',
    code: concatErrorCode(ErrorCodePrefix.Swap, 26),
  }),
  HOOK_REJECTED: (): Error => ({
    message: 'rejected',
    code: concatErrorCode(ErrorCodePrefix.Swap, 27),
  }),
  MAGIC_ROUTING_HINT_MISSING: (): Error => ({
    message: 'magic routing hint missing from invoice',
    code: concatErrorCode(ErrorCodePrefix.Swap, 28),
  }),
  PAYEE_MISSING_FROM_INVOICE: (): Error => ({
    message: 'payee missing from invoice',
    code: concatErrorCode(ErrorCodePrefix.Swap, 29),
  }),
};
