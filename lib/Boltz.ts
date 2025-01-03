import Tracing from './Tracing';
import { Networks } from 'boltz-core';
import { Networks as LiquidNetworks } from 'boltz-core/dist/lib/liquid';
import { Arguments } from 'yargs';
import Config, { ConfigType, TokenConfig } from './Config';
import { setup } from './Core';
import { registerExitHandler } from './ExitHandler';
import Logger from './Logger';
import Profiling from './Profiling';
import Prometheus from './Prometheus';
import { formatError, getVersion } from './Utils';
import VersionCheck from './VersionCheck';
import Api from './api/Api';
import ChainClient, {
  BlockChainInfoScanned,
  IChainClient,
} from './chain/ChainClient';
import ElementsWrapper from './chain/ElementsWrapper';
import { CurrencyType } from './consts/Enums';
import { NetworkInfo } from './consts/Types';
import Database from './db/Database';
import ChainTip from './db/models/ChainTip';
import ChainTipRepository from './db/repositories/ChainTipRepository';
import GrpcServer from './grpc/GrpcServer';
import GrpcService from './grpc/GrpcService';
import { LightningClient } from './lightning/LightningClient';
import LndClient from './lightning/LndClient';
import ClnClient from './lightning/cln/ClnClient';
import NotificationClient from './notifications/NotificationClient';
import NotificationProvider from './notifications/NotificationProvider';
import Blocks from './service/Blocks';
import CountryCodes from './service/CountryCodes';
import Service from './service/Service';
import Sidecar from './sidecar/Sidecar';
import NodeSwitch from './swap/NodeSwitch';
import WalletManager, { Currency } from './wallet/WalletManager';
import EthereumManager from './wallet/ethereum/EthereumManager';
import { Ethereum, NetworkDetails, Rsk } from './wallet/ethereum/EvmNetworks';

class Boltz {
  private readonly logger: Logger;
  private readonly config: ConfigType;

  private readonly service!: Service;
  private readonly walletManager: WalletManager;

  private readonly currencies: Map<string, Currency>;

  private readonly db: Database;
  private readonly notifications?: NotificationProvider;

  private readonly api!: Api;
  private readonly blocks: Blocks;
  private readonly countryCodes: CountryCodes;
  private readonly grpcServer!: GrpcServer;
  private readonly prometheus: Prometheus;

  private readonly ethereumManagers: EthereumManager[];

  private readonly sidecar: Sidecar;

  constructor(config: Arguments<any>) {
    this.config = new Config().load(config);
    this.logger = new Logger(
      this.config.loglevel,
      this.config.logpath,
      this.config.lokiEndpoint,
      this.config.network,
    );
    if (this.config.otlpEndpoint && this.config.network) {
      this.logger.debug('Enabling OpenTelemetry');
      Tracing.init(this.config.otlpEndpoint, this.config.network);
    } else {
      this.logger.warn(
        'Not enabling OpenTelemetry because it was not configured',
      );
    }

    if (this.config.profilingEndpoint && this.config.network) {
      this.logger.debug('Enabling profiling');
      Profiling.init(this.config.profilingEndpoint, this.config.network);
    } else {
      this.logger.warn('Not enabling profiling because it was not configured');
    }

    this.logger.info(
      `Starting Boltz ${getVersion()} (Node.js ${process.version}; NODE_ENV=${process.env.NODE_ENV})`,
    );

    this.db = new Database(
      this.logger,
      this.config.dbpath,
      this.config.postgres,
      false,
    );

    Sidecar.start(this.logger, this.config);
    registerExitHandler(async () => {
      await this.grpcServer.close();
      await this.db.close();

      await Profiling.stop();
      await Tracing.stop();

      await this.logger.close();
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.log(promise);
      this.logger.error(`Unhandled rejection: ${formatError(reason)}`);
    });

    process.on('uncaughtException', (error) => {
      this.logger.error(`Uncaught exception: ${formatError(error)}`);
    });

    process.on('exit', (code) => {
      Sidecar.stop().then();
      (code === 0 ? this.logger.debug : this.logger.error)(
        `Application shutting down with code: ${code}`,
      );
    });

    this.ethereumManagers = [
      { name: Ethereum.name, isRsk: false, config: this.config.ethereum },
      { name: Rsk.name, isRsk: true, config: this.config.rsk },
    ]
      .map(({ name, isRsk, config }) => {
        try {
          return new EthereumManager(this.logger, isRsk, config!);
        } catch (error) {
          this.logger.warn(
            `Disabled ${name} integration because: ${formatError(error)}`,
          );
        }

        return undefined;
      })
      .filter((manager): manager is EthereumManager => manager !== undefined);

    this.currencies = this.parseCurrencies();

    const walletCurrencies = Array.from(this.currencies.values());

    this.walletManager = new WalletManager(
      this.logger,
      this.config.mnemonicpath,
      this.config.mnemonicpathEvm,
      walletCurrencies,
      this.ethereumManagers,
    );

    this.blocks = new Blocks(this.logger, this.config.blocks);

    this.sidecar = new Sidecar(
      this.logger,
      this.config.sidecar,
      this.config.datadir,
    );

    const notificationClient = new NotificationClient(
      this.logger,
      this.sidecar,
    );

    try {
      this.service = new Service(
        this.logger,
        notificationClient,
        this.config,
        this.walletManager,
        new NodeSwitch(this.logger, this.config.nodeSwitch),
        this.currencies,
        this.blocks,
        this.sidecar,
      );

      if (notificationClient !== undefined) {
        this.notifications = new NotificationProvider(
          this.logger,
          this.sidecar,
          this.service,
          this.walletManager,
          this.config.notification,
          notificationClient,
          [this.config.liquid].concat(this.config.currencies),
          this.config.ethereum.tokens,
        );
      } else {
        this.logger.warn(
          'Not enabling notifications because no client is available',
        );
      }

      this.grpcServer = new GrpcServer(
        this.logger,
        this.config.grpc,
        new GrpcService(this.logger, this.service),
      );

      this.countryCodes = new CountryCodes(this.logger, this.config.marking);
      this.api = new Api(
        this.logger,
        this.config.api,
        this.service,
        this.countryCodes,
      );

      this.prometheus = new Prometheus(
        this.logger,
        this.service,
        this.api,
        this.config.prometheus,
        this.config.pairs,
      );
    } catch (error) {
      this.logger.error(`Could not start Boltz: ${formatError(error)}`);
      Sidecar.stop().then();

      // eslint-disable-next-line n/no-process-exit
      process.exit(1);
    }
  }

  public start = async (): Promise<void> => {
    await setup();

    try {
      await this.db.migrate(this.currencies);
      await this.db.init();

      await this.sidecar.connect(this.service.eventHandler, this.api.swapInfos);
      await this.sidecar.validateVersion();
      await this.sidecar.start();
      this.logger.info('Connected to sidecar');

      await this.prometheus.start();

      // Query the chain tips now to avoid them being updated after the chain clients are initialized
      const chainTips = await ChainTipRepository.getChainTips();

      await Promise.all(
        Array.from(this.currencies.values()).flatMap((currency) => {
          const prms: Promise<void>[] = [];

          if (currency.chainClient) {
            prms.push(this.connectChainClient(currency.chainClient));
          }

          prms.concat(
            [currency.lndClient, currency.clnClient]
              .filter(
                (client): client is ClnClient | LndClient =>
                  client !== undefined,
              )
              .map((client) => this.connectLightningClient(client)),
          );

          return prms;
        }),
      );

      await this.walletManager.init(this.config.currencies);
      await this.service.init(this.config.pairs);

      await this.service.swapManager.init(
        Array.from(this.currencies.values()),
        this.config.pairs,
      );

      await this.notifications?.init();

      await this.grpcServer.listen();

      await Promise.all([
        this.countryCodes.downloadRanges(),
        this.blocks.updateBlocks(),
      ]);
      await this.api.init();

      // Rescan chains after everything else was initialized to avoid race conditions
      if (chainTips.length === 0) {
        return;
      }

      this.logger.verbose(
        `Starting rescan of chains: ${chainTips
          .map((chainTip) => chainTip.symbol)
          .join(', ')}`,
      );

      const logRescan = (chainTip: ChainTip) => {
        this.logger.debug(
          `Rescanning ${chainTip.symbol} from height: ${chainTip.height}`,
        );
      };

      const rescanPromises: Promise<void>[] = [];

      for (const chainTip of chainTips) {
        const ethereumManager = this.ethereumManagers.find(
          (manager) => manager.networkDetails.symbol === chainTip.symbol,
        );

        if (ethereumManager !== undefined) {
          logRescan(chainTip);
          rescanPromises.push(
            ethereumManager.contractEventHandler.rescan(chainTip.height),
          );
        } else {
          if (!this.currencies.has(chainTip.symbol)) {
            this.logger.warn(
              `Not rescanning ${chainTip.symbol} because no chain client was configured`,
            );
            continue;
          }

          const { chainClient } = this.currencies.get(chainTip.symbol)!;

          if (chainClient) {
            logRescan(chainTip);
            rescanPromises.push(chainClient.rescanChain(chainTip.height));
          }
        }
      }

      await Promise.all(rescanPromises);
      await this.sidecar.rescanMempool();
      this.logger.info('Finished rescanning');

      await this.db.backFillMigrations(this.currencies);
    } catch (error) {
      this.logger.error(`Could not initialize Boltz: ${formatError(error)}`);
      console.log(error);
      Sidecar.stop().then();

      // eslint-disable-next-line n/no-process-exit
      process.exit(1);
    }
  };

  private connectChainClient = async (client: IChainClient) => {
    const formatChainInfo = (
      networkInfo: (NetworkInfo & { lowball?: NetworkInfo }) | undefined,
      blockchainInfo:
        | (BlockChainInfoScanned & {
            lowball?: BlockChainInfoScanned;
          })
        | undefined,
    ) => {
      if (networkInfo === undefined || blockchainInfo === undefined) {
        return undefined;
      }

      const res: any = {
        version: networkInfo.version,
        protocolversion: networkInfo.protocolversion,
        connections: networkInfo.connections,
        blocks: blockchainInfo.blocks,
        bestblockhash: blockchainInfo.bestblockhash,
        verificationprogress: blockchainInfo.verificationprogress,
      };

      if (networkInfo.lowball && blockchainInfo.lowball) {
        res.lowball = formatChainInfo(
          networkInfo.lowball,
          blockchainInfo.lowball,
        );
      }

      return res;
    };

    const service = `${client.symbol} chain`;

    try {
      await client.connect();

      const blockchainInfo = await client.getBlockchainInfo();
      const networkInfo = await client.getNetworkInfo();

      VersionCheck.checkChainClientVersion(client.symbol, networkInfo.version);

      this.logStatus(service, formatChainInfo(networkInfo, blockchainInfo));
    } catch (error) {
      this.logCouldNotConnect(service, error);
    }
  };

  private connectLightningClient = async (client: LightningClient) => {
    const service = `${client.symbol} ${client.serviceName()}`;

    try {
      await client.connect();

      const info = await client.getInfo();
      VersionCheck.checkLightningVersion(
        client.serviceName(),
        client.symbol,
        info.version,
      );

      if (client instanceof ClnClient) {
        const holdInfo = await client.getHoldInfo();
        this.logger.verbose(
          `${client.symbol} ${ClnClient.serviceNameHold} version: ${holdInfo.version}`,
        );
        VersionCheck.checkLightningVersion(
          ClnClient.serviceNameHold,
          client.symbol,
          holdInfo.version,
        );
      }

      this.logStatus(service, info);
    } catch (error) {
      this.logCouldNotConnect(service, error);
    }
  };

  private parseCurrencies = (): Map<string, Currency> => {
    const result = new Map<string, Currency>();

    this.config.currencies.forEach((currency) => {
      try {
        const chainClient = new ChainClient(
          this.logger,
          currency.chain,
          currency.symbol,
        );

        result.set(currency.symbol, {
          chainClient,
          symbol: currency.symbol,
          type: CurrencyType.BitcoinLike,
          network: Networks[currency.network],
          lndClient:
            currency.lnd !== undefined
              ? new LndClient(this.logger, currency.symbol, currency.lnd)
              : undefined,
          clnClient:
            currency.cln !== undefined
              ? new ClnClient(this.logger, currency.symbol, currency.cln)
              : undefined,
          limits: {
            ...currency,
          },
        });
      } catch (error) {
        this.logger.error(
          `Could not initialize currency ${currency.symbol}: ${
            (error as any).message
          }`,
        );
      }
    });

    [
      { network: Ethereum, config: this.config.ethereum.tokens },
      { network: Rsk, config: this.config.rsk?.tokens },
    ]
      .map((tokens) => {
        const manager = this.ethereumManagers.find(
          (manager) => manager.networkDetails === tokens.network,
        );

        if (manager === undefined) {
          return undefined;
        }

        return {
          ...tokens,
          manager,
        };
      })
      .filter(
        (
          tokens,
        ): tokens is {
          network: NetworkDetails;
          manager: EthereumManager;
          config: TokenConfig[];
        } => tokens !== undefined && tokens.config !== undefined,
      )
      .forEach(({ config, manager, network }) => {
        config.forEach((token) => {
          result.set(token.symbol, {
            symbol: token.symbol,
            provider: manager.provider,
            type:
              token.symbol === network.symbol
                ? CurrencyType.Ether
                : CurrencyType.ERC20,
            limits: {
              ...token,
            },
          });
        });
      });

    if (this.config.liquid) {
      const { symbol, chain, network } = this.config.liquid;
      result.set(symbol, {
        type: CurrencyType.Liquid,
        symbol: symbol,
        network: LiquidNetworks[network],
        chainClient: new ElementsWrapper(this.logger, chain),
        limits: {
          ...this.config.liquid,
        },
      });
    }

    return result;
  };

  private logStatus = (service: string, status: unknown) => {
    this.logger.verbose(
      `${service} status: ${JSON.stringify(status, undefined, 2)}`,
    );
  };

  private logCouldNotConnect = (service: string, error: any) => {
    this.logger.error(`Could not connect to ${service}: ${formatError(error)}`);
  };
}

export default Boltz;
