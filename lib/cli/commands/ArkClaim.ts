import { credentials } from '@grpc/grpc-js';
import { crypto } from 'bitcoinjs-lib';
import type { Arguments } from 'yargs';
import { getHexBuffer } from '../../Utils';
import ArkClient from '../../chain/ArkClient';
import { ServiceClient } from '../../proto/ark/service_grpc_pb';
import * as arkrpc from '../../proto/ark/service_pb';
import type { ApiType, BuilderTypes } from '../BuilderComponents';
import { callback } from '../Command';

export const command = 'ark-claim <preimage> <senderPubkey> <receiverPubkey>';

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
  senderPubkey: {
    type: 'string',
    describe: 'the sender public key of the vHTLC',
  },
  receiverPubkey: {
    type: 'string',
    describe: 'the receiver public key of the vHTLC',
  },
};

export const handler = (
  argv: Arguments<BuilderTypes<typeof builder> & ApiType>,
) => {
  const client = new ServiceClient(argv.fulmine, credentials.createInsecure());

  const req = new arkrpc.ClaimVHTLCRequest();
  req.setPreimage(argv.preimage);
  req.setVhtlcId(
    ArkClient.createVhtlcId(
      crypto.sha256(getHexBuffer(argv.preimage)),
      getHexBuffer(argv.senderPubkey),
      getHexBuffer(argv.receiverPubkey),
    ),
  );

  client.claimVHTLC(req, callback());
};
