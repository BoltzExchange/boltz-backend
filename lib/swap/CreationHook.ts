import type { ServerDuplexStream } from '@grpc/grpc-js';
import { status } from '@grpc/grpc-js';
import Logger from '../Logger';
import { formatError } from '../Utils';
import { SwapType } from '../consts/Enums';
import * as boltzrpc from '../proto/boltzrpc_pb';

type RequestParamsBase = {
  id: string;
  symbolSending: string;
  symbolReceiving: string;
  referral?: string;
};

type RequestParamsSubmarine = RequestParamsBase & {
  invoiceAmount: number;
};

type RequestParamsReverse = RequestParamsBase & {
  invoiceAmount: number;
};

type RequestParamsChain = RequestParamsBase & {
  userLockAmount: number;
};

type RequestParams =
  | RequestParamsSubmarine
  | RequestParamsReverse
  | RequestParamsChain;

class CreationHook {
  private static readonly defaultAction = true;
  private static readonly hookResolveTimeout = 2_500;

  private readonly pendingHooks = new Map<string, (action: boolean) => void>();

  private stream?: ServerDuplexStream<
    boltzrpc.SwapCreationResponse,
    boltzrpc.SwapCreation
  > = undefined;

  constructor(private readonly logger: Logger) {}

  public connectToStream = (
    stream: ServerDuplexStream<
      boltzrpc.SwapCreationResponse,
      boltzrpc.SwapCreation
    >,
  ) => {
    this.logger.info('Connected gRPC swap creation hook');
    if (this.stream !== undefined) {
      this.logger.warn(
        'gRPC swap creation hook is already connected, disconnecting from previous connection',
      );
      this.stream.emit('error', {
        code: status.RESOURCE_EXHAUSTED,
        details: 'received new connection',
      });
      this.closeStream();
    }

    this.stream = stream;

    this.stream.on('error', (error) => {
      this.logger.error(`gRPC swap creation hook error ${formatError(error)}`);
      this.closeStream();
    });

    this.stream.on('end', () => {
      this.logger.warn('gRPC swap creation hook disconnected');
      this.closeStream();
    });

    this.stream.on('data', (data: boltzrpc.SwapCreationResponse) => {
      this.logger.silly(
        `Received gRPC swap creation hook response for ${data.getId()}: ${data.getAction().toString()}`,
      );

      const hook = this.pendingHooks.get(data.getId());
      if (hook !== undefined) {
        hook(data.getAction() === boltzrpc.SwapCreationResponse.Action.ACCEPT);
      }
    });
  };

  public swapCreationHook = (
    type: SwapType,
    params: RequestParams,
  ): Promise<boolean> => {
    if (this.stream === undefined) {
      this.logger.silly(
        'gRPC swap creation hook is not connected, returning default action',
      );
      return Promise.resolve(CreationHook.defaultAction);
    }

    const hook = new Promise<boolean>((resolve) => {
      const resolver = (action: boolean) => {
        this.pendingHooks.delete(params.id);
        if (!action) {
          this.logger.warn(`Swap creation hook rejected for ${params.id}`);
        }
        resolve(action);
      };

      const timeout = setTimeout(() => {
        if (this.pendingHooks.has(params.id)) {
          this.logger.warn(`Swap creation hook timed out for ${params.id}`);
          resolver(CreationHook.defaultAction);
        }
      }, CreationHook.hookResolveTimeout);

      this.pendingHooks.set(params.id, (action: boolean) => {
        clearTimeout(timeout);
        resolver(action);
      });
    });

    const msg = new boltzrpc.SwapCreation();
    msg.setId(params.id);
    msg.setSymbolSending(params.symbolSending);
    msg.setSymbolReceiving(params.symbolReceiving);

    if (params.referral !== undefined) {
      msg.setReferral(params.referral);
    }

    switch (type) {
      case SwapType.Submarine: {
        const submarine = new boltzrpc.SwapCreation.Submarine();
        submarine.setInvoiceAmount(
          (params as RequestParamsSubmarine).invoiceAmount,
        );
        msg.setSubmarine(submarine);
        break;
      }

      case SwapType.ReverseSubmarine: {
        const reverse = new boltzrpc.SwapCreation.Reverse();
        reverse.setInvoiceAmount(
          (params as RequestParamsReverse).invoiceAmount,
        );
        msg.setReverse(reverse);
        break;
      }

      case SwapType.Chain: {
        const chain = new boltzrpc.SwapCreation.Chain();
        chain.setUserLockAmount((params as RequestParamsChain).userLockAmount);
        msg.setChain(chain);
        break;
      }
    }

    this.logger.silly(
      `Sending gRPC swap creation hook request for ${msg.getId()}`,
    );
    this.stream.write(msg);

    return hook;
  };

  private closeStream = () => {
    this.stream?.removeAllListeners();
    this.stream?.end();
    this.stream = undefined;

    this.pendingHooks.forEach((resolve) => {
      resolve(CreationHook.defaultAction);
    });
    this.pendingHooks.clear();
  };
}

export default CreationHook;
