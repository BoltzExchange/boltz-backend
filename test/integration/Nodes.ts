import { resolve } from 'path';
import Logger from '../../lib/Logger';
import ChainClient from '../../lib/chain/ChainClient';
import ElementsClient from '../../lib/chain/ElementsClient';
import Redis from '../../lib/db/Redis';
import LndClient from '../../lib/lightning/LndClient';
import ClnClient from '../../lib/lightning/cln/ClnClient';

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

export const elementsConfig = {
  host,
  port: 18884,
  cookie: `${cookieBasePath}/.elements-cookie`,
};
export const elementsClient = new ElementsClient(
  Logger.disabledLogger,
  elementsConfig,
);

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
  port: 10012,
  certpath: `${lndDataPath}/certificates/tls.cert`,
  macaroonpath: `${lndDataPath}/macaroons/admin.macaroon`,
  maxPaymentFeeRatio: 0.01,
});

export const clnDataPath = `${resolve(
  __dirname,
  '..',
  '..',
)}/docker/regtest/data/cln`;

export const clnCertsPath = `${clnDataPath}/certs`;
export const clnHoldPath = `${clnDataPath}/hold`;

export const clnClient = new ClnClient(Logger.disabledLogger, 'BTC', {
  host: host,
  port: 9291,
  maxPaymentFeeRatio: 0.01,
  rootCertPath: `${clnCertsPath}/ca.pem`,
  privateKeyPath: `${clnCertsPath}/client-key.pem`,
  certChainPath: `${clnCertsPath}/client.pem`,
  hold: {
    host: host,
    port: 9292,
    rootCertPath: `${clnHoldPath}/ca.pem`,
    privateKeyPath: `${clnHoldPath}/client-key.pem`,
    certChainPath: `${clnHoldPath}/client.pem`,
  },
});

export const waitForClnChainSync = () =>
  new Promise<void>((resolve) => {
    const timeout = setInterval(async () => {
      if (
        (await bitcoinClient.getBlockchainInfo()).blocks ===
        (await clnClient.getInfo()).blockHeight
      ) {
        clearTimeout(timeout);
        resolve();
      }
    }, 100);
  });

export const redis = new Redis(Logger.disabledLogger, {
  redisEndpoint: 'redis://localhost:6379',
});
