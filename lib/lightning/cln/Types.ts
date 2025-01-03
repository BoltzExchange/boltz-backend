import { ChannelCredentials, credentials } from '@grpc/grpc-js';
import fs from 'fs';
import Errors from '../Errors';

type BaseConfig = {
  host: string;
  port: number;

  rootCertPath: string;
  privateKeyPath: string;
  certChainPath: string;
};

type ClnConfig = BaseConfig & {
  maxPaymentFeeRatio: number;

  hold: BaseConfig;
};

const createSsl = (
  serviceName: string,
  symbol: string,
  config: Omit<Omit<BaseConfig, 'host'>, 'port'>,
): ChannelCredentials => {
  const certFiles = [
    config.rootCertPath,
    config.privateKeyPath,
    config.certChainPath,
  ];

  if (!certFiles.map((file) => fs.existsSync(file)).every((exists) => exists)) {
    throw Errors.COULD_NOT_FIND_FILES(symbol, serviceName);
  }

  const [rootCert, privateKey, certChain] = certFiles.map((file) =>
    fs.readFileSync(file),
  );
  return credentials.createSsl(rootCert, privateKey, certChain);
};

export { ClnConfig, BaseConfig, createSsl };
