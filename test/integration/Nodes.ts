import { resolve } from 'path';
import Logger from '../../lib/Logger';
import ArkClient from '../../lib/chain/ArkClient';
import ChainClient from '../../lib/chain/ChainClient';
import ElementsClient from '../../lib/chain/ElementsClient';
import Redis from '../../lib/db/Redis';
import LndClient from '../../lib/lightning/LndClient';
import ClnClient from '../../lib/lightning/cln/ClnClient';
import type Sidecar from '../../lib/sidecar/Sidecar';

const host = process.platform === 'win32' ? '192.168.99.100' : '127.0.0.1';

export const bitcoinClient = new ChainClient(
  Logger.disabledLogger,
  {} as unknown as Sidecar,
  'bitcoinRegtest',
  {
    host,
    port: 18443,
    wallet: 'regtest',
    user: 'backend',
    password: 'DPGn0yNNWN5YvBBeRX2kEcJBwv8zwrw9Mw9nkIl05o4',
  },
  'BTC',
);

export const elementsConfig = {
  host,
  port: 18884,
  wallet: 'regtest',
  user: 'regtest',
  password: 'regtest',
};
export const elementsClient = new ElementsClient(
  Logger.disabledLogger,
  {} as unknown as Sidecar,
  'liquidRegtest',
  elementsConfig,
);

export const lndDataPath = (number: number) =>
  `${resolve(__dirname, '..', '..')}/regtest/data/lnd${number}`;

export const bitcoinLndClient = new LndClient(Logger.disabledLogger, 'BTC', {
  host,
  port: 10009,
  certpath: `${lndDataPath(1)}/tls.cert`,
  macaroonpath: `${lndDataPath(1)}/data/chain/bitcoin/regtest/admin.macaroon`,
  maxPaymentFeeRatio: 0.01,
});

export const bitcoinLndClient2 = new LndClient(Logger.disabledLogger, 'BTC', {
  host,
  port: 11009,
  certpath: `${lndDataPath(2)}/tls.cert`,
  macaroonpath: `${lndDataPath(2)}/data/chain/bitcoin/regtest/admin.macaroon`,
  maxPaymentFeeRatio: 0.01,
});

export const clnDataPath = (number: number) =>
  `${resolve(__dirname, '..', '..')}/regtest/data/cln${number}/regtest`;

export const clnHoldPath = (number: number) => `${clnDataPath(number)}/hold`;

export const clnClient = new ClnClient(Logger.disabledLogger, 'BTC', {
  host: host,
  port: 9736,
  maxPaymentFeeRatio: 0.01,
  rootCertPath: `${clnDataPath(1)}/ca.pem`,
  privateKeyPath: `${clnDataPath(1)}/client-key.pem`,
  certChainPath: `${clnDataPath(1)}/client.pem`,
  hold: {
    host: host,
    port: 9292,
    rootCertPath: `${clnHoldPath(1)}/ca.pem`,
    privateKeyPath: `${clnHoldPath(1)}/client-key.pem`,
    certChainPath: `${clnHoldPath(1)}/client.pem`,
  },
});

export const arkClient = new ArkClient(Logger.disabledLogger, {
  host: '127.0.0.1',
  port: 7000,
});

export const aspUrl = 'http://localhost:7070';

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
