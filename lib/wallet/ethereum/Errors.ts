import type { Network } from 'ethers';
import { concatErrorCode } from '../../Utils';
import { ErrorCodePrefix } from '../../consts/Enums';
import type { Error } from '../../consts/Types';

export default {
  NO_PROVIDER_SPECIFIED: (): Error => ({
    message: 'no RPC provider was specified',
    code: concatErrorCode(ErrorCodePrefix.Ethereum, 0),
  }),
  NO_LOCKUP_FOUND: (): Error => ({
    message: 'no lockup transaction found',
    code: concatErrorCode(ErrorCodePrefix.Ethereum, 1),
  }),
  INVALID_LOCKUP_TRANSACTION: (transactionHash: string): Error => ({
    message: `lockup transaction is invalid: ${transactionHash}`,
    code: concatErrorCode(ErrorCodePrefix.Ethereum, 2),
  }),
  UNEQUAL_PROVIDER_NETWORKS: (networks: Network[]): Error => {
    const networkStrings: number[] = [];
    networks.forEach((network) =>
      networkStrings.push(Number(network.chainId!)),
    );

    return {
      message: `not all RPC provider networks are equal: ${networkStrings.join(
        ', ',
      )}`,
      code: concatErrorCode(ErrorCodePrefix.Ethereum, 3),
    };
  },
  REQUESTS_TO_PROVIDERS_FAILED: (errors: string[]): Error => ({
    message: `requests to all providers failed:\n - ${errors.join('\n - ')}`,
    code: concatErrorCode(ErrorCodePrefix.Ethereum, 4),
  }),
  NOT_SUPPORTED_BY_CONTRACT_VERSION: (): Error => ({
    message: 'not supported by contract version',
    code: concatErrorCode(ErrorCodePrefix.Ethereum, 5),
  }),
  UNSUPPORTED_CONTRACT: (): Error => ({
    message: 'unsupported contract',
    code: concatErrorCode(ErrorCodePrefix.Ethereum, 6),
  }),
  NEED_WEBSOCKET_PROVIDER: (): Error => ({
    message: 'at least one WebSocket provider is needed',
    code: concatErrorCode(ErrorCodePrefix.Ethereum, 7),
  }),
};
