import { randomUUID } from 'crypto';
import type Logger from '../../Logger';
import type NotificationClient from '../../notifications/NotificationClient';
import * as boltzrpc from '../../proto/boltzrpc';
import Hook from './Hook';

enum ClaimFailureType {
  Immediate,
  Batch,
}

const claimFailureTypeToGrpc: Record<
  ClaimFailureType,
  boltzrpc.ClaimFailureType
> = {
  [ClaimFailureType.Immediate]:
    boltzrpc.ClaimFailureType.CLAIM_FAILURE_IMMEDIATE,
  [ClaimFailureType.Batch]: boltzrpc.ClaimFailureType.CLAIM_FAILURE_BATCH,
};

type ClaimFailureArgs = { symbol: string } & (
  | { type: ClaimFailureType.Immediate; swapId: string }
  | { type: ClaimFailureType.Batch; batchSize: number }
);

class FailureHook extends Hook<
  void,
  boltzrpc.FailureHookRequest,
  boltzrpc.FailureHookResponse
> {
  constructor(logger: Logger, notificationClient?: NotificationClient) {
    super(logger, 'failure', undefined, undefined, 60_000, notificationClient);
  }

  public claim = (args: ClaimFailureArgs): Promise<void> => {
    const id = randomUUID();
    const msg: boltzrpc.FailureHookRequest = {
      id,
      claimFailure: {
        type: claimFailureTypeToGrpc[args.type],
        symbol: args.symbol,
        swapId:
          args.type === ClaimFailureType.Immediate ? args.swapId : undefined,
        batchSize:
          args.type === ClaimFailureType.Batch ? args.batchSize : undefined,
      },
    };

    return this.sendHook(id, msg);
  };

  protected parseGrpcAction = (): void => undefined;
}

export default FailureHook;
export { ClaimFailureType };
