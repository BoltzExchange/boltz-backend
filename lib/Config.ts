import fs from 'fs';
import path from 'path';
import toml from 'toml';
import { Arguments } from 'yargs';
import Errors from './consts/Errors';
import { GrpcConfig } from './grpc/GrpcServer';
import { ChainConfig } from './chain/ChainClient';
import { LndConfig } from './lightning/LndClient';
import { Chain, Symbol, Network } from './consts/Enums';
import { deepMerge, resolveHome, getServiceDataDir } from './Utils';

type ServiceOptions = {
  configpath?: string;
};

type CurrencyConfig = {
  symbol: Symbol,
  network: Network;
  chain: ChainConfig & ServiceOptions;
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
  lndpath: string;
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

      lndpath: getServiceDataDir('lnd'),

      currencies: [
        {
          symbol: Symbol.BTC,
          network: Network.Testnet,
          chain: {
            host: '127.0.0.1',
            port: 18334,
            rpcuser: 'user',
            rpcpass: 'user',
          },
          lnd: {
            host: '127.0.0.1',
            port: 10009,
            certpath: path.join(getServiceDataDir('lnd'), 'tls.cert'),
            macaroonpath: path.join(getServiceDataDir('lnd'), 'data', 'chain', Chain.BTC, Network.Testnet, 'admin.macaroon'),
          },
        },
        {
          symbol: Symbol.LTC,
          network: Network.Testnet,
          chain: {
            host: '127.0.0.1',
            port: 19334,
            rpcuser: 'user',
            rpcpass: 'user',
          },
          lnd: {
            host: '127.0.0.1',
            port: 11009,
            certpath: path.join(getServiceDataDir('lnd'), 'tls.cert'),
            macaroonpath: path.join(getServiceDataDir('lnd'), 'data', 'chain', Chain.LTC, Network.Testnet, 'admin.macaroon'),
          },
        },
      ],
    };
  }

  /**
   * This loads arguments specified by the user either with a TOML config file or via command line arguments
   */
  public load = (args: Arguments<any>): ConfigType => {
    const boltzConfigFile = this.resolveConfigPath(args.configpath, this.config.configpath);

    if (fs.existsSync(boltzConfigFile)) {
      const tomlConfig = this.parseTomlConfig(boltzConfigFile);
      deepMerge(this.config, tomlConfig);
    }

    if (args.datadir) {
      this.config.datadir = resolveHome(args.datadir);
      deepMerge(this.config, this.getDataDirPaths(this.config.datadir));
    } else {
      const datadir = resolveHome(this.config.datadir);

      if (!fs.existsSync(datadir)) {
        fs.mkdirSync(datadir);
      }

      this.config.datadir = datadir;
      deepMerge(this.config, this.getDataDirPaths(this.config.datadir));
    }

    if (args.currencies) {
      const currencies = this.parseCurrency(args.currencies, this.config.currencies);
      args.currencies = currencies.currencies;
      deepMerge(this.config, currencies);
    }

    deepMerge(this.config, args);
    return this.config;
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

      grpc: {
        certpath: path.join(dataDir, 'tls.cert'),
        keypath: path.join(dataDir, 'tls.key'),
      },
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
