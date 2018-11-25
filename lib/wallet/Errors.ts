import { Error } from '../consts/Types';
import { ErrorCodePrefix } from '../consts/Enums';
import { concatErrorCode } from '../Utils';

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
};
