import axios from 'axios';
import { Arguments } from 'yargs';
import { createHmac } from 'crypto';
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
    describe: 'API key'
  },
  secret: {
    type: 'string',
    describe: 'API secret',
  },
};

export const handler = async (argv: Arguments<any>): Promise<void> => {
  const path = '/referrals/query';

  const ts = getUnixTime();
  const hmac = createHmac('sha256', argv.secret)
    .update(`${ts}GET${path}`)
    .digest('hex');

  try {
    const res = await axios.get(`http://${argv.rest.host}:${argv.rest.port}${path}`, {
      headers: {
        'TS': ts.toString(),
        'API-KEY': argv.key,
        'API-HMAC': hmac,
      },
    });

    console.log(stringify(res.data));
  } catch (e) {
    const error = e as any;
    console.log(`${error.message}: ${stringify(error.response.data)}`);
  }
};
