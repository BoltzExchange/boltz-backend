import { concatErrorCode } from '../Utils';
import { ErrorCodePrefix } from '../consts/Enums';
import { Error } from '../consts/Types';

export default {
  CURRENCY_NOT_FOUND: (currency: string): Error => ({
    message: `could not find currency: ${currency}`,
    code: concatErrorCode(ErrorCodePrefix.Service, 0),
  }),
  ORDER_SIDE_NOT_FOUND: (side: string): Error => ({
    message: `could not find order side: ${side}`,
    code: concatErrorCode(ErrorCodePrefix.Service, 1),
  }),
  SWAP_NOT_FOUND: (id: string): Error => ({
    message: `could not find swap with id: ${id}`,
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
  EXCEED_MAXIMAL_AMOUNT: (amount: number, maximalAmount: number): Error => ({
    message: `${amount} is exceeds maximal of ${maximalAmount}`,
    code: concatErrorCode(ErrorCodePrefix.Service, 6),
  }),
  BENEATH_MINIMAL_AMOUNT: (amount: number, minimalAmount: number): Error => ({
    message: `${amount} is less than minimal of ${minimalAmount}`,
    code: concatErrorCode(ErrorCodePrefix.Service, 7),
  }),
  REVERSE_SWAPS_DISABLED: (): Error => ({
    message: 'reverse swaps are disabled',
    code: concatErrorCode(ErrorCodePrefix.Service, 8),
  }),
  ONCHAIN_AMOUNT_TOO_LOW: (): Error => ({
    message: 'onchain amount is too low',
    code: concatErrorCode(ErrorCodePrefix.Service, 9),
  }),
  BLOCK_TIME_NOT_FOUND: (symbol: string): Error => ({
    message: `could not find block time of currency: ${symbol}`,
    code: concatErrorCode(ErrorCodePrefix.Service, 12),
  }),
  INVALID_TIMEOUT_BLOCK_DELTA: (): Error => ({
    message: 'invalid timeout block delta',
    code: concatErrorCode(ErrorCodePrefix.Service, 13),
  }),
  NO_TIMEOUT_DELTA: (pairId: string): Error => ({
    message: `could not find timeout delta of pair: ${pairId}`,
    code: concatErrorCode(ErrorCodePrefix.Service, 14),
  }),
  SWAP_WITH_PREIMAGE_EXISTS: (): Error => ({
    message: 'a swap with this preimage hash exists already',
    code: concatErrorCode(ErrorCodePrefix.Service, 17),
  }),
  SWAP_HAS_INVOICE_ALREADY: (id: string): Error => ({
    message: `swap ${id} has an invoice already`,
    code: concatErrorCode(ErrorCodePrefix.Service, 18),
  }),
  SWAP_NO_LOCKUP: (): Error => ({
    message: 'no coins were locked up yet',
    code: concatErrorCode(ErrorCodePrefix.Service, 20),
  }),
  INVALID_INVOICE_AMOUNT: (maxInvoiceAmount: number): Error => ({
    message: `invoice amount exceeds the maximal of ${maxInvoiceAmount}`,
    code: concatErrorCode(ErrorCodePrefix.Service, 21),
  }),
  EXCEEDS_MAX_INBOUND_LIQUIDITY: (
    inboundLiquidity: number,
    maxInboundLiquidity: number,
  ): Error => ({
    message: `inbound liquidity ${inboundLiquidity} exceeds maximal ${maxInboundLiquidity}`,
    code: concatErrorCode(ErrorCodePrefix.Service, 22),
  }),
  BENEATH_MIN_INBOUND_LIQUIDITY: (
    inboundLiquidity: number,
    minInboundLiquidity: number,
  ): Error => ({
    message: `inbound liquidity ${inboundLiquidity} is less than minimal ${minInboundLiquidity}`,
    code: concatErrorCode(ErrorCodePrefix.Service, 23),
  }),
  NOT_SUPPORTED_BY_SYMBOL: (symbol: string): Error => ({
    message: `this action is not supported by ${symbol}`,
    code: concatErrorCode(ErrorCodePrefix.Service, 24),
  }),
  ETHEREUM_NOT_ENABLED: (): Error => ({
    message: 'the Ethereum integration is not enabled',
    code: concatErrorCode(ErrorCodePrefix.Service, 25),
  }),
  INVALID_ETHEREUM_ADDRESS: (): Error => ({
    message: 'an invalid Ethereum address was provided',
    code: concatErrorCode(ErrorCodePrefix.Service, 26),
  }),
  INVALID_PAIR_HASH: (): Error => ({
    message: 'invalid pair hash',
    code: concatErrorCode(ErrorCodePrefix.Service, 27),
  }),
  NO_AMOUNT_SPECIFIED: (): Error => ({
    message: 'no amount was specified',
    code: concatErrorCode(ErrorCodePrefix.Service, 28),
  }),
  INVOICE_AND_ONCHAIN_AMOUNT_SPECIFIED: (): Error => ({
    message: 'invoice and onchain amount were specified',
    code: concatErrorCode(ErrorCodePrefix.Service, 29),
  }),
  NOT_WHOLE_NUMBER: (input: number): Error => ({
    message: `${input} is not a whole number`,
    code: concatErrorCode(ErrorCodePrefix.Service, 30),
  }),
  AMP_INVOICES_NOT_SUPPORTED: (): Error => ({
    message: 'AMP invoices not supported',
    code: concatErrorCode(ErrorCodePrefix.Service, 31),
  }),
  MIN_EXPIRY_TOO_BIG: (
    swapMaximal: number,
    minFinalCltvExpiry: number,
    routingOffset: number,
  ): Error => ({
    message: `minimal swap expiry ${minFinalCltvExpiry} plus the routing offset ${routingOffset} minutes is greater than max swap timeout ${swapMaximal}`,
    code: concatErrorCode(ErrorCodePrefix.Service, 32),
  }),
  DESTINATION_BOLTZ_NODE: (): Error => ({
    message: 'swap to Boltz lightning nodes are forbidden',
    code: concatErrorCode(ErrorCodePrefix.Service, 33),
  }),
  UNSUPPORTED_SWAP_VERSION: (): Error => ({
    message: 'swap version not supported for pair',
    code: concatErrorCode(ErrorCodePrefix.Service, 34),
  }),
  NOT_ELIGIBLE_FOR_COOPERATIVE_REFUND: (): Error => ({
    message: 'swap not eligible for a cooperative refund',
    code: concatErrorCode(ErrorCodePrefix.Service, 35),
  }),
  INCORRECT_PREIMAGE: (): Error => ({
    message: 'incorrect preimage',
    code: concatErrorCode(ErrorCodePrefix.Service, 36),
  }),
  INVALID_VIN: (): Error => ({
    message: 'input index is out of range',
    code: concatErrorCode(ErrorCodePrefix.Service, 37),
  }),
  NOT_ELIGIBLE_FOR_COOPERATIVE_CLAIM: (): Error => ({
    message: 'swap not eligible for a cooperative claim',
    code: concatErrorCode(ErrorCodePrefix.Service, 38),
  }),
  NOT_ELIGIBLE_FOR_COOPERATIVE_CLAIM_BROADCAST: (): Error => ({
    message: 'swap not eligible for a cooperative claim broadcast',
    code: concatErrorCode(ErrorCodePrefix.Service, 39),
  }),
  NO_CHAIN_FOR_SYMBOL: (): Error => ({
    message: 'no chain for symbol',
    code: concatErrorCode(ErrorCodePrefix.Service, 40),
  }),
};
