import { resolve } from 'path';
import Logger from '../../lib/Logger';
import LndClient from '../../lib/lightning/LndClient';
import ChainClient from '../../lib/chain/ChainClient';
import ClnClient from '../../lib/lightning/ClnClient';
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

export const bitcoinLndClient2 = new LndClient(Logger.disabledLogger, 'BTC', {
  host,
  port: 10011,
  certpath: `${lndDataPath}/certificates/tls.cert`,
  macaroonpath: `${lndDataPath}/macaroons/admin.macaroon`,
  maxPaymentFeeRatio: 0.01,
});

export const clnDataPath = `${resolve(
  __dirname,
  '..',
  '..',
)}/docker/regtest/data/cln/regtest`;

export const clnClient = new ClnClient(Logger.disabledLogger, 'BTC', {
  host: host,
  port: 9291,
  maxPaymentFeeRatio: 0.01,
  rootCertPath: `${clnDataPath}/ca.pem`,
  privateKeyPath: `${clnDataPath}/client-key.pem`,
  certChainPath: `${clnDataPath}/client.pem`,
  hold: {
    host: host,
    port: 9292,
  },
});
