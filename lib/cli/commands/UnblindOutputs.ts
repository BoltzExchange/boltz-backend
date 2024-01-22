import { Arguments } from 'yargs';
import { capitalizeFirstLetter, getHexString } from '../../Utils';
import { UnblindOutputsRequest } from '../../proto/boltzrpc_pb';
import { callback, loadBoltzClient } from '../Command';

export const command = 'unblindoutputs [id] [hex]';

export const describe = 'unblinds the outputs of a transaction';

export const builder = {
  id: {
    describe: 'id of the transaction to unblind',
    type: 'string',
  },
  hex: {
    describe: 'raw hex of the transaction to unblind',
    type: 'string',
  },
};

export const handler = (argv: Arguments<any>): void => {
  const request = new UnblindOutputsRequest();

  const isSet = (value: any) =>
    value !== undefined && typeof value === 'string' && value !== '';

  const idSet = isSet(argv.id);
  const hexSet = isSet(argv.hex);

  if (!idSet && !hexSet) {
    console.error('Either id or hex must be set');
    return;
  }

  if (idSet) {
    request.setId(argv.id);
  } else if (hexSet) {
    request.setHex(argv.hex);
  }

  loadBoltzClient(argv).unblindOutputs(
    request,
    callback((res) => {
      return {
        outputList: res.getOutputsList().map((out) => {
          const res = {
            ...out.toObject(),
          };

          for (const name of ['asset', 'script', 'nonce']) {
            res[name] = getHexString(
              Buffer.from(out[`get${capitalizeFirstLetter(name)}_asU8`]()),
            );
          }

          for (const name of ['rangeProof', 'surjectionProof']) {
            res['isBlinded'] = res[name] !== undefined && res[name] !== '';
            delete res[name];
          }

          return res;
        }),
      };
    }),
  );
};
