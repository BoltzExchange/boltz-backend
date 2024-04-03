import { Op } from 'sequelize';
import { NotificationConfig } from '../Config';
import { coinsToSatoshis, satoshisToSatcomma } from '../DenominationConverter';
import Logger from '../Logger';
import { formatError, getHexString, mapToObject, stringify } from '../Utils';
import BackupScheduler from '../backup/BackupScheduler';
import {
  NotPendingChainSwapEvents,
  NotPendingReverseSwapEvents,
  NotPendingSwapEvents,
  SwapType,
  swapTypeToPrettyString,
  swapTypeToString,
} from '../consts/Enums';
import ReferralStats from '../data/ReferralStats';
import Stats from '../data/Stats';
import ChannelCreation from '../db/models/ChannelCreation';
import ReverseSwap from '../db/models/ReverseSwap';
import Swap from '../db/models/Swap';
import ChainSwapRepository, {
  ChainSwapInfo,
} from '../db/repositories/ChainSwapRepository';
import ChannelCreationRepository from '../db/repositories/ChannelCreationRepository';
import FeeRepository from '../db/repositories/FeeRepository';
import ReverseSwapRepository from '../db/repositories/ReverseSwapRepository';
import SwapRepository from '../db/repositories/SwapRepository';
import Service from '../service/Service';
import { codeBlock } from './Markup';
import OtpManager from './OtpManager';
import NotificationClient from './clients/NotificationClient';

enum Command {
  Help = 'help',

  // Commands that retrieve information
  GetFees = 'getfees',
  SwapInfo = 'swapinfo',
  GetStats = 'getstats',
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
  private optManager: OtpManager;

  private commands: Map<string, CommandInfo>;

  constructor(
    private logger: Logger,
    config: NotificationConfig,
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
        Command.Withdraw,
        {
          usage: [
            {
              command: 'withdraw <OTP token> <currency> <invoice>',
              description: 'withdraws lightning funds',
            },
            {
              command:
                'withdraw <OTP token> <currency> <address> <amount in whole coins>',
              description: 'withdraws a specific amount of onchain coins',
            },
            {
              command: 'withdraw <OTP token> <currency> <address> all',
              description: 'withdraws all onchain coins',
            },
          ],
          executor: this.withdraw,
          description: 'withdraws coins from Boltz',
        },
      ],
      [
        Command.GetAddress,
        {
          usage: [
            {
              command: 'getaddress <currency>',
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

    this.optManager = new OtpManager(this.logger, config);

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
          await commandInfo.executor(args);
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
      await ReverseSwapRepository.getReverseSwaps({
        [Op.or]: {
          id: identifier,
          invoice: identifier,
          preimageHash: identifier,
          lockupAddress: identifier,
          transactionId: identifier,
        },
      }),
      await ChainSwapRepository.getChainSwapsByData(
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

    for (const swap of swaps) {
      const channelCreation =
        await ChannelCreationRepository.getChannelCreation({
          swapId: swap.id,
        });

      await this.sendSwapInfo(SwapType.Submarine, swap, channelCreation);
    }

    for (const reverseSwap of reverseSwaps) {
      await this.sendSwapInfo(SwapType.ReverseSubmarine, reverseSwap);
    }

    for (const chainSwap of chainSwaps) {
      await this.sendSwapInfo(SwapType.Chain, chainSwap);
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
            [Op.notIn]: NotPendingSwapEvents,
          },
        }),
        ReverseSwapRepository.getReverseSwaps({
          status: {
            [Op.notIn]: NotPendingReverseSwapEvents,
          },
        }),
        ChainSwapRepository.getChainSwaps({
          status: {
            [Op.notIn]: NotPendingChainSwapEvents,
          },
        }),
      ]);

    let message = '';

    const addSwapIds = (
      type: SwapType,
      swaps: (Swap | ReverseSwap | ChainSwapInfo)[],
    ) => {
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

      const currency = args[0].toUpperCase();

      const response = await this.service.getAddress(currency);
      await this.notificationClient.sendMessage(`\`${response}\``);
    } catch (error) {
      await sendError(error);
    }
  };

  private withdraw = async (args: string[]) => {
    if (args.length !== 3 && args.length !== 4) {
      await this.notificationClient.sendMessage('Invalid number of arguments');
      return;
    }

    const validToken = this.optManager.verify(args[0]);

    if (!validToken) {
      await this.notificationClient.sendMessage('Invalid OTP token');
      return;
    }

    const symbol = args[1].toUpperCase();

    // Three arguments mean that just the OTP token, the symbol and a lightning invoice was provided
    if (args.length === 3) {
      try {
        const response = await this.service.payInvoice(symbol, args[2]);

        await this.notificationClient.sendMessage(
          `Paid lightning invoice\nPreimage: ${getHexString(
            response.preimage,
          )}`,
        );
      } catch (error) {
        await this.notificationClient.sendMessage(
          `Could not pay lightning invoice: ${formatError(error)}`,
        );
      }

      // Four arguments mean that the OTP token, the symbol, an address and the amount were provided
    } else if (args.length === 4) {
      try {
        const sendAll = args[3] === 'all';
        const amount = sendAll ? 0 : coinsToSatoshis(Number(args[3]));

        const response = await this.service.sendCoins({
          amount,
          symbol,
          sendAll,

          address: args[2],
        });

        await this.notificationClient.sendMessage(
          `Sent transaction: ${response.transactionId}:${response.vout}`,
        );
      } catch (error) {
        await this.notificationClient.sendMessage(
          `Could not send coins: ${formatError(error)}`,
        );
      }
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
    type: SwapType,
    swap: ChainSwapInfo | Swap | ReverseSwap,
    channelCreation?: ChannelCreation | null,
  ) => {
    const hasChannelCreation =
      channelCreation !== null && channelCreation !== undefined;

    let name: string;

    if (hasChannelCreation) {
      name = 'Channel Creation';
    } else {
      switch (type) {
        case SwapType.Submarine:
          name = 'Submarine Swap';
          break;
        case SwapType.ReverseSubmarine:
          name = 'Reverse Swap';
          break;
        case SwapType.Chain:
          name = 'Chain Swap';
          break;
      }
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
