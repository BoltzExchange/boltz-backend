import { Arguments } from 'yargs';
import { GetPendingSweepsRequest } from '../../proto/boltzrpc_pb';
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
    callback(),
  );
};
