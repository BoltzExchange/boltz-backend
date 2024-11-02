import { racePromise } from './PromiseUtils';

type Handler = () => Promise<void>;
type ExitArg = number | string | Error;

const exitHandlerTimeout = 5_000;

const parseExitArg = (arg: ExitArg): number => {
  if (!isNaN(+arg)) {
    return +arg;
  }

  switch (arg) {
    case 'SIGINT':
      return 0;

    default:
      return 1;
  }
};

const exitHandler = async (handler: Handler, arg: ExitArg) => {
  try {
    await racePromise(
      handler(),
      (reject) => reject('timeout'),
      exitHandlerTimeout,
    );
  } catch (e) {
    console.error('Exit handler threw', e);
  }

  // eslint-disable-next-line n/no-process-exit
  process.exit(parseExitArg(arg));
};

export const registerExitHandler = (handler: Handler) => {
  [
    'beforeExit',
    'SIGHUP',
    'SIGINT',
    'SIGQUIT',
    'SIGILL',
    'SIGTRAP',
    'SIGABRT',
    'SIGBUS',
    'SIGFPE',
    'SIGUSR1',
    'SIGSEGV',
    'SIGUSR2',
    'SIGTERM',
  ].forEach((evt) => process.on(evt, (arg) => exitHandler(handler, arg)));
};
