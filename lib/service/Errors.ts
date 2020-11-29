import { Error } from '../consts/Types';
import { concatErrorCode } from '../Utils';
import { ErrorCodePrefix } from '../consts/Enums';

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
  NO_LND_CLIENT: (symbol: string): Error => ({
    message: `${symbol} has no LND client`,
    code: concatErrorCode(ErrorCodePrefix.Service, 15),
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
  EXCEEDS_MAX_INBOUND_LIQUIDITY: (inboundLiquidity: number, maxInboundLiquidity: number): Error => ({
    message: `inbound liquidity ${inboundLiquidity} exceeds maximal ${maxInboundLiquidity}`,
    code: concatErrorCode(ErrorCodePrefix.Service, 22),
  }),
  BENEATH_MIN_INBOUND_LIQUIDITY: (inboundLiquidity: number, minInboundLiquidity: number): Error => ({
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
    message: 'and invalid Ethereum address was provided',
    code: concatErrorCode(ErrorCodePrefix.Service, 5),
  }),
  INVALID_PAIR_HASH: (): Error => ({
    message: 'invalid pair hash',
    code: concatErrorCode(ErrorCodePrefix.Swap, 24),
  }),
};
