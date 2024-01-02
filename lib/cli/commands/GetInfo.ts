import { Arguments } from 'yargs';
import { GetInfoRequest } from '../../proto/boltzrpc_pb';
import { callback, loadBoltzClient } from '../Command';

export const command = 'getinfo';

export const describe =
  'gets information about the Boltz instance and the nodes it is connected to';

export const handler = (argv: Arguments<any>): void => {
  loadBoltzClient(argv).getInfo(new GetInfoRequest(), callback());
};
