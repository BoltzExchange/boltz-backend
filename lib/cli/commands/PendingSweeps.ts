import { Arguments } from 'yargs';
import { GetPendingSweepsRequest, PendingSweep } from '../../proto/boltzrpc_pb';
import { ApiType, BuilderTypes } from '../BuilderComponents';
import { callback, loadBoltzClient } from '../Command';

export const command = 'pendingsweeps';

export const describe = 'lists the swap ids that have pending sweeps';

export const builder = {};

export const handler = (
  argv: Arguments<BuilderTypes<typeof builder> & ApiType>,
): void => {
  loadBoltzClient(argv).getPendingSweeps(
    new GetPendingSweepsRequest(),
    callback((res) => {
      const toSweep: Record<
        string,
        {
          totalAmount: number;
          toSweep: PendingSweep.AsObject[];
        }
      > = {};

      for (const [, [symbol, ids]] of res
        .toObject()
        .pendingSweepsMap.entries()) {
        if (ids.pendingSweepsList.length === 0) {
          continue;
        }

        toSweep[symbol] = {
          totalAmount: Number(
            ids.pendingSweepsList.reduce(
              (prev, sweep) => prev + BigInt(sweep.onchainAmount),
              0n,
            ),
          ),
          toSweep: ids.pendingSweepsList,
        };
      }

      return toSweep;
    }),
  );
};
