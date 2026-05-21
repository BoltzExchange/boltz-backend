import type { ServerInterceptor } from '@grpc/grpc-js';
import { ServerInterceptingCall, status } from '@grpc/grpc-js';
import type Logger from '../../Logger';
import JwtTokenRepository from '../../db/repositories/JwtTokenRepository';
import type JwtSigner from '../JwtSigner';
import { wildcardAll } from '../MethodRegistry';

const bearerPrefix = 'bearer ';

export const isMethodAllowed = (
  methodPath: string,
  allowedMethods: string[],
): boolean => {
  for (const entry of allowedMethods) {
    if (entry === wildcardAll || entry === methodPath) {
      return true;
    }

    if (entry.endsWith('/*')) {
      const prefix = entry.slice(0, entry.length - 1);
      if (methodPath.startsWith(prefix)) {
        return true;
      }
    }
  }
  return false;
};

export const authInterceptor = (
  logger: Logger,
  signer: JwtSigner,
): ServerInterceptor => {
  return (methodDescriptor, call) =>
    new ServerInterceptingCall(call, {
      start: (next) => {
        next({
          onReceiveMetadata: (metadata, mdNext) => {
            void (async () => {
              const reject = (
                code: number,
                details: string,
                logMessage: string,
              ) => {
                logger.warn(
                  `gRPC auth rejected ${methodDescriptor.path}: ${logMessage}`,
                );
                call.sendStatus({ code, details });
              };

              try {
                const header = metadata.get('authorization');
                if (header.length === 0) {
                  reject(
                    status.UNAUTHENTICATED,
                    'missing authorization metadata',
                    'no authorization header',
                  );
                  return;
                }

                const raw = header[0];
                if (
                  typeof raw !== 'string' ||
                  !raw.toLowerCase().startsWith(bearerPrefix)
                ) {
                  reject(
                    status.UNAUTHENTICATED,
                    'malformed authorization metadata',
                    'authorization header is not a bearer token',
                  );
                  return;
                }

                const token = raw.slice(bearerPrefix.length).trim();
                if (token.length === 0) {
                  reject(
                    status.UNAUTHENTICATED,
                    'empty bearer token',
                    'empty bearer token',
                  );
                  return;
                }

                let jti: string;
                try {
                  ({ jti } = await signer.verify(token));
                } catch (error) {
                  reject(
                    status.UNAUTHENTICATED,
                    'invalid token',
                    `signature/expiry check failed: ${(error as Error).message}`,
                  );
                  return;
                }

                const row = await JwtTokenRepository.getActive(jti);
                if (row === null) {
                  reject(
                    status.UNAUTHENTICATED,
                    'token revoked or unknown',
                    `no active row for jti ${jti}`,
                  );
                  return;
                }

                if (
                  !isMethodAllowed(methodDescriptor.path, row.allowedMethods)
                ) {
                  reject(
                    status.PERMISSION_DENIED,
                    'method not allowed for this token',
                    `jti ${jti} not allowed to call ${methodDescriptor.path}`,
                  );
                  return;
                }

                mdNext(metadata);
              } catch (error) {
                // Backstop: an unexpected throw here (e.g. DB outage during
                // getActive) would otherwise leave the call hanging until the
                // client times out, since neither mdNext nor sendStatus would
                // run. Always close the call.
                logger.error(
                  `gRPC auth interceptor error on ${methodDescriptor.path}: ${(error as Error)?.message ?? error}`,
                );
                call.sendStatus({
                  code: status.INTERNAL,
                  details: 'internal auth error',
                });
              }
            })();
          },
        });
      },
    });
};
