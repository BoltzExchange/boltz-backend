import fs from 'fs';
import { Arguments } from 'yargs';
import { Networks } from 'boltz-core';
import { generateMnemonic } from 'bip39';
import Api from './api/Api';
import Logger from './Logger';
import Report from './data/Report';
import Database from './db/Database';
import { formatError } from './Utils';
import Service from './service/Service';
import VersionCheck from './VersionCheck';
import GrpcServer from './grpc/GrpcServer';
import ChainTip from './db/models/ChainTip';
import GrpcService from './grpc/GrpcService';
import LndClient from './lightning/LndClient';
import ChainClient from './chain/ChainClient';
import Config, { ConfigType } from './Config';
import { CurrencyType } from './consts/Enums';
import BackupScheduler from './backup/BackupScheduler';
import ChainTipRepository from './db/ChainTipRepository';
import EthereumManager from './wallet/ethereum/EthereumManager';
import WalletManager, { Currency } from './wallet/WalletManager';
import NotificationProvider from './notifications/NotificationProvider';

class Boltz {
  private readonly logger: Logger;
  private readonly config: ConfigType;

  private readonly service!: Service;
  private readonly walletManager: WalletManager;

  private readonly currencies: Map<string, Currency>;

  private db: Database;
  private notifications!: NotificationProvider;

  private api!: Api;
  private grpcServer!: GrpcServer;

  private readonly ethereumManager?: EthereumManager;

  constructor(config: Arguments<any>) {
    this.config = new Config().load(config);
    this.logger = new Logger(this.config.loglevel, this.config.logpath);

    process.on('unhandledRejection', ((reason) => {
      this.logger.error(`Unhandled rejection: ${formatError(reason)}`);
    }));

    this.db = new Database(this.logger, this.config.dbpath);

    try {
      this.ethereumManager = new EthereumManager(
        this.logger,
        this.config.ethereum,
      );
    } catch (error) {
      this.logger.warn(`Disabled Ethereum integration because: ${formatError(error)}`);
    }

    this.currencies = this.parseCurrencies();

    const walletCurrencies = Array.from(this.currencies.values());

    if (fs.existsSync(this.config.mnemonicpath)) {
      this.walletManager = new WalletManager(this.logger, this.config.mnemonicpath, walletCurrencies, this.ethereumManager);
    } else {
      const mnemonic = generateMnemonic();
      this.logger.info(`Generated new mnemonic: ${mnemonic}`);

      this.walletManager = WalletManager.fromMnemonic(this.logger, mnemonic, this.config.mnemonicpath, walletCurrencies, this.ethereumManager);
    }

    try {
      this.service = new Service(
        this.logger,
        this.config,
        this.walletManager,
        this.currencies,
      );

      const backup = new BackupScheduler(
        this.logger,
        this.config.dbpath,
        this.config.backup,
        this.service.eventHandler,
        new Report(
          this.service.swapManager.swapRepository,
          this.service.swapManager.reverseSwapRepository,
        ),
      );

      this.notifications = new NotificationProvider(
        this.logger,
        this.service,
        backup,
        this.config.notification,
        this.config.currencies,
        this.config.ethereum.tokens,
      );

      this.grpcServer = new GrpcServer(
        this.logger,
        this.config.grpc,
        new GrpcService(this.service),
      );

      this.api = new Api(
        this.logger,
        this.config.api,
        this.service,
      );
    } catch (error) {
      this.logger.error(`Could not start Boltz: ${formatError(error)}`);
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }
  }

  public start = async (): Promise<void> => {
    try {
      await this.db.migrate(this.currencies);
      await this.db.init();

      const chainTipRepository = new ChainTipRepository();

      // Query the chain tips now to avoid them being updated after the chain clients are initialized
      const chainTips = await chainTipRepository.getChainTips();

      for (const [, currency] of this.currencies) {
        if (currency.chainClient) {
          await this.connectChainClient(currency.chainClient, chainTipRepository);

          if (currency.lndClient) {
            await this.connectLnd(currency.lndClient);
          }
        }
      }

      await this.walletManager.init(chainTipRepository);
      await this.service.init(this.config.pairs);

      await this.service.swapManager.init(Array.from(this.currencies.values()));

      await this.notifications.init();

      this.grpcServer.listen();

      await this.api.init();

      // Rescan chains after everything else was initialized to avoid race conditions
      if (chainTips.length === 0) {
        return;
      }

      this.logger.verbose(`Starting rescan of chains: ${chainTips.map(chainTip => chainTip.symbol).join(', ')}`);

      const logRescan = (chainTip: ChainTip) => {
        this.logger.debug(`Rescanning ${chainTip.symbol} from height: ${chainTip.height}`);
      };

      const rescanPromises: Promise<void>[] = [];

      for (const chainTip of chainTips) {
        if (chainTip.symbol === 'ETH') {
          if (this.walletManager.ethereumManager) {
            logRescan(chainTip);
            rescanPromises.push(this.walletManager.ethereumManager.contractEventHandler.rescan(chainTip.height));
          }
        } else {
          const { chainClient } = this.currencies.get(chainTip.symbol)!;

          if (chainClient) {
            logRescan(chainTip);
            rescanPromises.push(chainClient.rescanChain(chainTip.height));
          }
        }
      }

      await Promise.all(rescanPromises);
      this.logger.verbose('Finished rescanning');
    } catch (error) {
      this.logger.error(`Could not initialize Boltz: ${formatError(error)}`);
      console.log(error);
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }
  }

  private connectChainClient = async (client: ChainClient, chainTipRepository: ChainTipRepository) => {
    const service = `${client.symbol} chain`;

    try {
      await client.connect(chainTipRepository);

      const blockchainInfo = await client.getBlockchainInfo();
      const networkInfo = await client.getNetworkInfo();

      VersionCheck.checkChainClientVersion(client.symbol, networkInfo.version);

      this.logStatus(service, {
        version: networkInfo.version,
        protocolversion: networkInfo.protocolversion,
        connections: networkInfo.connections,
        blocks: blockchainInfo.blocks,
        bestblockhash: blockchainInfo.bestblockhash,
        verificationprogress: blockchainInfo.verificationprogress,
      });
    } catch (error) {
      this.logCouldNotConnect(service, error);
    }
  }

  private connectLnd = async (client: LndClient) => {
    const service = `${client.symbol} LND`;

    try {
      await client.connect();

      const info = await client.getInfo();

      VersionCheck.checkLndVersion(client.symbol, info.version);

      // The featuresMap is just annoying to see on startup
      info.featuresMap = undefined as any;

      this.logStatus(service, info);
    } catch (error) {
      this.logCouldNotConnect(service, error);
    }
  }

  private parseCurrencies = (): Map<string, Currency> => {
    const result = new Map<string, Currency>();

    this.config.currencies.forEach((currency) => {
      try {
        const chainClient = new ChainClient(this.logger, currency.chain, currency.symbol);

        let lndClient: LndClient | undefined;

        if (currency.lnd) {
          lndClient = new LndClient(this.logger, currency.symbol, currency.lnd);
        }

        result.set(currency.symbol, {
          lndClient,
          chainClient,
          symbol: currency.symbol,
          type: CurrencyType.BitcoinLike,
          network: Networks[currency.network],
          limits: {
            ...currency,
          },
        });
      } catch (error) {
        this.logger.error(`Could not initialize currency ${currency.symbol}: ${error.message}`);
      }
    });

    this.config.ethereum.tokens.forEach((token) => {
      result.set(token.symbol, {
        symbol: token.symbol,
        type: token.symbol === 'ETH' ? CurrencyType.Ether : CurrencyType.ERC20,
        limits: {
          ...token,
        },
        provider: this.ethereumManager?.provider,
      });
    });

    return result;
  }

  private logStatus = (service: string, status: unknown) => {
    this.logger.verbose(`${service} status: ${JSON.stringify(status, undefined, 2)}`);
  }

  private logCouldNotConnect = (service: string, error: any) => {
    this.logger.error(`Could not connect to ${service}: ${formatError(error)}`);
  }
}

export default Boltz;
