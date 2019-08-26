import { Arguments } from 'yargs';
import BuilderComponents from '../BuilderComponents';
import { callback, loadBoltzClient } from '../Command';
import { NewAddressRequest, OutputType } from '../../proto/boltzrpc_pb';

export const command = 'newaddress <symbol> [type]';

export const describe = 'gets a new address of a specified wallet';

export const builder = {
  symbol: BuilderComponents.symbol,
  type: {
    describe: 'type of the output',
    type: 'string',
    choices: ['bech32', 'compatibility', 'legacy'],
    default: 'compatibility',
  },
};

export const getOutputType = (type: string) => {
  switch (type.toLowerCase()) {
    case 'bech32': return OutputType.BECH32;
    case 'compatibility': return OutputType.COMPATIBILITY;

    default: return OutputType.LEGACY;
  }
};

export const handler = (argv: Arguments<any>) => {
  const request = new NewAddressRequest();

  request.setSymbol(argv.symbol);
  request.setType(getOutputType(argv.type));

  loadBoltzClient(argv).newAddress(request, callback);
};
