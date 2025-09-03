import type { AxiosResponse } from 'axios';
import axios from 'axios';
import { createHmac } from 'crypto';
import type { Arguments } from 'yargs';
import { getUnixTime, stringify } from '../../Utils';
import type { ApiType, BuilderTypes } from '../BuilderComponents';

export const command = 'queryreferrals <key> <secret>';

export const describe = 'queries referrals with API key and secret';

export const builder = {
  key: {
    type: 'string',
    describe: 'API key',
  },
  secret: {
    type: 'string',
    describe: 'API secret',
  },
};

type Argv = Arguments<BuilderTypes<typeof builder> & ApiType>;

export const handler = async (argv: Argv): Promise<void> => {
  try {
    const [idRes, fees, stats, extra] = await Promise.all([
      sendAuthenticatedRequest<{ id: string }>(argv, '/v2/referral'),
      sendAuthenticatedRequest(argv, '/v2/referral/fees'),
      sendAuthenticatedRequest(argv, '/v2/referral/stats'),
      sendAuthenticatedRequest(argv, '/v2/referral/stats/extra'),
    ]);

    console.log(
      stringify({
        id: idRes.data.id,
        fees: fees.data,
        stats: stats.data,
        extra: extra.data,
      }),
    );
  } catch (error: any) {
    if (error.message && error.response) {
      console.error(`${error.message}: ${stringify(error.response.data)}`);
    } else {
      console.error(error);
    }
  }
};

const sendAuthenticatedRequest = <T = any>(
  argv: Argv,
  path: string,
): Promise<AxiosResponse<T>> => {
  const ts = getUnixTime();
  const hmac = createHmac('sha256', argv.secret)
    .update(`${ts}GET${path}`)
    .digest('hex');

  return axios.get<T>(`${argv.api.endpoint}${path}`, {
    headers: {
      TS: ts.toString(),
      'API-KEY': argv.key,
      'API-HMAC': hmac,
    },
  });
};
