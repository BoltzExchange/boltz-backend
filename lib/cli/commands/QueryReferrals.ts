import type { AxiosResponse } from 'axios';
import axios from 'axios';
import { createHmac } from 'crypto';
import type { Arguments } from 'yargs';
import { getUnixTime, stringify } from '../../Utils';

export const command = 'queryreferrals <key> <secret>';

export const describe = 'queries referrals with API key and secret';

export const builder = {
  rest: {
    hidden: true,
  },
  'rest.host': {
    type: 'string',
    default: '127.0.0.1',
    describe: 'Boltz REST API host',
  },
  'rest.port': {
    type: 'number',
    default: '9001',
    describe: 'Boltz REST API port',
  },
  key: {
    type: 'string',
    describe: 'API key',
  },
  secret: {
    type: 'string',
    describe: 'API secret',
  },
};

export const handler = async (argv: Arguments<any>): Promise<void> => {
  try {
    const [idRes, fees, stats] = await Promise.all([
      sendAuthenticatedRequest<{ id: string }>(argv, '/v2/referral'),
      sendAuthenticatedRequest(argv, '/v2/referral/fees'),
      sendAuthenticatedRequest(argv, '/v2/referral/stats'),
    ]);

    console.log(
      stringify({ id: idRes.data.id, fees: fees.data, stats: stats.data }),
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
  argv: Arguments<any>,
  path: string,
): Promise<AxiosResponse<T>> => {
  const ts = getUnixTime();
  const hmac = createHmac('sha256', argv.secret)
    .update(`${ts}GET${path}`)
    .digest('hex');

  return axios.get<T>(`http://${argv.rest.host}:${argv.rest.port}${path}`, {
    headers: {
      TS: ts.toString(),
      'API-KEY': argv.key,
      'API-HMAC': hmac,
    },
  });
};
