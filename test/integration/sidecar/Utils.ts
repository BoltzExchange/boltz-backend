import path from 'path';
import Logger from '../../../lib/Logger';
import Sidecar from '../../../lib/sidecar/Sidecar';

export const startSidecar = () => {
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
