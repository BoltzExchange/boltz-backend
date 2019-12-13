import fs from 'fs';
import { Arguments } from 'yargs';
import { Networks } from 'boltz-core';
import { generateMnemonic } from 'bip39';
import Api from './api/Api';
import Logger from './Logger';
import Report from './data/Report';
import Database from './db/Database';
import Service from './service/Service';
import GrpcServer from './grpc/GrpcServer';
import GrpcService from './grpc/GrpcService';
import SwapManager from './swap/SwapManager';
import LndClient from './lightning/LndClient';
import ChainClient from './chain/ChainClient';
import Config, { ConfigType } from './Config';
import { stringify, formatError } from './Utils';
import BackupScheduler from './backup/BackupScheduler';
import WalletManager, { Currency } from './wallet/WalletManager';
import NotificationProvider from './notifications/NotificationProvider';

class Boltz {
  private logger: Logger;
  private config: ConfigType;

  private db: Database;

  private currencies = new Map<string, Currency>();

  private swapManager: SwapManager;
  private walletManager: WalletManager;

  private service!: Service;
  private notifications!: NotificationProvider;

  private api!: Api;
  private grpcServer!: GrpcServer;

  constructor(config: Arguments<any>) {
    this.config = new Config().load(config);
    this.logger = new Logger(this.config.logpath, this.config.loglevel);

    this.db = new Database(this.logger, this.config.dbpath);

    this.parseCurrencies();

    const walletCurrencies = Array.from(this.currencies.values());

    if (fs.existsSync(this.config.mnemonicpath)) {
      this.walletManager = new WalletManager(this.logger, walletCurrencies, this.config.mnemonicpath);
    } else {
      const mnemonic = generateMnemonic();
      this.logger.info(`Generated new mnemonic: ${mnemonic}`);

      this.walletManager = WalletManager.fromMnemonic(this.logger, mnemonic, this.config.mnemonicpath, walletCurrencies);
    }

    this.swapManager = new SwapManager(
      this.logger,
      this.walletManager,
      Array.from(this.currencies.values()),
    );

    try {
      this.service = new Service(
        this.logger,
        this.config,
        this.swapManager,
        this.walletManager,
        this.currencies,
        this.config.rates.interval,
      );

      const backup = new BackupScheduler(
        this.logger,
        this.config.dbpath,
        this.config.backup,
        this.service.eventHandler,
        new Report(
          this.service.swapRepository,
          this.service.reverseSwapRepository,
        ),
      );

      this.notifications = new NotificationProvider(
        this.logger,
        this.service,
        backup,
        this.config.notification,
        this.config.currencies,
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
      this.logger.error(`Could not start Boltz: ${stringify(error)}`);
      process.exit(1);
    }
  }

  public start = async () => {
    try {
      await this.db.init();

      const promises: Promise<any>[] = [];

      this.currencies.forEach((currency) => {
        promises.push(this.connectChainClient(currency.chainClient));

        if (currency.lndClient) {
          promises.push(this.connectLnd(currency.lndClient));
        }
      });

      await Promise.all(promises);

      await this.walletManager.init();
      await this.service.init(this.config.pairs);

      await this.notifications.init();

      this.grpcServer.listen();

      await this.api.init();
    } catch (error) {
      this.logger.error(`Could not initialize Boltz: ${JSON.stringify(error)}`);
      process.exit(1);
    }
  }

  private connectChainClient = async (client: ChainClient) => {
    const service = `${client.symbol} chain`;

    try {
      await client.connect();

      const blockchainInfo = await client.getBlockchainInfo();
      const networkInfo = await client.getNetworkInfo();

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
      this.logStatus(service, info);
    } catch (error) {
      this.logCouldNotConnect(service, error);
    }
  }

  private parseCurrencies = () => {
    this.config.currencies.forEach((currency) => {
      try {
        const chainClient = new ChainClient(this.logger, currency.chain, currency.symbol);

        let lndClient: LndClient | undefined;

        if (currency.lnd) {
          lndClient = new LndClient(this.logger, currency.lnd, currency.symbol);
        }

        this.currencies.set(currency.symbol, {
          chainClient,
          lndClient,
          config: currency,
          symbol: currency.symbol,
          network: Networks[currency.network],
        });
      } catch (error) {
        this.logger.warn(`Could not initialize currency ${currency.symbol}: ${error.message}`);
      }
    });
  }

  private logStatus = (service: string, status: Object) => {
    this.logger.verbose(`${service} status: ${JSON.stringify(status, undefined, 2)}`);
  }

  private logCouldNotConnect = (service: string, error: any) => {
    this.logger.error(`Could not connect to ${service}: ${formatError(error)}`);
  }
}

export default Boltz;
