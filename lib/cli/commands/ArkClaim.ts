import { credentials } from '@grpc/grpc-js';
import type { Arguments } from 'yargs';
import { ServiceClient } from '../../proto/ark/service_grpc_pb';
import * as arkrpc from '../../proto/ark/service_pb';
import type { ApiType, BuilderTypes } from '../BuilderComponents';
import { callback } from '../Command';

export const command = 'ark-claim <preimage>';

export const describe = 'claims an ARK vHTLC';

export const builder = {
  fulmine: {
    type: 'string',
    describe: 'Fulmine gRPC endpoint',
    default: '127.0.0.1:7000',
  },
  preimage: {
    type: 'string',
    describe: 'the preimage of the vHTLC',
  },
};

export const handler = (
  argv: Arguments<BuilderTypes<typeof builder> & ApiType>,
) => {
  const client = new ServiceClient(argv.fulmine, credentials.createInsecure());

  const req = new arkrpc.ClaimVHTLCRequest();
  req.setPreimage(argv.preimage);

  client.claimVHTLC(req, callback());
};
