import fs from 'fs';
import { Arguments } from 'yargs';
import { generateMnemonic } from 'bip39';
import { Networks } from 'boltz-core';
import Logger from './Logger';
import Config, { ConfigType } from './Config';
import LndClient from './lightning/LndClient';
import GrpcServer from './grpc/GrpcServer';
import Service from './service/Service';
import WalletManager, { Currency } from './wallet/WalletManager';
import SwapManager from './swap/SwapManager';
import ChainClient from './chain/ChainClient';
import Database from './db/Database';

class Boltz {
  private config: ConfigType;
  private logger: Logger;

  private db: Database;

  private currencies = new Map<string, Currency>();

  private walletManager: WalletManager;
  private swapManager: SwapManager;

  private service: Service;
  private grpcServer: GrpcServer;

  constructor(config: Arguments<any>) {
    this.config = new Config().load(config);
    this.logger = new Logger(this.config.logpath, this.config.loglevel);

    this.db = new Database(this.logger, this.config.dbpath);

    this.parseCurrencies();

    const walletCurrencies = Array.from(this.currencies.values());

    if (fs.existsSync(this.config.mnemonicpath)) {
      this.walletManager = new WalletManager(this.logger, walletCurrencies, this.db, this.config.mnemonicpath);
    } else {
      const mnemonic = generateMnemonic();
      this.logger.info(`generated new mnemonic: ${mnemonic}`);

      this.walletManager = WalletManager.fromMnemonic(this.logger, mnemonic, this.config.mnemonicpath, walletCurrencies, this.db);
    }

    const bitcoin = this.currencies.get('BTC')!;
    const litecoin = this.currencies.get('LTC')!;

    this.swapManager = new SwapManager(
      this.logger,
      this.walletManager,
      [
        bitcoin,
        litecoin,
      ],
    );

    this.service = new Service({
      logger: this.logger,
      currencies: this.currencies,
      swapManager: this.swapManager,
      walletManager: this.walletManager,
    });

    this.grpcServer = new GrpcServer(this.logger, this.service, this.config.grpc);
  }

  public start = async () => {
    const promises = [
      this.db.init(),
    ];

    this.currencies.forEach((currency) => {
      promises.push(this.connectChainClient(currency.chainClient));
      promises.push(this.connectLnd(currency.lndClient));
    });

    await Promise.all(promises);

    await this.walletManager.init();

    try {
      await this.grpcServer.listen();
    } catch (error) {
      this.logger.error(`Could not start gRPC server: ${error}`);
    }
  }

  private connectChainClient = async (client: ChainClient) => {
    const service = `${client.symbol} chain`;

    try {
      await client.connect();

      const info = await client.getInfo();
      this.logStatus(service, info);
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
        const lndClient = new LndClient(this.logger, currency.lnd!, currency.symbol);

        this.currencies.set(currency.symbol, {
          chainClient,
          lndClient,
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
    this.logger.error(`Could not connect to ${service}: ${JSON.stringify(error)}`);
  }
}

export default Boltz;
