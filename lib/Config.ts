import path from 'path';
import fs from 'fs';
import toml from 'toml';
import ini from 'ini';
import { Arguments } from 'yargs';
import { deepMerge, resolveHome, splitListen, getServiceDataDir } from './Utils';
import { RpcConfig } from './RpcClient';
import { LndConfig } from './lightning/LndClient';
import { GrpcConfig } from './grpc/GrpcServer';
import Errors from './consts/Errors';

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
  public load = (args: Arguments): ConfigType => {
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

    if (args.currencies) {
      const currencies = this.parseCurrency(args.currencies, this.config.currencies);
      // apply properly formatted json to args.currencies
      args.currencies = currencies.currencies;
      deepMerge(this.config, currencies);
    }

    deepMerge(this.config, args);
    return this.config;
  }

  // TODO: don't use "deepMerge" in "parseIniConfig"
  private parseIniConfig = (filename: string, mergeTarget: any, isLndConfig: boolean) => {
    if (fs.existsSync(filename)) {
      try {
        const config = ini.parse(fs.readFileSync(filename, 'utf-8'))['Application Options'];

        if (isLndConfig) {
          const configLND: LndConfig = config;
          if (config.listen) {
            const listen = splitListen(config.listen);
            mergeTarget.host = listen.host;
            mergeTarget.port = listen.port;
          }
          deepMerge(mergeTarget, configLND);
        } else {
          const configClient: RpcConfig = config;
          if (config.listen) {
            const listen = splitListen(config.listen);
            mergeTarget.host = listen.host;
            mergeTarget.port = listen.port;
          }
          deepMerge(mergeTarget, configClient);
        }
      } catch (error) {
        throw Errors.COULD_NOT_PARSE_CONFIG(filename, JSON.stringify(error));
      }
    }
  }

  private parseCurrency = (args: string[], config: CurrencyConfig[]) => {
    args.forEach((currency) => {
      const currencyJSON = JSON.parse(currency);
      for (let i = 0; i < config.length; i += 1) {
        const confCurrency = config[i];
        const hasSymbol = currencyJSON.symbol === confCurrency.symbol;
        const hasNetwork = currencyJSON.network === confCurrency.network;
        if (hasSymbol && hasNetwork) {
          config[i] = { ...config[i], ...currencyJSON };
          break;
        } else if (i === config.length - 1) {
          config.push(currencyJSON);
          break;
        }
      }
    });
    return {
      currencies: config,
    };
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
}

export default Config;
export { ConfigType };
