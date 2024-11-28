import { ServerInterceptingCall, ServerInterceptor } from '@grpc/grpc-js';
import Logger from '../Logger';

export const loggingInterceptor =
  (logger: Logger): ServerInterceptor =>
  (methodDescriptor, call) =>
    new ServerInterceptingCall(call, {
      start: (next) => {
        logger.debug(`Got gRPC call: ${methodDescriptor.path}`);
        return next();
      },
    });
