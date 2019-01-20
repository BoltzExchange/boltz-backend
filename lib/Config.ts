import fs from 'fs';
import path from 'path';
import toml from 'toml';
import ini from 'ini';
import { Arguments } from 'yargs';
import Errors from './consts/Errors';
import { Chain, Symbol, Network } from './consts/Enums';
import { RpcConfig } from './RpcClient';
import { GrpcConfig } from './grpc/GrpcServer';
import { LndConfig } from './lightning/LndClient';
import { deepMerge, resolveHome, getServiceDataDir, splitListen } from './Utils';

type ServiceOptions = {
  configpath?: string;
};

type CurrencyConfig = {
  symbol: Symbol,
  network: Network;
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
  network: Network,

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
      network: this.getDefaultNetwork(),

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
            certpath: path.join(getServiceDataDir('btcd'), 'rpc.cert'),
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
            certpath: path.join(getServiceDataDir('ltcd'), 'rpc.cert'),
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

    if (args.network) {
      const network = this.parseNetwork(args.network, this.config.currencies);
      deepMerge(this.config, network);
    }

    if (args.lndpath) {
      this.config.lndpath = args.lndpath;
      const currencies = this.parseLndPath(this.config.currencies, this.config.lndpath);
      deepMerge(this.config, { currencies, lndpath: args.lndpath });
    }

    if (args.btcd) {
      const currencies = this.config.currencies;
      currencies[0] = { ...currencies[0], ...this.parseIniConfig(args.btcd, this.config.network, this.config.lndpath, currencies[0]) };
      deepMerge(this.config, currencies);
    }

    if (args.ltcd) {
      const currencies = this.config.currencies;
      currencies[1] = { ...currencies[1], ...this.parseIniConfig(args.ltcd, this.config.network, this.config.lndpath, currencies[1]) };
      deepMerge(this.config, currencies);
    }

    if (args.currencies) {
      const currencies = this.parseCurrency(args.currencies, this.config.currencies);
      args.currencies = currencies.currencies;
      deepMerge(this.config, currencies);
    }

    deepMerge(this.config, args);
    return this.config;
  }

  private parseIniConfig = (
    args: { configpath: string, lndport?: string, lndhost?: string }, network: string, lndpath: string, currency: CurrencyConfig) => {
    if (fs.existsSync(args.configpath)) {
      const { lndhost: host, lndport: port } = args;
      let config;
      try {
        const { rpcuser, rpcpass, rpclisten } = ini.parse(fs.readFileSync(args.configpath, 'utf-8'))['Application Options'];
        const listen = rpclisten ? splitListen(rpclisten) : rpclisten;
        const uri = port && host ? `${host}:${port}` : undefined;
        const lndConfig = this.parseLndServiceConfig(currency, network, lndpath, uri);
        config = {
          network,
          chain: {
            rpcuser,
            rpcpass,
            host: listen ? listen.host : currency.chain.host,
            port: listen ? listen.port : currency.chain.port,
            certpath: path.join(path.dirname(args.configpath), 'rpc.cert'),
          },
          ...lndConfig,
        };
      } catch (error) {
        throw Errors.COULD_NOT_PARSE_CONFIG(args.configpath, JSON.stringify(error));
      }
      return config;
    }
  }

  private parseLndServiceConfig = (currency: CurrencyConfig, network: string, lndpath: string, lndlisten?: string) => {
    return {
      lnd: {
        host: lndlisten ? splitListen(lndlisten).host : currency.lnd!.host,
        port: lndlisten ? parseInt(splitListen(lndlisten).port, 0) : currency.lnd!.port,
        certpath: path.join(lndpath, 'tls.cert'),
        macaroonpath: path.join(lndpath, 'data', 'chain', Chain[currency.symbol], network, 'admin.macaroon'),
      },
    };
  }

  private parseNetwork = (network: string, currencies: CurrencyConfig[]) => {
    const net = network[0].toUpperCase() + network.slice(1);
    currencies.forEach(curr => curr.network = Network[net]);
    return {
      network,
      currencies,
    };
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

  private parseLndPath = (currencies: CurrencyConfig[], lndpath: string) => {
    currencies.forEach((curr) => {
      if (curr.lnd) {
        const net = curr.network[0].toUpperCase() + curr.network.slice(1);
        curr.lnd.certpath = path.join(lndpath, 'tls.cert');
        curr.lnd.macaroonpath = path.join(lndpath, 'data', 'chain', Chain[curr.symbol], Network[net], 'admin.macaroon');
      }
    });
    return currencies;
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

  private getDefaultNetwork = (): Network => {
    return process.env.NODE_ENV === 'production' ? Network.Testnet : Network.Simnet;
  }
}

export default Config;
export { ConfigType };
