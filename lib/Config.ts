import toml from '@iarna/toml';
import fs from 'fs';
import path from 'path';
import { Arguments } from 'yargs';
import { PrometheusConfig } from './Prometheus';
import { deepMerge, getServiceDataDir, resolveHome } from './Utils';
import { S3Config } from './backup/providers/S3';
import { Network } from './consts/Enums';
import Errors from './consts/Errors';
import { PairConfig } from './consts/Types';
import { LndConfig } from './lightning/LndClient';
import { ClnConfig } from './lightning/cln/Types';
import { BlocksConfig } from './service/Blocks';
import { MarkingsConfig } from './service/CountryCodes';
import { SidecarConfig } from './sidecar/Sidecar';
import { NodeSwitchConfig } from './swap/NodeSwitch';

type PostgresConfig = {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
};

type ChainConfig = {
  host: string;
  port: number;

  // Cookie file authentication is preferred if both, cookie and user/password, are configured
  cookie?: string;

  user?: string;
  password?: string;

  wallet?: string;

  zmqpubrawtx?: string;
  zmqpubrawblock?: string;
  zmqpubhashblock?: string;

  // API endpoint of a MempoolSpace instance running on the chain of the configured client
  // Comma separated for multiple endpoints
  mempoolSpace?: string;
};

type LiquidChainConfig = ChainConfig & {
  lowball?: ChainConfig;
};

type PreferredWallet = 'lnd' | 'core' | undefined;

type BaseCurrencyConfig<T = ChainConfig> = {
  symbol: string;
  network: Network;

  preferredWallet: PreferredWallet;

  minWalletBalance: number;
  maxWalletBalance?: number;

  maxUnusedWalletBalance?: number;

  maxZeroConfAmount: number;

  chain: T;
};

type RoutingOffsetException = {
  nodeId: string;
  offset: number;
};

type CurrencyConfig = BaseCurrencyConfig & {
  lnd?: LndConfig;
  cln?: ClnConfig;
  routingOffsetExceptions?: RoutingOffsetException[];

  // Max fee ratio for LND's sendPayment
  maxPaymentFeeRatio?: number;

  minLocalBalance: number;
  minRemoteBalance: number;
};

type TokenConfig = {
  symbol: string;

  // Must not be set for Ether
  decimals?: number;
  contractAddress?: string;

  minWalletBalance: number;
  maxWalletBalance?: number;
};

type EthProviderServiceConfig = {
  network: string;
  apiKey: string;
};

type RskConfig = {
  networkName?: string;
  providerEndpoint: string;

  etherSwapAddress: string;
  erc20SwapAddress: string;

  tokens: TokenConfig[];
};

type EthereumConfig = RskConfig & {
  infura: EthProviderServiceConfig;
  alchemy: EthProviderServiceConfig;
};

type ApiConfig = {
  host: string;
  port: number;
  cors?: string | string[];
};

type GrpcConfig = {
  host: string;
  port: number;
  disableSsl?: boolean;
  certificates: string;
};

type RatesConfig = {
  interval: number;
};

type BackupConfig = {
  // The interval has to be a cron schedule expression
  interval: string;

  simpleStorage?: S3Config;
};

type NotificationConfig = {
  mattermostUrl: string;

  token: string;
  channel: string;
  channelAlerts?: string;

  prefix: string;
  interval: number;
};

type OverPaymentConfig = {
  exemptAmount?: number;
  maxPercentage?: number;
};

type MinSwapSizeMultipliersConfig = {
  submarine?: number;
  reverse?: number;
  chain?: number;
};

type SwapConfig = {
  deferredClaimSymbols: string[];
  batchClaimInterval: string;
  expiryTolerance: number;

  minSwapSizeMultipliers?: MinSwapSizeMultipliersConfig;

  overpayment?: OverPaymentConfig;
};

type ConfigType = {
  datadir: string;

  configpath: string;
  mnemonicpath: string;
  mnemonicpathEvm: string;

  dbpath: string;
  postgres?: PostgresConfig;

  logpath: string;
  loglevel: string;

  network?: string;

  lokiEndpoint?: string;
  otlpEndpoint?: string;
  profilingEndpoint?: string;

  prometheus?: PrometheusConfig;

  retryInterval: number;

  prepayminerfee: boolean;
  swapwitnessaddress: boolean;

  swap: SwapConfig;

  marking: MarkingsConfig;
  blocks: BlocksConfig;

  api: ApiConfig;
  grpc: GrpcConfig;
  rates: RatesConfig;
  backup: BackupConfig;
  notification: NotificationConfig;

  nodeSwitch?: NodeSwitchConfig;

  pairs: PairConfig[];
  currencies: CurrencyConfig[];

  liquid?: BaseCurrencyConfig<LiquidChainConfig>;

  rsk?: RskConfig;
  ethereum: EthereumConfig;

  sidecar: SidecarConfig;
};

class Config {
  // Default paths
  public static defaultDataDir = getServiceDataDir('boltz');

  public static defaultConfigPath = 'boltz.conf';
  public static defaultMnemonicPath = 'seed.dat';
  public static defaultMnemonicPathEvm = 'seed.dat';
  public static defaultLogPath = 'boltz.log';
  public static defaultDbPath = 'boltz.db';

  public static defaultPrivatekeyPath = 'backupPrivatekey.pem';

  private readonly config: ConfigType;
  private readonly dataDir = Config.defaultDataDir;

  /**
   * The constructor sets the default values
   */
  constructor() {
    this.dataDir = getServiceDataDir('boltz');

    const { dbpath, logpath, configpath, mnemonicpath, mnemonicpathEvm } =
      this.getDataDirPaths(this.dataDir);

    this.config = {
      configpath,
      mnemonicpath,
      mnemonicpathEvm,
      dbpath,
      logpath,

      datadir: this.dataDir,
      loglevel: this.getDefaultLogLevel(),

      retryInterval: 15,

      prepayminerfee: false,
      swapwitnessaddress: false,

      swap: {
        deferredClaimSymbols: ['L-BTC'],
        batchClaimInterval: '*/15 * * * *',
        expiryTolerance: 120,
      },

      marking: {
        ipV4Ranges:
          'https://cdn.jsdelivr.net/npm/@ip-location-db/asn-country/asn-country-ipv4-num.csv',
        ipV6Ranges:
          'https://cdn.jsdelivr.net/npm/@ip-location-db/asn-country/asn-country-ipv6-num.csv',
      },

      blocks: {},

      api: {
        host: '127.0.0.1',
        port: 9001,
        cors: '*',
      },

      grpc: {
        host: '127.0.0.1',
        port: 9000,
        certificates: path.join(this.dataDir, 'certificates'),
      },

      rates: {
        interval: 1,
      },

      backup: {
        interval: '0 0 * * *',
      },

      notification: {
        mattermostUrl: '',

        token: '',
        channel: '',

        prefix: '',
        interval: 1,
      },

      pairs: [
        {
          base: 'LTC',
          quote: 'BTC',
          fee: 5,
          minSwapAmount: 10000,
          maxSwapAmount: 10000000,
        },
        {
          base: 'BTC',
          quote: 'BTC',
          fee: 1,
          rate: 1,
          minSwapAmount: 1000,
          maxSwapAmount: 10000000,
        },
        {
          base: 'LTC',
          quote: 'LTC',
          fee: 1,
          rate: 1,
          minSwapAmount: 2000,
          maxSwapAmount: 20000000,
        },
      ],

      currencies: [
        {
          symbol: 'BTC',
          network: Network.Testnet,

          preferredWallet: 'lnd',

          minWalletBalance: 1000000,

          minLocalBalance: 500000,
          minRemoteBalance: 500000,

          maxZeroConfAmount: 200000,

          chain: {
            host: '127.0.0.1',
            port: 18334,
            cookie: 'docker/regtest/data/core/cookies/.bitcoin-cookie',
          },

          lnd: {
            host: '127.0.0.1',
            port: 10009,
            certpath: path.join(getServiceDataDir('lnd'), 'tls.cert'),
            macaroonpath: path.join(
              getServiceDataDir('lnd'),
              'data',
              'chain',
              'bitcoin',
              Network.Testnet,
              'admin.macaroon',
            ),
            maxPaymentFeeRatio: 0.03,
          },
        },
        {
          symbol: 'LTC',
          network: Network.Testnet,

          preferredWallet: 'lnd',

          minWalletBalance: 100000000,

          minLocalBalance: 50000000,
          minRemoteBalance: 50000000,

          maxZeroConfAmount: 20000000,

          chain: {
            host: '127.0.0.1',
            port: 19334,
            cookie: 'docker/regtest/data/core/cookies/.litecoin-cookie',
          },

          lnd: {
            host: '127.0.0.1',
            port: 11009,
            certpath: path.join(getServiceDataDir('lnd'), 'tls.cert'),
            macaroonpath: path.join(
              getServiceDataDir('lnd'),
              'data',
              'chain',
              'litecoin',
              Network.Testnet,
              'admin.macaroon',
            ),
            maxPaymentFeeRatio: 0.03,
          },
        },
      ],

      ethereum: {
        providerEndpoint: '',

        infura: {
          apiKey: '',
          network: 'rinkeby',
        },

        alchemy: {
          apiKey: '',
          network: 'rinkeby',
        },

        etherSwapAddress: '',
        erc20SwapAddress: '',

        tokens: [],
      },

      sidecar: {} as any,
    };
  }

  /**
   * This loads arguments specified by the user either with a TOML config file or via command line arguments
   */
  public load = (args: Arguments<any>): ConfigType => {
    const boltzConfigFile = this.resolveConfigPath(
      args.configpath,
      this.config.configpath,
    );

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
      const currencies = this.parseCurrency(
        args.currencies,
        this.config.currencies,
      );
      args.currencies = currencies.currencies;
      deepMerge(this.config, currencies);
    }

    deepMerge(this.config, args);

    this.config.configpath = boltzConfigFile;
    return this.config;
  };

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
  };

  private parseTomlConfig = (filename: string): any => {
    if (fs.existsSync(filename)) {
      try {
        const tomlFile = fs.readFileSync(filename, 'utf-8');
        const parsedToml = toml.parse(tomlFile) as ConfigType;

        parsedToml.configpath = filename;

        return parsedToml;
      } catch (error) {
        throw Errors.COULD_NOT_PARSE_CONFIG(filename, JSON.stringify(error));
      }
    }
  };

  private getDataDirPaths = (dataDir: string) => {
    return {
      configpath: path.join(dataDir, Config.defaultConfigPath),
      mnemonicpath: path.join(dataDir, Config.defaultMnemonicPath),
      mnemonicpathEvm: path.join(dataDir, Config.defaultMnemonicPathEvm),
      dbpath: path.join(dataDir, Config.defaultDbPath),
      logpath: path.join(dataDir, Config.defaultLogPath),
    };
  };

  private resolveConfigPath = (configPath: string, fallback: string) => {
    return configPath ? resolveHome(configPath) : fallback;
  };

  private getDefaultLogLevel = (): string => {
    return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
  };
}

export default Config;
export {
  ApiConfig,
  RskConfig,
  ConfigType,
  GrpcConfig,
  SwapConfig,
  ChainConfig,
  TokenConfig,
  BackupConfig,
  EthereumConfig,
  PostgresConfig,
  CurrencyConfig,
  PreferredWallet,
  OverPaymentConfig,
  LiquidChainConfig,
  BaseCurrencyConfig,
  NotificationConfig,
  EthProviderServiceConfig,
  MinSwapSizeMultipliersConfig,
};
