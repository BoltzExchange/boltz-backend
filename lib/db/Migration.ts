import { Transaction } from 'bitcoinjs-lib';
import bolt11, { RoutingInfo } from 'bolt11';
import { detectSwap } from 'boltz-core';
import { DataTypes, Op, QueryTypes, Sequelize } from 'sequelize';
import Logger from '../Logger';
import {
  createApiCredential,
  formatError,
  getChainCurrency,
  getHexBuffer,
  getHexString,
  getLightningCurrency,
  splitPairId,
} from '../Utils';
import { SwapType, SwapVersion, swapTypeToPrettyString } from '../consts/Enums';
import { Currency } from '../wallet/WalletManager';
import ChainSwap from './models/ChainSwap';
import ChannelCreation from './models/ChannelCreation';
import DatabaseVersion from './models/DatabaseVersion';
import LightningPayment, {
  LightningPaymentStatus,
} from './models/LightningPayment';
import PendingLockupTransaction from './models/PendingLockupTransaction';
import Referral, { ReferralConfig } from './models/Referral';
import ReverseSwap, { NodeType } from './models/ReverseSwap';
import Swap from './models/Swap';
import DatabaseVersionRepository from './repositories/DatabaseVersionRepository';
import LightningPaymentRepository from './repositories/LightningPaymentRepository';

const coalesceInvoiceAmount = (
  decoded: bolt11.PaymentRequestObject,
): number => {
  const decodedMsat = decoded.millisatoshis
    ? Math.ceil(Number(decoded.millisatoshis) / 1000)
    : undefined;

  return decoded.satoshis || decodedMsat || 0;
};

const decodeInvoice = (
  invoice: string,
): bolt11.PaymentRequestObject & {
  satoshis: number;
  timeExpireDate: number;
  paymentHash: string | undefined;
  description: string | undefined;
  descriptionHash: string | undefined;
  minFinalCltvExpiry: number | undefined;
  routingInfo: bolt11.RoutingInfo | undefined;
} => {
  const decoded = bolt11.decode(invoice);

  let paymentHash: string | undefined;
  let routingInfo: bolt11.RoutingInfo | undefined;
  let minFinalCltvExpiry: number | undefined;
  let description: string | undefined;
  let descriptionHash: string | undefined;

  for (const tag of decoded.tags) {
    switch (tag.tagName) {
      case 'payment_hash':
        paymentHash = tag.data as string;
        break;
      case 'routing_info':
        routingInfo = tag.data as RoutingInfo;
        break;

      case 'min_final_cltv_expiry':
        minFinalCltvExpiry = tag.data as number;
        break;

      case 'description':
        description = tag.data as string;
        break;

      case 'purpose_commit_hash':
        descriptionHash = tag.data as string;
        break;
    }
  }

  return {
    ...decoded,
    routingInfo,
    paymentHash,
    description,
    descriptionHash,
    minFinalCltvExpiry,
    satoshis: coalesceInvoiceAmount(decoded),
    timeExpireDate: decoded.timeExpireDate || (decoded.timestamp || 0) + 3600,
  };
};

// TODO: integration tests for actual migrations
class Migration {
  private static latestSchemaVersion = 14;

  private toBackFill: number[] = [];

  constructor(
    private logger: Logger,
    private sequelize: Sequelize,
  ) {}

  public migrate = async (currencies: Map<string, Currency>): Promise<void> => {
    await DatabaseVersion.sync();
    const versionRow = await DatabaseVersionRepository.getVersion();

    // When no version row is found, just insert the latest version into the database
    if (!versionRow) {
      this.logger.verbose('No schema version found in database');
      this.logger.debug(
        `Inserting latest schema version ${Migration.latestSchemaVersion} in database`,
      );

      await DatabaseVersionRepository.createVersion(
        Migration.latestSchemaVersion,
      );
      return;
    }

    if (versionRow.version === Migration.latestSchemaVersion) {
      this.logger.verbose(
        `Database has latest schema version ${Migration.latestSchemaVersion}`,
      );
      return;
    }

    this.logOutdatedVersion(versionRow.version);

    switch (versionRow.version) {
      // The migration from schema version 1 to 2 adds support for Ether and ERC20 tokens
      // Which means that we can safely assume that all Swaps that are in the database
      // already were on a Bitcoin like chain
      case 1: {
        // Sanity check the chain clients
        for (const currency of currencies.values()) {
          try {
            if (currency.chainClient) {
              this.logger.debug(
                `Sanity checking ${currency.symbol} chain client for migration`,
              );
              await currency.chainClient!.getBlockchainInfo();
              this.logger.debug(
                `${currency.symbol} chain client is ready for migration`,
              );
            }
          } catch (error) {
            throw `could not connect to to chain client of ${
              currency.symbol
            }: ${formatError(error)}`;
          }
        }

        this.logUpdatingTable('swaps');

        // Add the missing columns to make querying via the model possible
        await this.sequelize.query(
          'ALTER TABLE swaps ADD failureReason VARCHAR(255)',
        );
        await this.sequelize.query(
          'ALTER TABLE swaps ADD lockupTransactionVout VARCHAR(255)',
        );

        const allSwaps = await Swap.findAll();
        const allChannelCreations = await ChannelCreation.findAll();

        // To drop the "swaps" table, we also need to drop "channelCreations" because it has a foreign constraint
        await this.dropTable('channelCreations');
        await this.dropTable('swaps');

        await Swap.sync();
        await ChannelCreation.sync();

        for (const swap of allSwaps) {
          let lockupTransactionVout: number | null = null;

          if (swap.lockupTransactionId) {
            const { base, quote } = splitPairId(swap.pair);
            const chainCurrency = getChainCurrency(
              base,
              quote,
              swap.orderSide,
              false,
            );
            const chainClient = currencies.get(chainCurrency)!.chainClient!;

            const lockupTransaction = Transaction.fromHex(
              await chainClient.getRawTransaction(swap.lockupTransactionId),
            );

            lockupTransactionVout = detectSwap(
              getHexBuffer(swap.redeemScript!),
              lockupTransaction,
            )!.vout;
          }

          await Swap.create({
            ...this.getModelDataValues(swap),
            lockupTransactionVout,
          });
        }

        for (const channelCreation of allChannelCreations) {
          await ChannelCreation.create({
            ...this.getModelDataValues(channelCreation),
          });
        }

        this.logUpdatingTable('reverseSwaps');

        // Add the missing columns to make querying via the model possible
        await this.sequelize.query(
          'ALTER TABLE reverseSwaps ADD claimAddress VARCHAR(255)',
        );
        await this.sequelize.query(
          'ALTER TABLE reverseSwaps ADD preimageHash VARCHAR(255)',
        );
        await this.sequelize.query(
          'ALTER TABLE reverseSwaps ADD failureReason VARCHAR(255)',
        );

        const allReverseSwaps = await ReverseSwap.findAll();

        await this.dropTable('reverseSwaps');

        await ReverseSwap.sync();

        for (const reverseSwap of allReverseSwaps) {
          // The "claimAddress" does not have to be set because it is only needed for Swaps on the Ethereum chain and
          // databases of the schema version 1 do not support Ethereum Swaps
          await ReverseSwap.create({
            ...this.getModelDataValues(reverseSwap),
            preimageHash: decodeInvoice(reverseSwap.invoice).paymentHash!,
          });
        }

        await this.finishMigration(versionRow.version, currencies);
        break;
      }

      // Database schema version 3 adds support for the prepay miner fee on the Ethereum chain
      case 2:
        this.logUpdatingTable('reverseSwaps');

        await this.sequelize
          .getQueryInterface()
          .addColumn('reverseSwaps', 'minerFeeOnchainAmount', {
            type: new DataTypes.INTEGER(),
            allowNull: true,
          });

        // Because adding unique columns is not possible with SQLite, that property is omitted here
        await this.sequelize
          .getQueryInterface()
          .addColumn('reverseSwaps', 'minerFeeInvoicePreimage', {
            type: new DataTypes.STRING(64),
            allowNull: true,
          });

        await this.finishMigration(versionRow.version, currencies);
        break;

      // Schema version 4 adds referrals for fee sharing
      case 3:
        this.logUpdatingTable('swaps');

        await this.sequelize
          .getQueryInterface()
          .addColumn('swaps', 'referral', {
            type: new DataTypes.STRING(255),
            allowNull: true,
          });

        await this.sequelize
          .getQueryInterface()
          .addIndex('swaps', ['referral'], {
            unique: false,
            fields: ['referral'],
          });

        this.logUpdatingTable('reverseSwaps');

        await this.sequelize
          .getQueryInterface()
          .addColumn('reverseSwaps', 'referral', {
            type: new DataTypes.STRING(255),
            allowNull: true,
          });

        await this.sequelize
          .getQueryInterface()
          .addIndex('reverseSwaps', ['referral'], {
            unique: false,
            fields: ['referral'],
          });

        await this.finishMigration(versionRow.version, currencies);

        break;

      // Schema version 5 adds API keys to referrals
      case 4: {
        this.logUpdatingTable('referrals');

        await this.sequelize
          .getQueryInterface()
          .addColumn('referrals', 'apiKey', {
            type: new DataTypes.STRING(255),
          });

        await this.sequelize
          .getQueryInterface()
          .addColumn('referrals', 'apiSecret', {
            type: new DataTypes.STRING(255),
          });

        await this.sequelize
          .getQueryInterface()
          .addIndex('referrals', ['apiKey']);

        const referrals = await Referral.findAll();

        for (const referral of referrals) {
          await referral.update({
            apiKey: createApiCredential(),
            apiSecret: createApiCredential(),
          });
        }

        await this.sequelize
          .getQueryInterface()
          .changeColumn('referrals', 'apiKey', {
            unique: true,
            allowNull: false,
            type: new DataTypes.STRING(255),
          });

        await this.sequelize
          .getQueryInterface()
          .changeColumn('referrals', 'apiSecret', {
            unique: true,
            allowNull: false,
            type: new DataTypes.STRING(255),
          });

        await this.finishMigration(versionRow.version, currencies);

        break;
      }

      case 5: {
        this.logUpdatingTable('swaps');

        await this.sequelize
          .getQueryInterface()
          .addColumn('swaps', 'invoiceAmount', {
            allowNull: true,
            type: new DataTypes.INTEGER(),
          });

        await this.logProgress(
          'swaps',
          100,
          await Swap.findAll({
            attributes: ['id', 'invoice'],
            where: {
              invoice: {
                [Op.not]: null,
              },
            },
          }),
          async (swap) => {
            await swap.update({
              invoiceAmount: decodeInvoice(swap.invoice!).satoshis,
            });
          },
        );

        this.logUpdatingTable('reverseSwaps');

        await this.sequelize
          .getQueryInterface()
          .addColumn('reverseSwaps', 'invoiceAmount', {
            type: new DataTypes.INTEGER(),
          });

        await this.logProgress(
          'reverseSwaps',
          100,
          await ReverseSwap.findAll({
            attributes: ['id', 'invoice'],
          }),
          async (reverseSwap) => {
            await reverseSwap.update({
              invoiceAmount: decodeInvoice(reverseSwap.invoice).satoshis,
            });
          },
        );

        await this.sequelize
          .getQueryInterface()
          .changeColumn('reverseSwaps', 'invoiceAmount', {
            allowNull: false,
            type: new DataTypes.INTEGER(),
          });

        await this.finishMigration(versionRow.version, currencies);

        break;
      }

      case 6: {
        this.logUpdatingTable('reverseSwaps');

        const attrs = {
          type: new DataTypes.INTEGER(),
          allowNull: true,
          validate: {
            isIn: [
              Object.values(NodeType).filter((val) => typeof val === 'number'),
            ],
          },
        };
        await this.sequelize
          .getQueryInterface()
          .addColumn('reverseSwaps', 'node', attrs);

        await this.sequelize
          .getQueryInterface()
          .bulkUpdate('reverseSwaps', { node: NodeType.LND }, {});

        attrs.allowNull = false;
        await this.sequelize
          .getQueryInterface()
          .changeColumn('reverseSwaps', 'node', attrs);

        await this.finishMigration(versionRow.version, currencies);

        break;
      }

      case 7: {
        this.logUpdatingTable('swaps');

        const attrs = {
          type: new DataTypes.INTEGER(),
          allowNull: true,
          validate: {
            isIn: [
              Object.values(SwapVersion).filter(
                (val) => typeof val === 'number',
              ),
            ],
          },
        };
        await this.sequelize
          .getQueryInterface()
          .addColumn('swaps', 'version', attrs);

        await this.sequelize
          .getQueryInterface()
          .bulkUpdate('swaps', { version: SwapVersion.Legacy }, {});

        attrs.allowNull = false;
        await this.sequelize
          .getQueryInterface()
          .changeColumn('swaps', 'version', attrs);

        await this.sequelize
          .getQueryInterface()
          .addColumn('swaps', 'refundPublicKey', {
            type: new DataTypes.STRING(),
            allowNull: true,
          });

        this.logUpdatingTable('reverseSwaps');

        attrs.allowNull = true;
        await this.sequelize
          .getQueryInterface()
          .addColumn('reverseSwaps', 'version', attrs);

        await this.sequelize
          .getQueryInterface()
          .bulkUpdate('reverseSwaps', { version: SwapVersion.Legacy }, {});

        attrs.allowNull = false;
        await this.sequelize
          .getQueryInterface()
          .changeColumn('reverseSwaps', 'version', attrs);

        await this.sequelize
          .getQueryInterface()
          .addColumn('reverseSwaps', 'claimPublicKey', {
            type: new DataTypes.STRING(),
            allowNull: true,
          });

        await this.finishMigration(versionRow.version, currencies);
        break;
      }

      case 8: {
        const tables = await this.sequelize.getQueryInterface().showAllTables();

        // It is possible that the table does not exist yet in schema version 8,
        // so we have to check if it exists before trying to add a column
        if (tables.includes(LightningPayment.tableName)) {
          await this.sequelize
            .getQueryInterface()
            .addColumn(LightningPayment.tableName, 'error', {
              type: new DataTypes.STRING(),
              allowNull: true,
            });
        }

        await this.finishMigration(versionRow.version, currencies);
        break;
      }

      case 9: {
        await this.sequelize
          .getQueryInterface()
          .addColumn(PendingLockupTransaction.tableName, 'transaction', {
            type: new DataTypes.TEXT(),
          });

        await this.finishMigration(versionRow.version, currencies);
        break;
      }

      case 10: {
        await this.sequelize.transaction(async (tx) => {
          await this.sequelize.getQueryInterface().addColumn(
            ChainSwap.tableName,
            'createdRefundSignature',
            {
              type: new DataTypes.BOOLEAN(),
              allowNull: false,
              defaultValue: false,
            },
            { transaction: tx },
          );

          // To make sure we do not allow renegotiation of amounts and potentially
          // accept a transaction, we created a refund signature before
          await ChainSwap.update(
            {
              createdRefundSignature: true,
            },
            {
              where: {},
              transaction: tx,
            },
          );
        });

        await this.finishMigration(versionRow.version, currencies);
        break;
      }

      case 11: {
        await this.sequelize
          .getQueryInterface()
          .addColumn(Swap.tableName, 'preimage', {
            type: new DataTypes.STRING(64),
            allowNull: true,
            unique: true,
          });

        this.toBackFill.push(11);
        await this.finishMigration(versionRow.version, currencies);
        break;
      }

      case 12: {
        await this.sequelize
          .getQueryInterface()
          .addColumn(Referral.tableName, 'submarinePremium', {
            type: new DataTypes.INTEGER(),
            allowNull: true,
          });

        await this.sequelize
          .getQueryInterface()
          .addColumn(Referral.tableName, 'reversePremium', {
            type: new DataTypes.INTEGER(),
            allowNull: true,
          });

        await this.sequelize
          .getQueryInterface()
          .addColumn(Referral.tableName, 'chainPremium', {
            type: new DataTypes.INTEGER(),
            allowNull: true,
          });

        await this.finishMigration(versionRow.version, currencies);
        break;
      }

      case 13: {
        await this.sequelize
          .getQueryInterface()
          .addColumn(Referral.tableName, 'config', {
            type: new DataTypes.JSON(),
            allowNull: true,
          });

        const refs: {
          id: string;
          submarinePremium: number;
          reversePremium: number;
          chainPremium: number;
        }[] = await this.sequelize.query(
          'SELECT id, "submarinePremium", "reversePremium", "chainPremium" FROM referrals',
          {
            type: QueryTypes.SELECT,
          },
        );

        await this.sequelize.transaction(async (transaction) => {
          for (const ref of refs) {
            await Referral.update(
              {
                config: {
                  premiums: {
                    [SwapType.Submarine]: ref.submarinePremium || undefined,
                    [SwapType.ReverseSubmarine]:
                      ref.reversePremium || undefined,
                    [SwapType.Chain]: ref.chainPremium || undefined,
                  },
                } as ReferralConfig,
              },
              {
                transaction,
                where: {
                  id: ref.id,
                },
              },
            );
          }
        });

        await this.sequelize.query(
          'ALTER TABLE referrals DROP COLUMN "submarinePremium"',
        );
        await this.sequelize.query(
          'ALTER TABLE referrals DROP COLUMN "reversePremium"',
        );
        await this.sequelize.query(
          'ALTER TABLE referrals DROP COLUMN "chainPremium"',
        );

        await this.finishMigration(versionRow.version, currencies);
        break;
      }

      default:
        throw `found unexpected database version ${versionRow.version}`;
    }
  };

  public backFillMigrations = async (currencies: Map<string, Currency>) => {
    for (const version of this.toBackFill) {
      this.logger.info(
        `Starting backfilling of migration of database schema version ${version}`,
      );

      switch (version) {
        case 11: {
          await this.logProgress(
            Swap.tableName,
            100,
            await LightningPaymentRepository.findByStatus(
              LightningPaymentStatus.Success,
            ),
            async (payment) => {
              const { base, quote } = splitPairId(payment.Swap.pair);
              const lightningSymbol = getLightningCurrency(
                base,
                quote,
                payment.Swap.orderSide,
                false,
              );
              const currency = currencies.get(lightningSymbol);
              if (currency === undefined) {
                this.logger.warn(
                  `Could not get lightning currency ${lightningSymbol} for ${swapTypeToPrettyString(payment.Swap.type)} Swap ${payment.Swap.id}`,
                );
                return;
              }

              let preimage: string | undefined = undefined;
              if (
                payment.node === NodeType.LND &&
                currency.lndClient !== undefined
              ) {
                const res = await currency.lndClient.trackPayment(
                  getHexBuffer(payment.Swap.preimageHash),
                );
                if (res?.paymentPreimage?.length > 0) {
                  preimage = res.paymentPreimage;
                }
              } else if (
                payment.node === NodeType.CLN &&
                currency.clnClient !== undefined
              ) {
                const res = await currency.clnClient.checkPayStatus(
                  payment.Swap.invoice!,
                );
                if (res !== undefined) {
                  preimage = getHexString(res.preimage);
                }
              }

              if (preimage === undefined) {
                this.logger.warn(
                  `Could not get preimage for ${payment.Swap.id}`,
                );
                return;
              }

              await payment.Swap.update({ preimage });
            },
          );
        }
      }

      this.logger.info(
        `Finished backfilling of migration of database schema version ${version}`,
      );
    }

    this.toBackFill = [];
  };

  private dropTable = async (table: string) => {
    await this.sequelize.query(`DROP TABLE ${table}`);
  };

  private getModelDataValues = (model: any) => {
    return model['dataValues'];
  };

  private logUpdatingTable = (table: string) => {
    this.logger.verbose(`Updating database table ${table}`);
  };

  private finishMigration = async (
    updatedFromVersion: number,
    currencies: Map<string, Currency>,
  ) => {
    const currentVersion = updatedFromVersion + 1;

    this.logger.info(
      `Finished database migration to schema version ${currentVersion}`,
    );
    await DatabaseVersionRepository.updateVersion(currentVersion);

    // Run the migration again if the current schema version is not the latest one
    if (currentVersion !== Migration.latestSchemaVersion) {
      await this.migrate(currencies);
    }
  };

  private logOutdatedVersion = (version: number) => {
    this.logger.warn(`Found database with outdated schema version ${version}`);
    this.logger.info(
      `Starting migration to database schema version ${version + 1}`,
    );
  };

  private logProgress = async <T>(
    name: string,
    logIncrement: number,
    entries: T[],
    cb: (entry: T) => Promise<void>,
  ) => {
    this.logger.debug(`Migrating ${entries.length} ${name}`);

    for (const [index, entry] of entries.entries()) {
      await cb(entry);

      if (index !== 0 && index % logIncrement === 0) {
        this.logger.debug(`Migrated ${index}/${entries.length} ${name}`);
      }
    }
  };
}

export default Migration;
