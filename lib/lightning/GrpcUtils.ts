import { Metadata, ServiceError } from '@grpc/grpc-js';

export const grpcOptions = (sslTargetNameOverride?: string) => {
  const options = {
    // 200 MB which is the same value lncli uses: https://github.com/lightningnetwork/lnd/commit/7470f696aebc51b4ab354324e6536f54446538e1
    'grpc.max_receive_message_length': 1024 * 1024 * 200,
  };

  if (sslTargetNameOverride !== undefined) {
    options['grpc.ssl_target_name_override'] = sslTargetNameOverride;
  }

  return options;
};

interface GrpcResponse {
  toObject: () => any;
}

type GrpcMethodFunction = (
  params: any,
  meta: Metadata | undefined,
  listener: (err: ServiceError, response: GrpcResponse) => unknown,
) => any;

export const unaryCall = <T, U>(
  client: any,
  methodName: string,
  params: T,
  meta: Metadata,
  toObject = true,
): Promise<U> => {
  return new Promise((resolve, reject) => {
    (client[methodName] as GrpcMethodFunction)(
      params,
      meta,
      (err: ServiceError, response: GrpcResponse) => {
        if (err) {
          reject(err);
        } else {
          resolve(toObject ? response.toObject() : response);
        }
      },
    );
  });
};
