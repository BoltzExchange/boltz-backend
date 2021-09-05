import { Error } from '../consts/Types';
import { ErrorCodePrefix } from '../consts/Enums';
import { concatErrorCode } from '../Utils';

export default {
  COULD_NOT_BIND: (host: string, port: number, errorMessage?: string): Error => ({
    message: `gRPC couldn't bind on: ${host}:${port}${errorMessage ? `: ${errorMessage}` : ''}`,
    code: concatErrorCode(ErrorCodePrefix.Grpc, 0),
  }),
};
