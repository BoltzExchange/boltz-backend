import { OutputType } from 'boltz-core';
import { Error } from '../consts/Types';
import { concatErrorCode } from '../Utils';
import { ErrorCodePrefix } from '../consts/Enums';

export default {
  NOT_INITIALIZED: (): Error => ({
    message: 'wallet not initialized',
    code: concatErrorCode(ErrorCodePrefix.Wallet, 0),
  }),
  INVALID_MNEMONIC: (mnemonic: string): Error => ({
    message: `mnemonic "${mnemonic}" is invalid`,
    code: concatErrorCode(ErrorCodePrefix.Wallet, 1),
  }),
  INVALID_DEPTH_INDEX: (depth: number): Error => ({
    message: `depth index "${depth}" is invalide`,
    code: concatErrorCode(ErrorCodePrefix.Wallet, 2),
  }),
  NOT_ENOUGH_FUNDS: (amount: number): Error => ({
    message: `not enough funds to send ${amount}`,
    code: concatErrorCode(ErrorCodePrefix.Wallet, 3),
  }),
  INVALID_SIGNATURE: (): Error => ({
    message: 'could not verify signatures of constructed transaction',
    code: concatErrorCode(ErrorCodePrefix.Wallet, 4),
  }),
  CURRENCY_NOT_SUPPORTED: (symbol: string): Error => ({
    message: `${symbol} is not supported`,
    code: concatErrorCode(ErrorCodePrefix.Wallet, 5),
  }),
  OUTPUTTYPE_NOT_SUPPORTED: (symbol: string, type: OutputType): Error => ({
    message: `${symbol} wallet does not supports outputs of type: ${type}`,
    code: concatErrorCode(ErrorCodePrefix.Wallet, 6),
  }),
  LND_NOT_FOUND: (symbol: string): Error => ({
    message: `could not find LND client of ${symbol}`,
    code: concatErrorCode(ErrorCodePrefix.Wallet, 7),
  }),
  MISSING_SWAP_CONTRACTS: (): Error => ({
    message: 'missing Ethereum swap contracts',
    code: concatErrorCode(ErrorCodePrefix.Wallet, 8),
  }),
  INVALID_ETHEREUM_CONFIGURATION: (reason: string): Error => ({
    message: `invalid Ethereum configuration: ${reason}`,
    code: concatErrorCode(ErrorCodePrefix.Wallet, 9),
  }),
  NOT_SUPPORTED_BY_WALLET: (symbol: string, method: string): Error => ({
    message: `"${method}" not supported by ${symbol}`,
    code: concatErrorCode(ErrorCodePrefix.Wallet, 9),
  }),
};
