import fs from 'fs';
import path from 'path';
import toml from 'toml';
import { Arguments } from 'yargs';
import { pki, md } from 'node-forge';
import Errors from './consts/Errors';
import { RpcConfig } from './RpcClient';
import { GrpcConfig } from './grpc/GrpcServer';
import { LndConfig } from './lightning/LndClient';
import { deepMerge, resolveHome, getServiceDataDir } from './Utils';

type ServiceOptions = {
  configpath?: string;
};

type CurrencyConfig = {
  symbol: string,
  network: string;
  chain: RpcConfig & ServiceOptions;
  lnd?: LndConfig & ServiceOptions;
};

type ConfigType = {
  datadir: string;

  configpath: string;
  mnemonicpath: string;
  dbpath: string;
  logpath: string;

  loglevel: string;

  grpc: GrpcConfig;

  currencies: CurrencyConfig[];
};

class Config {
  private config: ConfigType;

  private dataDir: string;

  /**
   * The constructor sets the default values
   */
  constructor() {
    this.dataDir = getServiceDataDir('boltz');

    const { configpath, mnemonicpath, dbpath, logpath } = this.getDataDirPaths(this.dataDir);

    this.config = {
      configpath,
      mnemonicpath,
      dbpath,
      logpath,

      datadir: this.dataDir,
      loglevel: this.getDefaultLogLevel(),

      grpc: {
        host: '127.0.0.1',
        port: 9000,
        certpath: path.join(this.dataDir, 'tls.cert'),
        keypath: path.join(this.dataDir, 'tls.key'),
      },

      currencies: [
        {
          symbol: 'BTC',
          network: 'bitcoinTestnet',
          chain: {
            host: '127.0.0.1',
            port: 18334,
            certpath: path.join(getServiceDataDir('btcd'), 'rpc.cert'),
            rpcuser: 'user',
            rpcpass: 'user',
          },
          lnd: {
            host: '127.0.0.1',
            port: 10009,
            certpath: path.join(getServiceDataDir('lnd'), 'tls.cert'),
            macaroonpath: path.join(getServiceDataDir('lnd'), 'data', 'chain', 'bitcoin', 'testnet', 'admin.macaroon'),
          },
        },
        {
          symbol: 'LTC',
          network: 'litecoinTestnet',
          chain: {
            host: '127.0.0.1',
            port: 19334,
            certpath: path.join(getServiceDataDir('ltcd'), 'rpc.cert'),
            rpcuser: 'user',
            rpcpass: 'user',
          },
          lnd: {
            host: '127.0.0.1',
            port: 11009,
            certpath: path.join(getServiceDataDir('lnd'), 'tls.cert'),
            macaroonpath: path.join(getServiceDataDir('lnd'), 'data', 'chain', 'litecoin', 'testnet', 'admin.macaroon'),
          },
        },
      ],
    };
  }

  // TODO: get path of the certificate, macaroon and config based on the data directory of the service
  // TODO: verify logLevel exists; depends on Logger.ts:8
  /**
   * This loads arguments specified by the user either with a TOML config file or via command line arguments
   */
  public load = (args: Arguments<any>): ConfigType => {
    if (args.datadir) {
      this.config.datadir = resolveHome(args.datadir);
      deepMerge(this.config, this.getDataDirPaths(this.config.datadir));
    }

    if (!fs.existsSync(this.config.datadir)) {
      fs.mkdirSync(this.config.datadir);
    }

    const boltzConfigFile = this.resolveConfigPath(args.configPath, this.config.configpath);

    if (fs.existsSync(boltzConfigFile)) {
      const tomlConfig = this.parseTomlConfig(boltzConfigFile);
      deepMerge(this.config, tomlConfig);
    }

    const grpcCert = args.grpc ? args.grpc.certpath : this.config.grpc.certpath;
    const grpcKey = args.grpc ?  args.grpc.keypath : this.config.grpc.keypath;

    if (!fs.existsSync(grpcCert) && !fs.existsSync(grpcKey)) {
      this.generateCertificate(grpcCert, grpcKey);
    }

    if (args.currencies) {

    }

    deepMerge(this.config, args);

    return this.config;
  }

  private parseTomlConfig = (filename: string): any => {
    if (fs.existsSync(filename)) {
      try {
        const tomlFile = fs.readFileSync(filename, 'utf-8');
        return toml.parse(tomlFile);
      } catch (error) {
        throw Errors.COULD_NOT_PARSE_CONFIG(filename, JSON.stringify(error));
      }
    }
  }

  private getDataDirPaths = (dataDir: string) => {
    return {
      configpath: path.join(dataDir, 'boltz.conf'),
      mnemonicpath: path.join(dataDir, 'seed.dat'),
      dbpath: path.join(dataDir, 'boltz.db'),
      logpath: path.join(dataDir, 'boltz.log'),
    };
  }

  private resolveConfigPath = (configPath: string, fallback: string) => {
    return configPath ? resolveHome(configPath) : fallback;
  }

  private getDefaultLogLevel = (): string => {
    return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
  }

  private generateCertificate = (tlsCertPath: string, tlsKeyPath: string): void => {
    const keys = pki.rsa.generateKeyPair(1024);
    const cert = pki.createCertificate();

    cert.publicKey = keys.publicKey;
    cert.serialNumber = String(Math.floor(Math.random() * 1024) + 1);

    const date = new Date();
    cert.validity.notBefore = date;
    cert.validity.notAfter = new Date(date.getFullYear() + 5, date.getMonth(), date.getDay());

    const attributes = [
      {
        name: 'organizationName',
        value: 'Boltz autogenerated certificate',
      },
    ];

    cert.setSubject(attributes);
    cert.setIssuer(attributes);

    cert.setExtensions([
      {
        name: 'subjectAltName',
        altNames: [
          {
            type: 2,
            value: 'localhost',
          },
          {
            type: 7,
            ip: '127.0.0.1',
          },
        ],
      },
    ]);

    cert.sign(keys.privateKey, md.sha256.create());

    const certificate = pki.certificateToPem(cert);
    const privateKey = pki.privateKeyToPem(keys.privateKey);

    fs.writeFileSync(tlsCertPath, certificate);
    fs.writeFileSync(tlsKeyPath, privateKey);
  }
}

export default Config;
export { ConfigType };
