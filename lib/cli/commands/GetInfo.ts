import { Arguments } from 'yargs';
import { callback, loadBoltzClient } from '../Command';
import { GetInfoRequest } from '../../proto/boltzrpc_pb';

export const command = 'getinfo';

export const describe = 'get information about the Boltz instance';

export const handler = (argv: Arguments) => {
  loadBoltzClient(argv).getInfo(new GetInfoRequest(), callback);
};
