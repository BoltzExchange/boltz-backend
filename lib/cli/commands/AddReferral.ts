import { Arguments } from 'yargs';
import { AddReferralRequest } from '../../proto/boltzrpc_pb';
import { callback, loadBoltzClient } from '../Command';

export const command = 'addreferral <id> <feeShare> [routingNode]';

export const describe = 'adds a new referral ID to the database';

export const builder = {
  id: {
    type: 'string',
    describe: 'ID of the referral',
  },
  feeShare: {
    type: 'number',
    describe: 'percentage share of the referral',
  },
  routingNode: {
    type: 'string',
    describe: 'optional routing node with which the referral ID should be associated',
  },
};

export const handler = (argv: Arguments<any>): void => {
  const request = new AddReferralRequest();

  request.setId(argv.id);
  request.setFeeShare(argv.feeShare);
  request.setRoutingNode(argv.routingNode);

  loadBoltzClient(argv).addReferral(request, callback);
};
