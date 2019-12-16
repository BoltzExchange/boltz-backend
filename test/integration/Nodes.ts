import path from 'path';
import Logger from '../../lib/Logger';
import ChainClient from '../../lib/chain/ChainClient';
import LndClient from '../../lib/lightning/LndClient';

const host = process.platform === 'win32' ? '192.168.99.100' : '127.0.0.1';

export const bitcoinClient = new ChainClient(Logger.disabledLogger, {
  host,
  port: 18443,
  rpcuser: 'kek',
  rpcpass: 'kek',
}, 'BTC');

const lndDataPath = `${path.resolve(__dirname, '..', '..')}/docker/regtest/data/lnd`;

export const bitcoinLndClient = new LndClient(Logger.disabledLogger, {
  host,
  port: 10009,
  certpath: `${lndDataPath}/certificates/tls.cert`,
  macaroonpath: `${lndDataPath}/macaroons/admin.macaroon`,
}, 'BTC');
