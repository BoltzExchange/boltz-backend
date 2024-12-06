import { Arguments } from 'yargs';
import { StopRequest } from '../../proto/boltzrpc_pb';
import { ApiType, BuilderTypes } from '../BuilderComponents';
import { callback, loadBoltzClient } from '../Command';

export const command = 'stop';

export const describe = 'stops the backend';

export const builder = {};

export const handler = (
  argv: Arguments<BuilderTypes<typeof builder> & ApiType>,
) => {
  loadBoltzClient(argv).stop(new StopRequest(), callback());
};
