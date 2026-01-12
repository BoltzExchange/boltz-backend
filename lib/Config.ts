import toml from '@iarna/toml';
import fs from 'fs';
import path from 'path';
import type { Arguments } from 'yargs';
import type { PrometheusConfig } from './Prometheus';
import { deepMerge, getServiceDataDir, resolveHome } from './Utils';
import { Network } from './consts/Enums';
import Errors from './consts/Errors';
import type { PairConfig } from './consts/Types';
import type { RedisConfig } from './db/Redis';
import type { LndConfig } from './lightning/LndClient';
import type { Config as RoutingFeeConfig } from './lightning/RoutingFee';
import type { ClnConfig } from './lightning/cln/Types';
import type { SidecarConfig } from './sidecar/Sidecar';
import type { NodeSwitchConfig } from './swap/NodeSwitch';

type EmailConfig = {
  enabled: boolean;
  host: string;
  port: number;
  secure?: boolean;
  user?: string;
  pass?: string;
  to: string;
  from: string;
  subjectPrefix?: string;
};

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

  maxZeroConfRisk?: number;
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
  noRoute?: string[];
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
  network?: string;
  apiKey?: string;

  endpoint?: string;
};

type ContractsConfig = {
  etherSwap: string;
  erc20Swap: string;
};

type RskConfig = {
  networkName?: string;
  providerEndpoint: string;

  alchemy: EthProviderServiceConfig;

  contracts: ContractsConfig[];

  tokens: TokenConfig[];
};

type EthereumConfig = RskConfig & {
  infura: EthProviderServiceConfig;
};

type ApiConfig = {
  host: string;
  port: number;
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
  cltvDelta: number;
  sweepAmountTrigger?: number;

  scheduleAmountTrigger?: {
    interval: string;
    threshold: number;
  };

  minSwapSizeMultipliers?: MinSwapSizeMultipliersConfig;

  overpayment?: OverPaymentConfig;

  paymentTimeoutMinutes?: number;
};

type ConfigType = {
  datadir: string;

  configpath: string;
  mnemonicpath: string;
  mnemonicpathEvm: string;

  dbpath: string;
  postgres?: PostgresConfig;

  cache?: RedisConfig;

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
  routing: RoutingFeeConfig;

  api: ApiConfig;
  grpc: GrpcConfig;
  rates: RatesConfig;
  notification: NotificationConfig;

  nodeSwitch?: NodeSwitchConfig;

  pairs: PairConfig[];
  currencies: CurrencyConfig[];

  liquid?: BaseCurrencyConfig<LiquidChainConfig>;

  rsk?: RskConfig;
  ethereum: EthereumConfig;

  sidecar: SidecarConfig;

  email?: EmailConfig;
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
        cltvDelta: 20,
      },

      routing: {},

      api: {
        host: '127.0.0.1',
        port: 9001,
      },

      grpc: {
        host: '127.0.0.1',
        port: 9000,
        certificates: path.join(this.dataDir, 'certificates'),
      },

      rates: {
        interval: 1,
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
            user: 'boltz',
            password: '',
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
            user: 'boltz',
            password: '',
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

        contracts: [],

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

    let tomlConfig: any | undefined;

    if (fs.existsSync(boltzConfigFile)) {
      tomlConfig = this.parseTomlConfig(boltzConfigFile);
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

    if (!tomlConfig?.grpc?.certificates) {
      this.config.grpc.certificates = path.join(
        this.config.datadir,
        'certificates',
      );
    }

    deepMerge(this.config, tomlConfig);

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
  EthereumConfig,
  PostgresConfig,
  CurrencyConfig,
  ContractsConfig,
  PreferredWallet,
  OverPaymentConfig,
  LiquidChainConfig,
  BaseCurrencyConfig,
  NotificationConfig,
  EthProviderServiceConfig,
  MinSwapSizeMultipliersConfig,
  EmailConfig,
};
