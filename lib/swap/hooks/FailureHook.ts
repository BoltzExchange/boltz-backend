import { randomUUID } from 'crypto';
import type Logger from '../../Logger';
import type NotificationClient from '../../notifications/NotificationClient';
import * as boltzrpc from '../../proto/boltzrpc';
import Hook from './Hook';

enum ClaimFailureType {
  Immediate,
  Batch,
}

class FailureHook extends Hook<
  void,
  boltzrpc.FailureHookRequest,
  boltzrpc.FailureHookResponse
> {
  constructor(logger: Logger, notificationClient?: NotificationClient) {
    super(logger, 'failure', undefined, undefined, 60_000, notificationClient);
  }

  public claim = (
    type: ClaimFailureType,
    symbol: string,
    swapId?: string,
    batchSize = 0,
  ): Promise<void> => {
    const id = randomUUID();
    const msg: boltzrpc.FailureHookRequest = {
      id,
      claimFailure: {
        type:
          type === ClaimFailureType.Immediate
            ? boltzrpc.ClaimFailureType.CLAIM_FAILURE_IMMEDIATE
            : boltzrpc.ClaimFailureType.CLAIM_FAILURE_BATCH,
        symbol,
        swapId,
        batchSize,
      },
    };

    return this.sendHook(id, msg);
  };

  protected parseGrpcAction = (): void => undefined;
}

export default FailureHook;
export { ClaimFailureType };
