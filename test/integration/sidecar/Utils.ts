import toml from '@iarna/toml';
import fs from 'fs';
import path from 'path';
import Logger from '../../../lib/Logger';
import Database from '../../../lib/db/Database';
import KeyRepository from '../../../lib/db/repositories/KeyRepository';
import Sidecar from '../../../lib/sidecar/Sidecar';

export const startSidecar = async () => {
  const config = toml.parse(
    fs.readFileSync(path.join(__dirname, 'config.toml'), {
      encoding: 'utf-8',
    }),
  );
  const db = new Database(
    Logger.disabledLogger,
    undefined,
    config.postgres as never,
  );
  await db.init();
  if ((await KeyRepository.getKeyProvider('BTC')) === null) {
    await KeyRepository.addKeyProvider({
      symbol: 'BTC',
      derivationPath: 'm/0/0',
      highestUsedIndex: 0,
    });
  }

  await db.close();

  Sidecar.start(Logger.disabledLogger, {
    loglevel: 'error',
    sidecar: {
      path: './boltzr/target/debug/boltzr',
      config: path.join(__dirname, 'config.toml'),
    },
  } as any);
};

export const sidecar = new Sidecar(
  Logger.disabledLogger,
  {
    grpc: {
      host: '127.0.0.1',
      port: 10_001,
      certificates: path.join(__dirname, 'sidecar', 'certificates'),
    },
  },
  '',
);
