import { resolve } from 'path';
import type BaseClient from '../../lib/BaseClient';
import Logger from '../../lib/Logger';
import ArkClient from '../../lib/chain/ArkClient';
import ChainClient from '../../lib/chain/ChainClient';
import ElementsClient from '../../lib/chain/ElementsClient';
import { ClientStatus } from '../../lib/consts/Enums';
import Redis from '../../lib/db/Redis';
import LndClient from '../../lib/lightning/LndClient';
import RoutingFee from '../../lib/lightning/RoutingFee';
import ClnClient from '../../lib/lightning/cln/ClnClient';
import type Sidecar from '../../lib/sidecar/Sidecar';
import { sidecar } from './sidecar/Utils';

const mockSidecar = {
  on: jest.fn(),
  removeListener: jest.fn(),
  estimateFee: jest.fn().mockResolvedValue(1),
} as unknown as Sidecar;

const host = process.platform === 'win32' ? '192.168.99.100' : '127.0.0.1';

export const bitcoinClient = new ChainClient(
  Logger.disabledLogger,
  mockSidecar,
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
  mockSidecar,
  'liquidRegtest',
  elementsConfig,
);

export const lndDataPath = (number: number) =>
  `${resolve(__dirname, '..', '..')}/regtest/data/lnd${number}`;

export const clnDataPath = (number: number) =>
  `${resolve(__dirname, '..', '..')}/regtest/data/cln${number}/regtest`;

export const clnHoldPath = (number: number) => `${clnDataPath(number)}/hold`;

// LND client configs
const lnd1Config = {
  host,
  port: 10009,
  certpath: `${lndDataPath(1)}/tls.cert`,
  macaroonpath: `${lndDataPath(1)}/data/chain/bitcoin/regtest/admin.macaroon`,
};

const lnd2Config = {
  host,
  port: 11009,
  certpath: `${lndDataPath(2)}/tls.cert`,
  macaroonpath: `${lndDataPath(2)}/data/chain/bitcoin/regtest/admin.macaroon`,
};

const cln1Config = {
  host,
  port: 9736,
  rootCertPath: `${clnDataPath(1)}/ca.pem`,
  privateKeyPath: `${clnDataPath(1)}/client-key.pem`,
  certChainPath: `${clnDataPath(1)}/client.pem`,
  hold: {
    host,
    port: 9292,
    rootCertPath: `${clnHoldPath(1)}/ca.pem`,
    privateKeyPath: `${clnHoldPath(1)}/client-key.pem`,
    certChainPath: `${clnHoldPath(1)}/client.pem`,
  },
};

export const bitcoinLndClient = new LndClient(
  Logger.disabledLogger,
  'BTC',
  lnd1Config,
  sidecar,
  new RoutingFee(Logger.disabledLogger),
);

export const bitcoinLndClient2 = new LndClient(
  Logger.disabledLogger,
  'BTC',
  lnd2Config,
  sidecar,
  new RoutingFee(Logger.disabledLogger),
);

export const clnClient = new ClnClient(
  Logger.disabledLogger,
  'BTC',
  cln1Config,
  sidecar,
  new RoutingFee(Logger.disabledLogger),
);

/**
 * Wraps a BaseClient with a lazy, concurrency-safe connect guard.
 * Concurrent callers share the same in-flight promise; failures and
 * disconnects automatically clear it so the next call retries.
 */
const createLazyConnector = <T extends BaseClient>(
  client: T,
  connect: () => Promise<boolean>,
) => {
  let pending: Promise<void> | undefined;

  client.on('status.changed', (status: ClientStatus) => {
    if (status === ClientStatus.Disconnected) {
      pending = undefined;
    }
  });

  return {
    get: async (): Promise<T> => {
      if (!client.isConnected()) {
        if (!pending) {
          pending = connect().then((ok) => {
            if (!ok)
              throw new Error(
                `Could not connect ${client.serviceName()}-${client.symbol}`,
              );
          });
          pending.catch(() => {
            pending = undefined;
          });
        }
        await pending;
      }
      return client;
    },
    reset: () => {
      pending = undefined;
    },
  };
};

const lnd1 = createLazyConnector(bitcoinLndClient, () =>
  bitcoinLndClient.connect(false),
);
const lnd2 = createLazyConnector(bitcoinLndClient2, () =>
  bitcoinLndClient2.connect(false),
);
const cln1 = createLazyConnector(clnClient, () => clnClient.connect());

export const getBitcoinLndClient = lnd1.get;
export const getBitcoinLndClient2 = lnd2.get;
export const getClnClient = cln1.get;

export const resetNodeConnectionPromises = () => {
  lnd1.reset();
  lnd2.reset();
  cln1.reset();
};

export const arkClient = new ArkClient(
  Logger.disabledLogger,
  {
    host: '127.0.0.1',
    port: 7000,
    useLocktimeSeconds: true,
  },
  mockSidecar,
);

export const waitForClnChainSync = async () => {
  const cln = await getClnClient();
  const maxAttempts = 300;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (
      (await bitcoinClient.getBlockchainInfo()).blocks ===
      (await cln.getInfo()).blockHeight
    ) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('CLN chain sync timed out');
};

export const redis = new Redis(Logger.disabledLogger, {
  redisEndpoint: 'redis://localhost:6379',
});
