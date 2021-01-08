import path from 'path';
import Logger from '../../lib/Logger';
import LndClient from '../../lib/lightning/LndClient';
import ChainClient from '../../lib/chain/ChainClient';

const host = process.platform === 'win32' ? '192.168.99.100' : '127.0.0.1';

const bitcoinCookieDataPath = `${path.resolve(__dirname, '..', '..')}/docker/regtest/data/core/cookies/.bitcoin-cookie`;

export const bitcoinClient = new ChainClient(Logger.disabledLogger, {
  host,
  port: 18443,
  cookie: bitcoinCookieDataPath,
}, 'BTC');

export const lndDataPath = `${path.resolve(__dirname, '..', '..')}/docker/regtest/data/lnd`;

export const bitcoinLndClient = new LndClient(Logger.disabledLogger, 'BTC', {
  host,
  port: 10009,
  certpath: `${lndDataPath}/certificates/tls.cert`,
  macaroonpath: `${lndDataPath}/macaroons/admin.macaroon`,
});
