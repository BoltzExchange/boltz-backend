import { SpanKind, SpanStatusCode, context, trace } from '@opentelemetry/api';
import { Op } from 'sequelize';
import { satoshisToSatcomma } from '../DenominationConverter';
import type Logger from '../Logger';
import Tracing from '../Tracing';
import {
  checkEvmAddress,
  formatError,
  getHexString,
  mapToObject,
  stringify,
} from '../Utils';
import {
  FinalChainSwapEvents,
  FinalReverseSwapEvents,
  FinalSwapEvents,
  SwapType,
  SwapUpdateEvent,
  swapTypeToPrettyString,
  swapTypeToString,
} from '../consts/Enums';
import type { AnySwap } from '../consts/Types';
import ReferralStats from '../data/ReferralStats';
import Stats from '../data/Stats';
import type ReverseRoutingHint from '../db/models/ReverseRoutingHint';
import type ReverseSwap from '../db/models/ReverseSwap';
import type Swap from '../db/models/Swap';
import type { ChainSwapInfo } from '../db/repositories/ChainSwapRepository';
import ChainSwapRepository from '../db/repositories/ChainSwapRepository';
import FeeRepository from '../db/repositories/FeeRepository';
import ReverseRoutingHintRepository from '../db/repositories/ReverseRoutingHintRepository';
import ReverseSwapRepository from '../db/repositories/ReverseSwapRepository';
import SwapRepository from '../db/repositories/SwapRepository';
import type Service from '../service/Service';
import { codeBlock } from './Markup';
import type NotificationClient from './NotificationClient';

enum Command {
  Help = 'help',

  // Commands that retrieve information
  GetFees = 'getfees',
  SwapInfo = 'swapinfo',
  GetStats = 'getstats',
  ListSwaps = 'listswaps',
  GetBalance = 'getbalance',
  LockedFunds = 'lockedfunds',
  PendingSwaps = 'pendingswaps',
  GetReferrals = 'getreferrals',
  PendingSweeps = 'pendingsweeps',

  // Commands that generate a value or trigger a function
  Backup = 'backup',
  GetAddress = 'getaddress',
  SweepSwaps = 'sweepswaps',
}

type Usage = {
  command: string;
  description: string;
};

type CommandInfo = {
  usage?: Usage[];
  description: string;
  executor: (args: string[]) => Promise<void>;
};

class CommandHandler {
  private readonly commands: Map<string, CommandInfo>;

  constructor(
    private logger: Logger,
    private notificationClient: NotificationClient,
    private service: Service,
  ) {
    this.commands = new Map<string, CommandInfo>([
      [
        Command.Help,
        {
          usage: [
            {
              command: 'help [command]',
              description: 'gets more information about a single command',
            },
          ],
          executor: this.help,
          description: 'gets a list of all available commands',
        },
      ],

      [
        Command.GetFees,
        {
          executor: this.getFees,
          description: 'gets accumulated fees',
        },
      ],
      [
        Command.SwapInfo,
        {
          usage: [
            {
              command: 'swapinfo <id>',
              description:
                'gets all available information about the (reverse) swap with the id `<id>`',
            },
          ],
          executor: this.swapInfo,
          description: 'gets all available information about a swap',
        },
      ],
      [
        Command.GetStats,
        {
          executor: this.getStats,
          description:
            'gets statistics grouped by year and month for the current and last 6 months',
          usage: [
            {
              command: `${Command.GetStats} all`,
              description: 'get statistics for all swaps in the database',
            },
          ],
        },
      ],
      [
        Command.ListSwaps,
        {
          executor: this.listSwaps,
          description: 'lists swaps',
          usage: [
            {
              command: `${Command.ListSwaps} [status] [limit = 100]`,
              description:
                'lists swaps from the database; optionally filtered by status',
            },
          ],
        },
      ],
      [
        Command.GetBalance,
        {
          executor: this.getBalance,
          description: 'gets the balance of the wallets and channels',
        },
      ],
      [
        Command.LockedFunds,
        {
          executor: this.lockedFunds,
          description: 'gets funds locked up by Boltz',
        },
      ],
      [
        Command.PendingSwaps,
        {
          executor: this.pendingSwaps,
          description: 'gets a list of pending swaps',
        },
      ],
      [
        Command.PendingSweeps,
        {
          executor: this.pendingSweeps,
          description: 'gets all pending sweeps',
        },
      ],
      [
        Command.GetReferrals,
        {
          executor: this.getReferrals,
          description: 'gets stats for all referral IDs',
        },
      ],

      [
        Command.GetAddress,
        {
          usage: [
            {
              command: 'getaddress <currency> <label>',
              description: 'gets an address for the currency `<currency>`',
            },
          ],
          executor: this.getAddress,
          description: 'gets an address for a currency',
        },
      ],
      [
        Command.SweepSwaps,
        {
          usage: [
            {
              command: 'sweepswaps',
              description: 'sweeps deferred swap claims of all currencies',
            },
            {
              command: 'sweepswaps <currency>',
              description: 'sweeps deferred swap claims of a specific currency',
            },
          ],
          executor: this.sweepSwaps,
          description: 'sweeps deferred swap claims',
        },
      ],
    ]);

    this.notificationClient.on('message', async (message: string) => {
      const args = message.split(' ');

      // Get the command and remove the first argument from the array, which is the command itself
      const command = args.shift();

      if (command) {
        const commandInfo = this.commands.get(command.toLowerCase());

        if (commandInfo) {
          this.logger.debug(`Executing command: ${command} ${args.join(', ')}`);

          const span = Tracing.tracer.startSpan(`Command ${command}`, {
            kind: SpanKind.INTERNAL,
            attributes: {
              params: args,
            },
          });
          const ctx = trace.setSpan(context.active(), span);

          try {
            await context.with(ctx, commandInfo.executor, this, args);
          } catch (e) {
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: formatError(e),
            });
            this.logger.warn(`Command failed: ${formatError(e)}`);
            await this.notificationClient.sendMessage(
              `Command failed: ${formatError(e)}`,
            );
          } finally {
            span.end();
          }
        }
      }
    });
  }

  /*
   * Command executors
   */

  private help = async (args: string[]) => {
    if (args.length === 0) {
      let message = 'Commands:\n';

      this.commands.forEach((info, command) => {
        message += `\n**${command}**: ${info.description}`;
      });

      await this.notificationClient.sendMessage(message);
    } else {
      const command = args[0].toLowerCase();
      const info = this.commands.get(command);

      if (!info) {
        await this.notificationClient.sendMessage(
          `Could not find command: ${command}`,
        );
        return;
      }

      let message = `\`${command}\`: ${info.description}`;

      if (info.usage) {
        message += '\n\n**Usage:**\n';

        for (const usage of info.usage) {
          message += `\n\`${usage.command}\`: ${usage.description}`;
        }
      }

      await this.notificationClient.sendMessage(message);
    }
  };

  private getFees = async () => {
    let message = 'Fees:\n';
    for (const { asset, sum } of await FeeRepository.getFees()) {
      message += `\n**${asset}**: ${satoshisToSatcomma(sum)} ${asset}`;
    }

    await this.notificationClient.sendMessage(message);
  };

  private swapInfo = async (args: string[]) => {
    if (args.length === 0) {
      await this.sendCouldNotFindSwap('');
      return;
    }

    const identifier = args[0];

    // When it's an EVM address, we query only funds locked for that address
    try {
      const evmAddress = checkEvmAddress(identifier);

      const [reverseSwaps, chainSwaps] = await Promise.all([
        ReverseSwapRepository.getReverseSwaps({
          status: {
            [Op.in]: [
              SwapUpdateEvent.TransactionMempool,
              SwapUpdateEvent.TransactionConfirmed,
            ],
          },
          claimAddress: evmAddress,
        }),
        ChainSwapRepository.getChainSwaps({
          status: {
            [Op.in]: [
              SwapUpdateEvent.TransactionServerMempool,
              SwapUpdateEvent.TransactionServerConfirmed,
            ],
          },
        }),
      ]);

      this.notificationClient.sendMessage(`Funds locked for \`${evmAddress}\``);
      await this.sendSwapInfos(
        identifier,
        [],
        reverseSwaps,
        chainSwaps.filter((s) => s.sendingData.claimAddress === evmAddress),
      );

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      // When it's not EVM address, we try to find the swap by some other identifier
      const [swaps, reverseSwaps, chainSwaps] = await Promise.all([
        SwapRepository.getSwaps({
          [Op.or]: {
            id: identifier,
            invoice: identifier,
            preimageHash: identifier,
            lockupAddress: identifier,
            lockupTransactionId: identifier,
          },
        }),
        ReverseSwapRepository.getReverseSwaps({
          [Op.or]: {
            id: identifier,
            invoice: identifier,
            preimageHash: identifier,
            lockupAddress: identifier,
            transactionId: identifier,
          },
        }),
        ChainSwapRepository.getChainSwapsByData(
          {
            [Op.or]: {
              lockupAddress: identifier,
              transactionId: identifier,
            },
          },
          {
            [Op.or]: {
              id: identifier,
              preimageHash: identifier,
            },
          },
        ),
      ]);

      await this.sendSwapInfos(identifier, swaps, reverseSwaps, chainSwaps);
    }
  };

  private sendSwapInfos = async (
    identifier: string,
    swaps: Swap[],
    reverseSwaps: ReverseSwap[],
    chainSwaps: ChainSwapInfo[],
  ) => {
    const reverseRoutingHints = new Map<string, ReverseRoutingHint>(
      (
        await ReverseRoutingHintRepository.getHints(
          reverseSwaps.map((s) => s.id),
        )
      ).map((h) => [h.swapId, h]),
    );

    for (const swap of swaps) {
      await this.sendSwapInfo(swap);
    }

    for (const reverseSwap of reverseSwaps as (ReverseSwap & {
      routingHint?: ReverseRoutingHint;
    })[]) {
      if (reverseRoutingHints.has(reverseSwap.id)) {
        reverseSwap.dataValues.routingHint = reverseRoutingHints.get(
          reverseSwap.id,
        )!.dataValues;

        reverseSwap.dataValues.routingHint.scriptPubkey = getHexString(
          reverseSwap.dataValues.routingHint.scriptPubkey,
        );
        reverseSwap.dataValues.routingHint.signature = getHexString(
          reverseSwap.dataValues.routingHint.signature,
        );

        {
          const blindingPubkey =
            reverseSwap.dataValues.routingHint.blindingPubkey;

          if (blindingPubkey !== null && blindingPubkey !== undefined) {
            reverseSwap.dataValues.routingHint.blindingPubkey =
              getHexString(blindingPubkey);
          }
        }
      }
      await this.sendSwapInfo(reverseSwap);
    }

    for (const chainSwap of chainSwaps) {
      await this.sendSwapInfo(chainSwap);
    }

    if ([swaps, reverseSwaps, chainSwaps].every((arr) => arr.length === 0)) {
      await this.sendCouldNotFindSwap(identifier);
    }
  };

  private getStats = async (args: string[]) => {
    let minYear: number;
    let minMonth: number;

    if (args.length !== 0) {
      switch (args[0].toLowerCase()) {
        case 'all':
          minYear = 0;
          minMonth = 0;
          break;

        default:
          await this.notificationClient.sendMessage(
            `Invalid parameter: ${args[0]}`,
          );
          return;
      }
    } else {
      const date = new Date();

      // Only show the last 6 months by default
      date.setMonth(date.getMonth() - 5);

      minYear = date.getUTCFullYear();
      minMonth = date.getUTCMonth();
    }

    await this.notificationClient.sendMessage(
      `${codeBlock}${stringify(
        await Stats.generate(minYear, minMonth),
      )}${codeBlock}`,
    );
  };

  private listSwaps = async (args: string[]) => {
    let status: string | undefined;
    let limit: number = 100;

    if (args.length > 0) {
      status = args[0];
    }

    if (args.length > 1) {
      limit = Number(args[1]);
      if (isNaN(limit)) {
        throw 'invalid limit';
      }

      limit = Math.round(limit);
    }

    await this.notificationClient.sendMessage(
      `${codeBlock}${stringify(await this.service.listSwaps(status, limit))}${codeBlock}`,
    );
  };

  private getBalance = async () => {
    const balances = (await this.service.getBalance()).toObject().balancesMap;

    let message = 'Balances:';

    balances.forEach(([symbol, bals]) => {
      message += `\n\n**${symbol}**\n`;

      bals.walletsMap.forEach(([service, walletBals]) => {
        message += `\n${service} Wallet: ${satoshisToSatcomma(
          walletBals.confirmed + walletBals.unconfirmed,
        )} ${symbol}`;
      });

      if (bals.lightningMap.length > 0) {
        message += '\n';
      }

      bals.lightningMap.forEach(([service, lightningBals]) => {
        message +=
          `\n${service}:\n` +
          `  Local: ${satoshisToSatcomma(lightningBals.local)} ${symbol}\n` +
          `  Remote: ${satoshisToSatcomma(lightningBals.remote)} ${symbol}`;
      });
    });

    await this.notificationClient.sendMessage(message);
  };

  private lockedFunds = async () => {
    const pendingReverseSwapsByChain = await this.service.getLockedFunds();
    let message = '**Locked up funds:**\n';

    for (const [symbol, chainArrays] of pendingReverseSwapsByChain) {
      message += `\n**${symbol}**`;

      let symbolTotal = 0;

      for (const pendingSwap of ([] as (ReverseSwap | ChainSwapInfo)[])
        .concat(chainArrays.reverseSwaps)
        .concat(chainArrays.chainSwaps)) {
        const amount =
          pendingSwap.type === SwapType.ReverseSubmarine
            ? (pendingSwap as ReverseSwap).onchainAmount
            : (pendingSwap as ChainSwapInfo).sendingData.amount!;

        symbolTotal += amount;
        message += `\n  - ${swapTypeToPrettyString(pendingSwap.type)} \`${pendingSwap.id}\`: ${satoshisToSatcomma(
          amount,
        )}`;
      }

      message += `\n\nTotal: ${satoshisToSatcomma(symbolTotal)}\n`;
    }

    await this.notificationClient.sendMessage(message);
  };

  private pendingSwaps = async () => {
    const [pendingSwaps, pendingReverseSwaps, pendingChainSwaps] =
      await Promise.all([
        SwapRepository.getSwaps({
          status: {
            [Op.notIn]: FinalSwapEvents,
          },
        }),
        ReverseSwapRepository.getReverseSwaps({
          status: {
            [Op.notIn]: FinalReverseSwapEvents,
          },
        }),
        ChainSwapRepository.getChainSwaps({
          status: {
            [Op.notIn]: FinalChainSwapEvents,
          },
        }),
      ]);

    let message = '';

    const addSwapIds = (type: SwapType, swaps: AnySwap[]) => {
      if (swaps.length === 0) {
        return;
      }
      message += `\n${message.endsWith('\n') ? '' : '\n'}**Pending ${swapTypeToPrettyString(
        type,
      )} Swaps:**\n\n`;

      for (const swap of swaps) {
        message += `- \`${swap.id}\`\n`;
      }
    };

    addSwapIds(SwapType.Submarine, pendingSwaps);
    addSwapIds(SwapType.ReverseSubmarine, pendingReverseSwaps);
    addSwapIds(SwapType.Chain, pendingChainSwaps);

    await this.notificationClient.sendMessage(message);
  };

  private pendingSweeps = async () => {
    const pendingSweeps =
      this.service.swapManager.deferredClaimer.pendingSweeps();

    await this.notificationClient.sendMessage(
      `${codeBlock}${stringify(
        mapToObject(
          new Map(
            Object.entries(pendingSweeps).map(([type, swaps]) => [
              swapTypeToString(Number(type)),
              mapToObject(swaps),
            ]),
          ),
        ),
      )}${codeBlock}`,
    );
  };

  private getReferrals = async () => {
    await this.notificationClient.sendMessage(
      `${codeBlock}${stringify(await ReferralStats.getReferralFees())}${codeBlock}`,
    );
  };

  private getAddress = async (args: string[]) => {
    const sendError = (error: any) => {
      return this.notificationClient.sendMessage(
        `Could not get address: ${formatError(error)}`,
      );
    };

    try {
      if (args.length === 0) {
        await sendError('no currency was specified');
        return;
      }

      if (args.length === 1) {
        await sendError('no label was specified');
        return;
      }

      const response = await this.service.getAddress(
        args[0].toUpperCase(),
        args[1],
      );
      await this.notificationClient.sendMessage(`\`${response}\``);
    } catch (error) {
      await sendError(error);
    }
  };

  private sweepSwaps = async (args: string[]) => {
    try {
      if (args.length === 0) {
        const sweeps = await this.service.swapManager.deferredClaimer.sweep();
        await this.notificationClient.sendMessage(
          `${codeBlock}${stringify(mapToObject(sweeps))}${codeBlock}`,
        );
      } else {
        const symbol = args[0].toUpperCase();
        const sweeps =
          await this.service.swapManager.deferredClaimer.sweepSymbol(symbol);
        await this.notificationClient.sendMessage(
          `${codeBlock}${stringify({ [symbol]: sweeps })}${codeBlock}`,
        );
      }
    } catch (e) {
      await this.notificationClient.sendMessage(
        `Could not sweep swaps: ${formatError(e)}`,
      );
    }
  };

  /*
   * Helper functions
   */

  private sendSwapInfo = async (swap: AnySwap) => {
    const name = `${swapTypeToPrettyString(swap.type)} Swap`;
    await this.notificationClient.sendMessage(
      `${name} \`${swap.id}\`:\n` +
        `${codeBlock}${stringify(swap)}${codeBlock}`,
    );
  };

  private sendCouldNotFindSwap = async (id: string) => {
    await this.notificationClient.sendMessage(
      `Could not find swap with id: ${id}`,
    );
  };
}

export default CommandHandler;
