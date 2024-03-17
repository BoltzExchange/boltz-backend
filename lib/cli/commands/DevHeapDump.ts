import { Arguments } from 'yargs';
import { DevHeapDumpRequest } from '../../proto/boltzrpc_pb';
import { callback, loadBoltzClient } from '../Command';

export const command = 'dev-heapdump [path]';

export const describe = 'dumps the heap of the daemon into a file';

export const builder = {
  path: {
    type: 'string',
    describe: 'path to which the heap should be dumped',
  },
};

export const handler = (argv: Arguments<any>): void => {
  const request = new DevHeapDumpRequest();
  request.setPath(argv.path);

  loadBoltzClient(argv).devHeapDump(request, callback());
};
