import { Transaction as EthersTransaction } from 'ethers';
import type { Sequelize, Transaction as SequelizeTransaction } from 'sequelize';
import { DataTypes, Op, QueryTypes } from 'sequelize';
import { getBlindingKey, toOutputScript } from '../../lib/Core';
import ElementsClient from '../../lib/chain/ElementsClient';
import { SelfPaymentNodeId } from '../BaseClient';
import type Logger from '../Logger';
import { formatError, getHexBuffer } from '../Utils';
import { SwapType, swapTypeToPrettyString } from '../consts/Enums';
import type { Currency } from '../wallet/WalletManager';
import type WalletManager from '../wallet/WalletManager';
import { networks } from '../wallet/ethereum/EvmNetworks';
import ChainSwap from './models/ChainSwap';
import DatabaseVersion from './models/DatabaseVersion';
import LightningPayment from './models/LightningPayment';
import PendingEthereumTransaction from './models/PendingEthereumTransaction';
import type { ReferralConfig } from './models/Referral';
import Referral from './models/Referral';
import RefundTransaction from './models/RefundTransaction';
import ReverseSwap from './models/ReverseSwap';
import Swap from './models/Swap';
import ChainSwapRepository from './repositories/ChainSwapRepository';
import DatabaseVersionRepository from './repositories/DatabaseVersionRepository';
import PendingEthereumTransactionRepository from './repositories/PendingEthereumTransactionRepository';
import RefundTransactionRepository from './repositories/RefundTransactionRepository';
import ScriptPubKeyRepository from './repositories/ScriptPubKeyRepository';
import SwapRepository from './repositories/SwapRepository';

const LegacyLndNodeId = 'legacy-lnd';
const LegacyClnNodeId = 'legacy-cln';

export const decodeBip21 = (
  bip21: string,
  currencies: Map<string, Currency>,
) => {
  const url = new URL(bip21);
  const chain = url.protocol.replace(':', '');
  let symbol = '';
  if (chain === 'bitcoin') {
    symbol = 'BTC';
  } else if (chain.includes('liquid')) {
    symbol = ElementsClient.symbol;
  }
  const currency = currencies.get(symbol);
  if (currency === undefined) {
    throw `unknown currency ${symbol}`;
  }

  const address = url.pathname;
  return {
    symbol,
    scriptPubkey: toOutputScript(currency.type, address, currency.network!),
    blindingKey: getBlindingKey(currency.type, address),
    params: url.search.replace('?', ''),
  };
};

// TODO: integration tests for actual migrations
class Migration {
  private static latestSchemaVersion = 25;
  private static latestDeprecatedSchemaVersion = 11;

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

    if (versionRow.version > Migration.latestSchemaVersion) {
      throw new Error(
        `found future database schema version ${versionRow.version}; latest version is ${Migration.latestSchemaVersion}`,
      );
    }

    if (
      versionRow.version >= 1 &&
      versionRow.version <= Migration.latestDeprecatedSchemaVersion
    ) {
      throw new Error(
        `database schema version ${versionRow.version} is no longer supported; please upgrade using an older boltz-backend release first`,
      );
    }

    this.logOutdatedVersion(versionRow.version);

    switch (versionRow.version) {
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

      case 14: {
        await this.sequelize
          .getQueryInterface()
          .addColumn(LightningPayment.tableName, 'retries', {
            type: new DataTypes.INTEGER(),
            allowNull: true,
          });

        await this.finishMigration(versionRow.version, currencies);
        break;
      }

      case 15: {
        await this.sequelize
          .getQueryInterface()
          .addColumn(PendingEthereumTransaction.tableName, 'etherAmount', {
            type: new DataTypes.DECIMAL(),
            allowNull: true,
          });
        await this.sequelize
          .getQueryInterface()
          .addColumn(PendingEthereumTransaction.tableName, 'hex', {
            type: new DataTypes.TEXT(),
            allowNull: true,
          });

        const txs =
          await PendingEthereumTransactionRepository.getTransactions();
        for (const tx of txs) {
          const fetchedTx = await currencies
            .get(networks.Rootstock.symbol)
            ?.provider!.getTransaction(tx.hash);

          if (fetchedTx === undefined || fetchedTx === null) {
            this.logger.warn(
              `Could not fetch pending EVM transaction ${tx.hash}`,
            );
            continue;
          }

          await tx.update({
            etherAmount: fetchedTx.value,
            hex: EthersTransaction.from(fetchedTx).serialized,
          });
        }

        await this.sequelize
          .getQueryInterface()
          .changeColumn(PendingEthereumTransaction.tableName, 'etherAmount', {
            type: new DataTypes.DECIMAL(),
            allowNull: false,
          });
        await this.sequelize
          .getQueryInterface()
          .changeColumn(PendingEthereumTransaction.tableName, 'hex', {
            type: new DataTypes.TEXT(),
            allowNull: false,
          });

        await this.finishMigration(versionRow.version, currencies);
        break;
      }

      case 16: {
        await this.sequelize.query('DROP INDEX swaps_invoice;');
        await this.sequelize.query(
          'ALTER TABLE swaps DROP CONSTRAINT swaps_invoice_key;',
        );

        await this.finishMigration(versionRow.version, currencies);
        break;
      }

      case 17: {
        await this.sequelize
          .getQueryInterface()
          .addColumn(Swap.tableName, 'paymentTimeout', {
            type: new DataTypes.INTEGER(),
            allowNull: true,
            validate: {
              min: 1,
            },
          });

        await this.finishMigration(versionRow.version, currencies);
        break;
      }

      case 18: {
        this.logUpdatingTable('reverseRoutingHints');

        await this.sequelize.transaction(async (transaction) => {
          await this.sequelize.getQueryInterface().addColumn(
            'reverseRoutingHints',
            'symbol',
            {
              type: new DataTypes.TEXT(),
              allowNull: true,
            },
            { transaction },
          );

          await this.sequelize.getQueryInterface().addColumn(
            'reverseRoutingHints',
            'scriptPubkey',
            {
              type: new DataTypes.BLOB(),
              allowNull: true,
            },
            { transaction },
          );

          await this.sequelize.getQueryInterface().addColumn(
            'reverseRoutingHints',
            'blindingPubkey',
            {
              type: new DataTypes.BLOB(),
              allowNull: true,
            },
            { transaction },
          );

          await this.sequelize.getQueryInterface().addColumn(
            'reverseRoutingHints',
            'params',
            {
              type: new DataTypes.TEXT(),
              allowNull: true,
            },
            { transaction },
          );

          await this.sequelize.getQueryInterface().addColumn(
            'reverseRoutingHints',
            'signatureBlob',
            {
              type: new DataTypes.BLOB(),
              allowNull: true,
            },
            { transaction },
          );

          const records = await this.sequelize.query<{
            swapId: string;
            bip21: string;
            signature: string;
          }>('SELECT "swapId", bip21, signature FROM "reverseRoutingHints"', {
            type: QueryTypes.SELECT,
            transaction,
          });

          for (const record of records) {
            try {
              const { symbol, scriptPubkey, blindingKey, params } = decodeBip21(
                record.bip21,
                currencies,
              );
              await this.sequelize.query(
                'UPDATE "reverseRoutingHints" SET symbol = $1, "scriptPubkey" = $2, params = $3, "signatureBlob" = $4 WHERE "swapId" = $5',
                {
                  bind: [
                    symbol,
                    scriptPubkey,
                    params,
                    getHexBuffer(record.signature),
                    record.swapId,
                  ],
                  type: QueryTypes.UPDATE,
                  transaction,
                },
              );
              if (blindingKey !== undefined) {
                await this.sequelize.query(
                  'UPDATE "reverseRoutingHints" SET "blindingPubkey" = $1 WHERE "swapId" = $2',
                  {
                    bind: [blindingKey, record.swapId],
                    type: QueryTypes.UPDATE,
                    transaction,
                  },
                );
              }
            } catch (error) {
              this.logger.error(
                `Could not parse BIP21 for swap ${record.swapId}: ${formatError(error)}`,
              );
              throw error;
            }
          }

          await this.sequelize
            .getQueryInterface()
            .removeColumn('reverseRoutingHints', 'signature', { transaction });

          await this.sequelize
            .getQueryInterface()
            .removeColumn('reverseRoutingHints', 'bip21', { transaction });

          await this.sequelize.getQueryInterface().changeColumn(
            'reverseRoutingHints',
            'signatureBlob',
            {
              type: new DataTypes.BLOB(),
              allowNull: false,
            },
            { transaction },
          );

          await this.sequelize
            .getQueryInterface()
            .renameColumn('reverseRoutingHints', 'signatureBlob', 'signature', {
              transaction,
            });

          await this.sequelize.getQueryInterface().changeColumn(
            'reverseRoutingHints',
            'symbol',
            {
              type: new DataTypes.TEXT(),
              allowNull: false,
            },
            { transaction },
          );

          await this.sequelize.getQueryInterface().changeColumn(
            'reverseRoutingHints',
            'scriptPubkey',
            {
              type: new DataTypes.BLOB(),
              allowNull: false,
            },
            { transaction },
          );

          await this.sequelize
            .getQueryInterface()
            .addIndex('reverseRoutingHints', ['scriptPubkey'], {
              name: 'reverseRoutingHints_scriptPubkey',
              using: 'HASH',
              transaction,
            });
        });

        await this.finishMigration(versionRow.version, currencies);
        break;
      }

      case 19: {
        this.logUpdatingTable('refund_transactions');

        await this.sequelize.transaction(async (transaction) => {
          await this.sequelize.getQueryInterface().addColumn(
            RefundTransaction.tableName,
            'symbol',
            {
              type: new DataTypes.STRING(255),
              allowNull: true,
            },
            {
              transaction,
            },
          );

          for (const refund of await RefundTransaction.findAll({
            transaction,
          })) {
            const swap =
              await RefundTransactionRepository.getSwapForTransaction(
                refund.swapId,
              );

            await refund.update(
              {
                symbol: swap.refundCurrency,
              },
              {
                transaction,
              },
            );
          }

          await this.sequelize.getQueryInterface().changeColumn(
            RefundTransaction.tableName,
            'symbol',
            {
              type: new DataTypes.STRING(255),
              allowNull: false,
            },
            {
              transaction,
            },
          );
        });

        await this.finishMigration(versionRow.version, currencies);
        break;
      }

      case 20: {
        await this.sequelize
          .getQueryInterface()
          .addColumn(Swap.tableName, 'createdRefundSignature', {
            type: new DataTypes.BOOLEAN(),
            allowNull: false,
            defaultValue: false,
          });

        await this.finishMigration(versionRow.version, currencies);
        break;
      }

      case 21: {
        this.toBackFill.push(21);
        await this.finishMigration(versionRow.version, currencies);
        break;
      }

      case 22: {
        this.logUpdatingTable('pendingEthereumTransactions');

        await this.sequelize
          .getQueryInterface()
          .addColumn(PendingEthereumTransaction.tableName, 'chain', {
            type: new DataTypes.STRING(255),
            allowNull: true,
          });

        await this.sequelize
          .getQueryInterface()
          .bulkUpdate(
            PendingEthereumTransaction.tableName,
            { chain: networks.Rootstock.symbol },
            {},
          );

        await this.sequelize
          .getQueryInterface()
          .changeColumn(PendingEthereumTransaction.tableName, 'chain', {
            type: new DataTypes.STRING(255),
            allowNull: false,
          });

        await this.sequelize
          .getQueryInterface()
          .removeIndex(PendingEthereumTransaction.tableName, ['nonce']);

        await this.finishMigration(versionRow.version, currencies);
        break;
      }

      case 23: {
        this.logUpdatingTable('channelCreations');

        await this.sequelize.getQueryInterface().dropTable('channelCreations');

        await this.finishMigration(versionRow.version, currencies);
        break;
      }

      case 24: {
        const queryInterface = this.sequelize.getQueryInterface();
        const nodeIdCol = {
          type: new DataTypes.STRING(255),
          allowNull: true,
        };

        this.logUpdatingTable(ReverseSwap.tableName);
        this.logUpdatingTable(LightningPayment.tableName);
        const [reverseSwapInvalidNodeCount] = await this.sequelize.query<{
          count: string | number;
        }>(
          `SELECT COUNT(*) AS count FROM "${ReverseSwap.tableName}" WHERE "node" NOT IN (0, 1, 2)`,
          {
            type: QueryTypes.SELECT,
          },
        );
        if (Number(reverseSwapInvalidNodeCount.count) > 0) {
          throw new Error(
            `Could not migrate all ${ReverseSwap.tableName} rows to nodeId; found ${reverseSwapInvalidNodeCount.count} rows with unsupported node values`,
          );
        }

        const [lightningPaymentInvalidNodeCount] = await this.sequelize.query<{
          count: string | number;
        }>(
          `SELECT COUNT(*) AS count FROM "${LightningPayment.tableName}" WHERE "node" NOT IN (0, 1, 2)`,
          {
            type: QueryTypes.SELECT,
          },
        );
        if (Number(lightningPaymentInvalidNodeCount.count) > 0) {
          throw new Error(
            `Could not migrate all ${LightningPayment.tableName} rows to nodeId; found ${lightningPaymentInvalidNodeCount.count} rows with unsupported node values`,
          );
        }

        await this.sequelize.transaction(async (transaction) => {
          await queryInterface.addColumn(
            ReverseSwap.tableName,
            'nodeId',
            nodeIdCol,
            {
              transaction,
            },
          );
          await queryInterface.addColumn(
            LightningPayment.tableName,
            'nodeId',
            nodeIdCol,
            {
              transaction,
            },
          );

          await this.sequelize.query(
            `UPDATE "${ReverseSwap.tableName}"
             SET "nodeId" = CASE "node"
               WHEN 0 THEN $legacyLndNodeId
               WHEN 1 THEN $legacyClnNodeId
               WHEN 2 THEN $selfPaymentNodeId
             END
             WHERE "node" IN (0, 1, 2)`,
            {
              bind: {
                legacyLndNodeId: LegacyLndNodeId,
                legacyClnNodeId: LegacyClnNodeId,
                selfPaymentNodeId: SelfPaymentNodeId,
              },
              transaction,
            },
          );
          await this.sequelize.query(
            `UPDATE "${LightningPayment.tableName}"
             SET "nodeId" = CASE "node"
               WHEN 0 THEN $legacyLndNodeId
               WHEN 1 THEN $legacyClnNodeId
               WHEN 2 THEN $selfPaymentNodeId
             END
             WHERE "node" IN (0, 1, 2)`,
            {
              bind: {
                legacyLndNodeId: LegacyLndNodeId,
                legacyClnNodeId: LegacyClnNodeId,
                selfPaymentNodeId: SelfPaymentNodeId,
              },
              transaction,
            },
          );

          await this.sequelize.query(
            `ALTER TABLE "${ReverseSwap.tableName}" ALTER COLUMN "nodeId" SET NOT NULL`,
            {
              transaction,
            },
          );
          await this.sequelize.query(
            `ALTER TABLE "${LightningPayment.tableName}" ALTER COLUMN "nodeId" SET NOT NULL`,
            {
              transaction,
            },
          );

          await this.sequelize.query(
            `ALTER TABLE "${LightningPayment.tableName}" DROP CONSTRAINT IF EXISTS "${LightningPayment.tableName}_pkey"`,
            {
              transaction,
            },
          );
          await this.sequelize.query(
            `ALTER TABLE "${LightningPayment.tableName}" ADD PRIMARY KEY ("preimageHash", "nodeId")`,
            {
              transaction,
            },
          );

          await queryInterface.removeColumn(ReverseSwap.tableName, 'node', {
            transaction,
          });
          await queryInterface.removeColumn(
            LightningPayment.tableName,
            'node',
            {
              transaction,
            },
          );
        });

        this.toBackFill.push(24);
        await this.finishMigration(versionRow.version, currencies);
        break;
      }

      default:
        throw `found unexpected database version ${versionRow.version}`;
    }
  };

  public backFillMigrations = async (
    sequelize: Sequelize,
    currencies: Map<string, Currency>,
    walletManager: WalletManager,
  ) => {
    for (const version of this.toBackFill) {
      this.logger.info(
        `Starting backfilling of migration of database schema version ${version}`,
      );

      switch (version) {
        case 21: {
          await this.logProgress(
            Swap.tableName,
            1_000,
            await SwapRepository.getSwaps({
              pair: {
                [Op.in]: ['BTC/BTC', 'L-BTC/BTC'],
              },
            }),
            async (swap, tx) => {
              const chainCurrency = swap.chainCurrency;
              const wallet = walletManager.wallets.get(chainCurrency);
              if (wallet === undefined) {
                this.logger.warn(
                  `Could not get wallet for ${chainCurrency} for ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}`,
                );
                return;
              }

              await ScriptPubKeyRepository.add(
                swap.id,
                chainCurrency,
                wallet.decodeAddress(swap.lockupAddress),
                { transaction: tx },
              );
            },
            sequelize,
          );

          const relevantChains = ['BTC', 'L-BTC'];
          await this.logProgress(
            ChainSwap.tableName,
            1_000,
            await ChainSwapRepository.getChainSwaps(),
            async (swap, tx) => {
              if (!relevantChains.includes(swap.receivingData.symbol)) {
                return;
              }

              const wallet = walletManager.wallets.get(
                swap.receivingData.symbol,
              );
              if (wallet === undefined) {
                this.logger.warn(
                  `Could not get wallet for ${swap.receivingData.symbol} for ${swapTypeToPrettyString(swap.type)} Swap ${swap.id}`,
                );
                return;
              }

              await ScriptPubKeyRepository.add(
                swap.id,
                swap.receivingData.symbol,
                wallet.decodeAddress(swap.receivingData.lockupAddress),
                { transaction: tx },
              );
            },
            sequelize,
          );

          break;
        }

        case 24: {
          // Resolve legacy placeholders to actual node pubkeys
          const btc = currencies.get('BTC');
          const lndPubkey = btc?.lndClients.values().next().value?.id;
          const clnPubkey = btc?.clnClient?.id;

          for (const [placeholder, pubkey] of [
            [LegacyLndNodeId, lndPubkey],
            [LegacyClnNodeId, clnPubkey],
          ] as const) {
            if (pubkey === undefined) {
              this.logger.warn(
                `No node configured to resolve ${placeholder} nodeId placeholder`,
              );
              continue;
            }

            const [, rsCount] = await sequelize.query(
              `UPDATE "${ReverseSwap.tableName}" SET "nodeId" = $pubkey WHERE "nodeId" = $placeholder`,
              { bind: { pubkey, placeholder } },
            );
            this.logger.debug(
              `Resolved ${(rsCount as any)?.rowCount ?? rsCount} ${placeholder} -> ${pubkey} in ${ReverseSwap.tableName}`,
            );

            const [, lpCount] = await sequelize.query(
              `UPDATE "${LightningPayment.tableName}" SET "nodeId" = $pubkey WHERE "nodeId" = $placeholder`,
              { bind: { pubkey, placeholder } },
            );
            this.logger.debug(
              `Resolved ${(lpCount as any)?.rowCount ?? lpCount} ${placeholder} -> ${pubkey} in ${LightningPayment.tableName}`,
            );
          }

          break;
        }
      }

      this.logger.info(
        `Finished backfilling of migration of database schema version ${version}`,
      );
    }

    this.toBackFill = [];
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
    cb: (entry: T, tx?: SequelizeTransaction) => Promise<void>,
    sequelize?: Sequelize,
  ) => {
    this.logger.debug(`Migrating ${entries.length} ${name}`);

    const tx = await sequelize?.transaction();

    try {
      for (const [index, entry] of entries.entries()) {
        await cb(entry, tx);

        if (index !== 0 && index % logIncrement === 0) {
          this.logger.debug(`Migrated ${index}/${entries.length} ${name}`);
        }
      }

      await tx?.commit();
    } catch (error) {
      this.logger.error(`Error migrating ${name}: ${formatError(error)}`);
      await tx?.rollback();

      throw error;
    }
  };
}

export default Migration;
