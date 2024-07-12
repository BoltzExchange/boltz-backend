import { Op } from 'sequelize';
import { satoshisToSatcomma } from '../DenominationConverter';
import Logger from '../Logger';
import { formatError, mapToObject, stringify } from '../Utils';
import BackupScheduler from '../backup/BackupScheduler';
import {
  FinalChainSwapEvents,
  FinalReverseSwapEvents,
  FinalSwapEvents,
  SwapType,
  swapTypeToPrettyString,
  swapTypeToString,
} from '../consts/Enums';
import { AnySwap } from '../consts/Types';
import ReferralStats from '../data/ReferralStats';
import Stats from '../data/Stats';
import ChannelCreation from '../db/models/ChannelCreation';
import ReverseRoutingHint from '../db/models/ReverseRoutingHint';
import ReverseSwap from '../db/models/ReverseSwap';
import ChainSwapRepository, {
  ChainSwapInfo,
} from '../db/repositories/ChainSwapRepository';
import ChannelCreationRepository from '../db/repositories/ChannelCreationRepository';
import FeeRepository from '../db/repositories/FeeRepository';
import ReverseRoutingHintRepository from '../db/repositories/ReverseRoutingHintRepository';
import ReverseSwapRepository from '../db/repositories/ReverseSwapRepository';
import SwapRepository from '../db/repositories/SwapRepository';
import Service from '../service/Service';
import { codeBlock } from './Markup';
import NotificationClient from './clients/NotificationClient';

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
  Withdraw = 'withdraw',
  GetAddress = 'getaddress',
  ToggleReverseSwaps = 'togglereverse',
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
    private backupScheduler: BackupScheduler,
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
        Command.Backup,
        {
          executor: this.backup,
          description: 'uploads a backup of the databases',
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
        Command.ToggleReverseSwaps,
        {
          executor: this.toggleReverseSwaps,
          description: 'enables or disables reverse swaps',
        },
      ],
    ]);

    this.notificationClient.on('message', async (message: string) => {
      const args = message.split(' ');

      // Get the command and remove the first argument from the array which is the command itself
      const command = args.shift();

      if (command) {
        const commandInfo = this.commands.get(command.toLowerCase());

        if (commandInfo) {
          this.logger.debug(
            `Executing ${this.notificationClient.serviceName} command: ${command} ${args.join(', ')}`,
          );
          try {
            await commandInfo.executor(args);
          } catch (e) {
            this.logger.warn(
              `${this.notificationClient.serviceName} command failed: ${formatError(e)}`,
            );
            await this.notificationClient.sendMessage(
              `Command failed: ${formatError(e)}`,
            );
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

    const reverseRoutingHints = new Map<string, ReverseRoutingHint>(
      (
        await ReverseRoutingHintRepository.getHints(
          reverseSwaps.map((s) => s.id),
        )
      ).map((h) => [h.swapId, h]),
    );

    for (const swap of swaps) {
      const channelCreation =
        await ChannelCreationRepository.getChannelCreation({
          swapId: swap.id,
        });

      await this.sendSwapInfo(swap, channelCreation);
    }

    for (const reverseSwap of reverseSwaps as (ReverseSwap & {
      routingHint?: ReverseRoutingHint;
    })[]) {
      if (reverseRoutingHints.has(reverseSwap.id)) {
        reverseSwap.dataValues.routingHint = reverseRoutingHints.get(
          reverseSwap.id,
        )!.dataValues;
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

  private backup = async () => {
    try {
      await this.backupScheduler.uploadDatabase(new Date());

      await this.notificationClient.sendMessage(
        'Uploaded backup of Boltz database',
      );
    } catch (error) {
      await this.notificationClient.sendMessage(
        `Could not upload backup: ${error}`,
      );
    }
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

  private toggleReverseSwaps = async () => {
    this.service.allowReverseSwaps = !this.service.allowReverseSwaps;

    const message = `${
      this.service.allowReverseSwaps ? 'Enabled' : 'Disabled'
    } Reverse Swaps`;

    this.logger.info(message);
    await this.notificationClient.sendMessage(message);
  };

  /*
   * Helper functions
   */

  private sendSwapInfo = async (
    swap: AnySwap,
    channelCreation?: ChannelCreation | null,
  ) => {
    const hasChannelCreation =
      channelCreation !== null && channelCreation !== undefined;

    let name: string;

    if (hasChannelCreation) {
      name = 'Channel Creation';
    } else {
      name = `${swapTypeToPrettyString(swap.type)} Swap`;
    }

    await this.notificationClient.sendMessage(
      `${name} \`${swap.id}\`:\n` +
        `${codeBlock}${stringify(swap)}${
          hasChannelCreation ? '\n' + stringify(channelCreation) : ''
        }${codeBlock}`,
    );
  };

  private sendCouldNotFindSwap = async (id: string) => {
    await this.notificationClient.sendMessage(
      `Could not find swap with id: ${id}`,
    );
  };
}

export default CommandHandler;
