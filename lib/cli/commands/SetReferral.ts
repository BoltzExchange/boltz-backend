import { Arguments } from 'yargs';
import { deepMerge } from '../../Utils';
import {
  GetReferralsRequest,
  GetReferralsResponse,
  SetReferralRequest,
} from '../../proto/boltzrpc_pb';
import { ApiType, BuilderTypes } from '../BuilderComponents';
import { callback, loadBoltzClient } from '../Command';

export const command = 'setreferral <id> [config] [amend]';

export const describe = 'updates the config of a referral';

export const builder = {
  id: {
    type: 'string',
    describe: 'optional ID of the referral',
  },
  config: {
    type: 'object',
    describe: 'config changes to be applied',
  },
  amend: {
    type: 'bool',
    describe: 'amends the existing config instead of overwriting it',
  },
};

export const handler = async (
  argv: Arguments<BuilderTypes<typeof builder> & ApiType>,
): Promise<void> => {
  const req = new SetReferralRequest();

  if (argv.id) {
    req.setId(argv.id);
  }

  const client = loadBoltzClient(argv);

  if (argv.amend) {
    const getReq = new GetReferralsRequest();
    getReq.setId(argv.id);

    const existing = (
      await new Promise<GetReferralsResponse>((resolve, reject) =>
        client.getReferrals(getReq, (error, response) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        }),
      )
    ).getReferralList()[0];

    if (existing.hasConfig()) {
      const merged = JSON.parse(existing.getConfig()!);
      deepMerge(merged, JSON.parse(argv.config));

      req.setConfig(JSON.stringify(merged));
    } else {
      req.setConfig(argv.config);
    }
  } else {
    req.setConfig(argv.config);
  }

  client.setReferral(req, callback());
};
