import type { ServerInterceptor } from '@grpc/grpc-js';
import { ServerInterceptingCall, status } from '@grpc/grpc-js';
import type Logger from '../Logger';

export const loggingInterceptor =
  (logger: Logger): ServerInterceptor =>
  (methodDescriptor, call) =>
    new ServerInterceptingCall(call, {
      start: (next) => {
        logger.debug(`Got gRPC call: ${methodDescriptor.path}`);
        return next();
      },
      sendStatus: (statusObj, next) => {
        if (statusObj.code !== status.OK) {
          logger.warn(
            `gRPC call (${methodDescriptor.path}) failed: ${statusObj.code}: ${statusObj.details}`,
          );
        }
        next(statusObj);
      },
    });
