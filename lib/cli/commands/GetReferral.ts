import { Arguments } from 'yargs';
import { GetReferralsRequest } from '../../proto/boltzrpc_pb';
import { ApiType, BuilderTypes } from '../BuilderComponents';
import { callback, loadBoltzClient } from '../Command';

export const command = 'getreferrals [id]';

export const describe = 'gets referrals from the database';

export const builder = {
  id: {
    type: 'string',
    describe: 'optional ID of a referral to query for',
  },
};

export const handler = (
  argv: Arguments<BuilderTypes<typeof builder> & ApiType>,
): void => {
  const req = new GetReferralsRequest();

  if (argv.id) {
    req.setId(argv.id);
  }

  loadBoltzClient(argv).getReferrals(
    req,
    callback((res) => {
      const toPrint: Record<string, any> = {};

      for (const entry of res.getReferralList()) {
        toPrint[entry.getId()] = {
          id: entry.getId(),
          config: entry.hasConfig()
            ? JSON.parse(entry.getConfig()!)
            : undefined,
        };
      }

      return toPrint;
    }),
  );
};
