import { resolve } from 'path';
import Logger from '../../lib/Logger';
import LndClient from '../../lib/lightning/LndClient';
import ChainClient from '../../lib/chain/ChainClient';
import ElementsClient from '../../lib/chain/ElementsClient';

const host = process.platform === 'win32' ? '192.168.99.100' : '127.0.0.1';

const cookieBasePath = `${resolve(
  __dirname,
  '..',
  '..',
)}/docker/regtest/data/core/cookies`;

export const bitcoinClient = new ChainClient(
  Logger.disabledLogger,
  {
    host,
    port: 18443,
    cookie: `${cookieBasePath}/.bitcoin-cookie`,
  },
  'BTC',
);

export const elementsClient = new ElementsClient(Logger.disabledLogger, {
  host,
  port: 18884,
  cookie: `${cookieBasePath}/.elements-cookie`,
});

export const lndDataPath = `${resolve(
  __dirname,
  '..',
  '..',
)}/docker/regtest/data/lnd`;

export const bitcoinLndClient = new LndClient(Logger.disabledLogger, 'BTC', {
  host,
  port: 10009,
  certpath: `${lndDataPath}/certificates/tls.cert`,
  macaroonpath: `${lndDataPath}/macaroons/admin.macaroon`,
  maxPaymentFeeRatio: 0.01,
});
