import { Op } from 'sequelize';
import Logger from '../Logger';
import Stats from '../data/Stats';
import Report from '../data/Report';
import Swap from '../db/models/Swap';
import OtpManager from './OtpManager';
import Service from '../service/Service';
import DiscordClient from './DiscordClient';
import { NotificationConfig } from '../Config';
import { Balance } from '../proto/boltzrpc_pb';
import { SwapUpdateEvent } from '../consts/Enums';
import ReverseSwap from '../db/models/ReverseSwap';
import BackupScheduler from '../backup/BackupScheduler';
import ChannelCreation from '../db/models/ChannelCreation';
import { coinsToSatoshis, satoshisToCoins } from '../DenominationConverter';
import { getChainCurrency, stringify, splitPairId, getHexString, formatError } from '../Utils';
import has = Reflect.has;

enum Command {
  Help = 'help',

  // Commands that retrieve information
  GetFees = 'getfees',
  SwapInfo = 'swapinfo',
  GetStats = 'getstats',
  GetBalance = 'getbalance',
  LockedFunds = 'lockedfunds',
  PendingSwaps = 'pendingswaps',

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
  executor: (args: string[]) => Promise<void>
};

class CommandHandler {
  private optManager: OtpManager;

  private commands: Map<string, CommandInfo>;

  private static codeBlock = '\`\`\`';

  constructor(
    private logger: Logger,
    config: NotificationConfig,
    private discord: DiscordClient,
    private service: Service,
    private backupScheduler: BackupScheduler) {

    this.commands = new Map<string, CommandInfo>([
      [Command.Help, {
        usage: [
          {
            command: 'help [command]',
            description: 'gets more information about a single command',
          },
        ],
        executor: this.help,
        description: 'gets a list of all available commands',
      }],

      [Command.GetFees, {
        executor: this.getFees,
        description: 'gets accumulated fees',
      }],
      [Command.SwapInfo, {
        usage: [
          {
            command: 'swapinfo <id>',
            description: 'gets all available information about the (reverse) swap with the id `<id>`',
          },
        ],
        executor: this.swapInfo,
        description: 'gets all available information about a (reverse) swap',
      }],
      [Command.GetStats, {
        executor: this.getStats,
        description: 'gets stats of all successful swaps',
      }],
      [Command.GetBalance, {
        executor: this.getBalance,
        description: 'gets the balance of the wallets and channels',
      }],
      [Command.LockedFunds, {
        executor: this.lockedFunds,
        description: 'gets funds locked up by Boltz',
      }],
      [Command.PendingSwaps, {
        executor: this.pendingSwaps,
        description: 'gets a list of pending (reverse) swaps',
      }],

      [Command.Backup, {
        executor: this.backup,
        description: 'uploads a backup of the databases',
      }],
      [Command.Withdraw, {
        usage: [
          {
            command: 'withdraw <OTP token> <currency> <invoice>',
            description: 'withdraws lightning funds',
          },
          {
            command: 'withdraw <OTP token> <currency> <address> <amount in whole coins>',
            description: 'withdraws a specific amount of onchain coins',
          },
          {
            command: 'withdraw <OTP token> <currency> <address> all',
            description: 'withdraws all onchain coins',
          },
        ],
        executor: this.withdraw,
        description: 'withdraws coins from Boltz',
      }],
      [Command.GetAddress, {
        usage: [
          {
            command: 'getaddress <currency>',
            description: 'gets an address for the currency `<currency>`',
          },
        ],
        executor: this.getAddress,
        description: 'gets an address for a currency',
      }],
      [Command.ToggleReverseSwaps, {
        executor: this.toggleReverseSwaps,
        description: 'enables or disables reverse swaps',
      }],
    ]);

    this.optManager = new OtpManager(this.logger, config);

    this.discord.on('message', async (message: string) => {
      const args = message.split(' ');

      // Get the command and remove the first argument from the array which is the command itself
      const command = args.shift();

      if (command) {
        const commandInfo = this.commands.get(command.toLowerCase());

        if (commandInfo) {
          this.logger.debug(`Executing Discord command: ${command} ${args.join(', ')}`);
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

      await this.discord.sendMessage(message);
    } else {
      const command = args[0].toLowerCase();
      const info = this.commands.get(command);

      if (!info) {
        await this.discord.sendMessage(`Could not find command: ${command}`);
        return;
      }

      let message = `\`${command}\`: ${info.description}`;

      if (info.usage) {
        message += '\n\n**Usage:**\n';

        for (const usage of info.usage) {
          message += `\n\`${usage.command}\`: ${usage.description}`;
        }
      }

      await this.discord.sendMessage(message);
    }
  }

  private getFees = async () => {
    let message = 'Fees:\n';

    const { swaps, reverseSwaps } = await Report.getSuccessfulSwaps(
      this.service.swapManager.swapRepository,
      this.service.swapManager.reverseSwapRepository,
    );
    const fees = this.getFeeOfSwaps(swaps, reverseSwaps);

    fees.forEach((fee, symbol) => {
      message += `\n**${symbol}**: ${satoshisToCoins(fee)} ${symbol}`;
    });

    await this.discord.sendMessage(message);
  }

  private swapInfo = async (args: string[]) => {
    if (args.length === 0) {
      await this.sendCouldNotFindSwap('');
      return;
    }

    const id = args[0];

    const swap = await this.service.swapManager.swapRepository.getSwap({
      id: {
        [Op.eq]: id,
      },
    });

    if (swap) {
      const channelCreation = await this.service.swapManager.channelCreationRepository.getChannelCreation({
        swapId: {
          [Op.eq]: id,
        },
      });

      await this.sendSwapInfo(swap, false, channelCreation);
      return;
    } else {
      // Query for a reverse swap because there was no normal one found with the specified id
      const reverseSwap = await this.service.swapManager.reverseSwapRepository.getReverseSwap({
        id: {
          [Op.eq]: id,
        },
      });

      if (reverseSwap) {
        await this.sendSwapInfo(reverseSwap, true);
        return;
      }
    }

    await this.sendCouldNotFindSwap(id);
  }

  private getStats = async () => {
    const stats = await new Stats(this.service.swapManager.swapRepository, this.service.swapManager.reverseSwapRepository).generate();

    await this.discord.sendMessage(`${CommandHandler.codeBlock}${stats}${CommandHandler.codeBlock}`);
  }

  private getBalance = async () => {
    const balances = (await this.service.getBalance()).getBalancesMap();

    let message = 'Balances:';

    balances.forEach((balance: Balance, symbol: string) => {
      // tslint:disable-next-line:prefer-template
      message += `\n\n**${symbol}**\n` +
        `Wallet: ${satoshisToCoins(balance.getWalletBalance()!.getTotalBalance())} ${symbol}`;

      const lightningBalance = balance.getLightningBalance();

      if (lightningBalance) {
        // tslint:disable-next-line:prefer-template
        message += '\n\nLND:\n' +
          `  Local: ${satoshisToCoins(lightningBalance.getLocalBalance())} ${symbol}\n` +
          `  Remote: ${satoshisToCoins(lightningBalance.getRemoteBalance())} ${symbol}`;
      }
    });

    await this.discord.sendMessage(message);
  }

  private lockedFunds = async () => {
    const pendingReverseSwaps = await this.service.swapManager.reverseSwapRepository.getReverseSwaps({
      status: {
        [Op.or]: [
          SwapUpdateEvent.TransactionMempool,
          SwapUpdateEvent.TransactionConfirmed,
        ],
      },
    });

    const lockedFunds = new Map<string, number>();

    for (const pending of pendingReverseSwaps) {
      const pair = splitPairId(pending.pair);
      const chainCurrency = getChainCurrency(pair.base, pair.quote, pending.orderSide, true);

      const existingValue = lockedFunds.get(chainCurrency);

      if (existingValue !== undefined) {
        lockedFunds.set(chainCurrency, existingValue + pending.onchainAmount);
      } else {
        lockedFunds.set(chainCurrency, pending.onchainAmount);
      }
    }

    let message = '**Locked up funds:**\n';

    for (const [currency, amountLocked] of lockedFunds) {
      message += `\n- ${satoshisToCoins(amountLocked)} ${currency}`;
    }

    await this.discord.sendMessage(message);
  }

  private pendingSwaps = async () => {
    const [pendingSwaps, pendingReverseSwaps] = await Promise.all([
      this.service.swapManager.swapRepository.getSwaps({
        status: {
          [Op.not]: [
            SwapUpdateEvent.SwapExpired,
            SwapUpdateEvent.InvoiceFailedToPay,
            SwapUpdateEvent.TransactionClaimed,
          ],
        },
      }),
      this.service.swapManager.reverseSwapRepository.getReverseSwaps({
        status: {
          [Op.not]: [
            SwapUpdateEvent.SwapExpired,
            SwapUpdateEvent.InvoiceSettled,
            SwapUpdateEvent.TransactionFailed,
            SwapUpdateEvent.TransactionRefunded,
          ],
        },
      }),
    ]);

    let message = '';

    const formatSwapIds = (isReverse: boolean) => {
      const swaps = isReverse ? pendingReverseSwaps : pendingSwaps;

      if (swaps.length > 0) {
        message += `\n${message.endsWith('\n') ? '' : '\n'}**Pending${isReverse ? ' reverse' : ''} Swaps:**\n\n`;

        for (const swap of swaps) {
          message += `- \`${swap.id}\`\n`;
        }
      }
    };

    formatSwapIds(false);
    formatSwapIds(true);

    await this.discord.sendMessage(message);
  }

  private backup = async () => {
    try {
      await this.backupScheduler.uploadDatabase(new Date());

      await this.discord.sendMessage('Uploaded backup of Boltz database');
    } catch (error) {
      await this.discord.sendMessage(`Could not upload backup: ${error}`);
    }
  }

  private getAddress = async (args: string[]) => {
    try {
      if (args.length === 0) {
        throw 'no currency was specified';
      }

      const currency = args[0].toUpperCase();

      const response = await this.service.getAddress(currency);
      await this.discord.sendMessage(`\`${response}\``);
    } catch (error) {
      await this.discord.sendMessage(`Could not get address: ${formatError(error)}`);
    }
  }

  private withdraw = async (args: string[]) => {
    if (args.length !== 3 && args.length !== 4) {
      await this.discord.sendMessage('Invalid number of arguments');
      return;
    }

    const validToken = this.optManager.verify(args[0]);

    if (!validToken) {
      await this.discord.sendMessage('Invalid OTP token');
      return;
    }

    const symbol = args[1].toUpperCase();

    // Three arguments mean that just the OTP token, the symbol and a lightning invoice was provided
    if (args.length === 3) {
      try {
        const response = await this.service.payInvoice(symbol, args[2]);

        await this.discord.sendMessage(`Paid lightning invoice.\nPreimage: ${getHexString(response.paymentPreimage)}`);
      } catch (error) {
        await this.discord.sendMessage(`Could not pay lightning invoice: ${formatError(error)}`);
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

        await this.discord.sendMessage(`Sent transaction: ${response.transactionId}:${response.vout}`);
      } catch (error) {
        await this.discord.sendMessage(`Could not send coins: ${formatError(error)}`);
      }
    }
  }

  private toggleReverseSwaps = async () => {
    this.service.allowReverseSwaps = !this.service.allowReverseSwaps;

    const message = `${this.service.allowReverseSwaps ? 'Enabled' : 'Disabled'} Reverse Swaps`;

    this.logger.info(message);
    await this.discord.sendMessage(message);
  }

  /*
   * Helper functions
   */

  private getFeeOfSwaps = (swaps: Swap[], reverseSwaps: ReverseSwap[]) => {
    // A map between the symbols of the currencies and the fees collected on that chain
    const fees = new Map<string, number>();

    const getFeeFromSwapMap = (array: Swap[] | ReverseSwap[], isReverse: boolean) => {
      array.forEach((swap: Swap | ReverseSwap) => {
        const { base, quote } = splitPairId(swap.pair);
        const feeSymbol = getChainCurrency(base, quote, swap.orderSide, isReverse);

        const fee = fees.get(feeSymbol);

        if (fee) {
          fees.set(feeSymbol, fee + swap.fee!);
        } else {
          fees.set(feeSymbol, swap.fee!);
        }
      });
    };

    getFeeFromSwapMap(swaps, false);
    getFeeFromSwapMap(reverseSwaps, true);

    return fees;
  }

  private sendSwapInfo = async (swap: Swap | ReverseSwap, isReverse: boolean, channelCreation?: ChannelCreation) => {
    const hasChannelCreation = channelCreation !== null && channelCreation !== undefined;

    let name = '';

    if (hasChannelCreation) {
      name = 'Channel Creation';
    } else {
      if (isReverse) {
        name = 'Reverse Swap';
      } else {
        name = 'Swap';
      }
    }

    // tslint:disable-next-line: prefer-template
    await this.discord.sendMessage(`${name} \`${swap.id}\`:\n` +
        `${CommandHandler.codeBlock}${stringify(swap)}${hasChannelCreation ? '\n' + stringify(channelCreation) : ''}${CommandHandler.codeBlock}`);
  }

  private sendCouldNotFindSwap = async (id: string) => {
    await this.discord.sendMessage(`Could not find swap with id: ${id}`);
  }
}

export default CommandHandler;
