import type { Arguments } from 'yargs';
import { SweepSwapsRequest } from '../../proto/boltzrpc_pb';
import BuilderComponents from '../BuilderComponents';
import { callback, loadBoltzClient } from '../Command';

export const command = 'sweepswaps [symbol]';

export const describe = 'sweeps all deferred swap claims';

export const builder = {
  symbol: BuilderComponents.symbol,
};

export const handler = (argv: Arguments<any>): void => {
  const request = new SweepSwapsRequest();

  if (argv.symbol !== undefined && argv.symbol !== '') {
    request.setSymbol(argv.symbol);
  }

  loadBoltzClient(argv).sweepSwaps(
    request,
    callback((res) => {
      const sweep: Record<string, string[]> = {};

      for (const [, [symbol, swapIds]] of res
        .toObject()
        .claimedSymbolsMap.entries()) {
        sweep[symbol] = swapIds.claimedIdsList;
      }

      return sweep;
    }),
  );
};
