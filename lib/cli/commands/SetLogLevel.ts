import type { Arguments } from 'yargs';
import { LogLevel as BackendLevel } from '../../Logger';
import { LogLevel, SetLogLevelRequest } from '../../proto/boltzrpc_pb';
import type { ApiType, BuilderTypes } from '../BuilderComponents';
import { callback, loadBoltzClient } from '../Command';

export const command = 'setloglevel <level>';

export const describe = 'changes the log level';

export const builder = {
  level: {
    type: 'string',
    describe:
      'available levels are: error, warn, info, verbose, debug and silly',
  },
};

const parseLevel = (level: string) => {
  switch (level.toLowerCase()) {
    case BackendLevel.Error:
      return LogLevel.ERROR;
    case BackendLevel.Warn:
      return LogLevel.WARN;
    case BackendLevel.Info:
      return LogLevel.INFO;
    case BackendLevel.Verbose:
      return LogLevel.VERBOSE;
    case BackendLevel.Debug:
      return LogLevel.DEBUG;
    case BackendLevel.Silly:
      return LogLevel.SILLY;

    default:
      throw 'invalid log level';
  }
};

export const handler = async (
  argv: Arguments<BuilderTypes<typeof builder> & ApiType>,
) => {
  const request = new SetLogLevelRequest();
  request.setLevel(parseLevel(argv.level));

  loadBoltzClient(argv).setLogLevel(request, callback());
};
