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
    message: `${symbol} wallets are not supported`,
    code: concatErrorCode(ErrorCodePrefix.Wallet, 5),
  }),
  OUTPUTTYPE_NOT_SUPPORTED: (symbol: string, type: OutputType) => ({
    message: `${symbol} wallet does not supports outputs of type: ${type}`,
    code: concatErrorCode(ErrorCodePrefix.Wallet, 6),
  }),
};
