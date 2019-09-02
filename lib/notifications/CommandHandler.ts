import { Op } from 'sequelize';
import Logger from '../Logger';
import Stats from '../data/Stats';
import Report from '../data/Report';
import Swap from '../db/models/Swap';
import OtpManager from './OtpManager';
import Service from '../service/Service';
import DiscordClient from './DiscordClient';
import { NotificationConfig } from '../Config';
import ReverseSwap from '../db/models/ReverseSwap';
import BackupScheduler from '../backup/BackupScheduler';
import { OutputType, Balance } from '../proto/boltzrpc_pb';
import { coinsToSatoshis, satoshisToCoins } from '../DenominationConverter';
import { getChainCurrency, stringify, splitPairId, getHexString } from '../Utils';

enum Command {
  Help = 'help',

  // Commands that retrieve information
  GetFees = 'getfees',
  SwapInfo = 'swapinfo',
  GetStats = 'getstats',
  GetBalance = 'getbalance',

  // Commands that generate a value or trigger a function
  Backup = 'backup',
  Withdraw = 'withdraw',
  NewAddress = 'newaddress',
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
      [Command.GetBalance, {
        executor: this.getBalance,
        description: 'gets the balance of the wallets and channels',
      }],
      [Command.GetStats, {
        executor: this.getStats,
        description: 'gets stats of all successful swaps',
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
      [Command.NewAddress, {
        usage: [
          {
            command: 'newaddress <currency>',
            description: 'generates a new compatibility address for the currency `<currency>`',
          },
          {
            command: 'newaddress <currency> [type]',
            // tslint:disable-next-line: prefer-template
            description: 'generates a new address for the currency `<currency>` of the type `[type]`. The available types are:\n' +
            '  - `bech32`\n' +
            '  - `compatibility`\n' +
            '  - `legacy`',
          },
        ],
        executor: this.newAddress,
        description: 'generates a new address for a currency',
      }],
      [Command.ToggleReverseSwaps, { description: 'enables or disables reverse swaps', executor: this.toggleReverseSwaps }],
    ]);

    this.optManager = new OtpManager(this.logger, config);

    this.discord.on('message', async (message: string) => {
      const args = message.split(' ');

      // Get and remove the first argument from the array which is the command itself
      const command = args.shift();

      if (command) {
        const commandInfo = this.commands.get(command.toLowerCase());

        if (commandInfo) {
          this.logger.debug(`Executing Discord command ${command}: ${args.join(', ')}`);
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

  private getBalance = async () => {
    const balances = (await this.service.getBalance()).getBalancesMap();

    let message = 'Balances:';

    balances.forEach((balance: Balance, symbol: string) => {
      // tslint:disable-next-line:prefer-template
      message += `\n\n**${symbol}**\n` +
        `Wallet: ${satoshisToCoins(balance.getWalletBalance()!.getTotalBalance())} ${symbol}`;

      const lightningBalance = balance.getLightningBalance();

      if (lightningBalance) {
        const channelBalance = lightningBalance.getChannelBalance()!;

        // tslint:disable-next-line:prefer-template
        message += '\n\nLND:\n' +
          `  Wallet: ${satoshisToCoins(lightningBalance.getWalletBalance()!.getTotalBalance())} ${symbol}\n\n` +
          '  Channels:\n' +
          `    Local: ${satoshisToCoins(channelBalance.getLocalBalance())} ${symbol}\n` +
          `    Remote: ${satoshisToCoins(channelBalance.getRemoteBalance())} ${symbol}`;
      }
    });

    await this.discord.sendMessage(message);
  }

  private getFees = async () => {
    let message = 'Fees:\n';

    const { swaps, reverseSwaps } = await Report.getSuccessfulSwaps(this.service.swapRepository, this.service.reverseSwapRepository);
    const fees = this.getFeeFromSwaps(swaps, reverseSwaps);

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

    const swap = await this.service.swapRepository.getSwap({
      id: {
        [Op.eq]: id,
      },
    });

    if (swap) {
      await this.sendSwapInfo(swap, false);
      return;
    } else {
      // Query for a reverse swap because there was no normal one found with the specified id
      const reverseSwap = await this.service.reverseSwapRepository.getReverseSwap({
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
    const stats = await new Stats(this.service.swapRepository, this.service.reverseSwapRepository).generate();

    await this.discord.sendMessage(`${CommandHandler.codeBlock}${stats}${CommandHandler.codeBlock}`);
  }

  private newAddress = async (args: string[]) => {
    try {
      if (args.length === 0) {
        throw 'no currency was specified';
      }

      const currency = args[0].toUpperCase();
      let outputType = OutputType.COMPATIBILITY;

      if (args.length > 1) {
        outputType = this.getOutputType(args[1]);
      }

      const response = await this.service.newAddress(currency, outputType);
      await this.discord.sendMessage(response);

    } catch (error) {
      await this.discord.sendMessage(`Could not generate address: ${error}`);
    }
  }

  private toggleReverseSwaps = async () => {
    this.service.allowReverseSwaps = !this.service.allowReverseSwaps;

    await this.discord.sendMessage(`${this.service.allowReverseSwaps ? 'Enabled' : 'Disabled'} reverse swaps`);
  }

  private backup = async () => {
    try {
      await this.backupScheduler.uploadDatabase(new Date());

      await this.discord.sendMessage('Uploaded backup of Boltz database');
    } catch (error) {
      await this.discord.sendMessage(`Could not upload backup: ${error}`);
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
        await this.discord.sendMessage(`Could not pay lightning invoice: ${this.formatError(error)}`);
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
        await this.discord.sendMessage(`Could not send coins: ${this.formatError(error)}`);
      }
    }
  }

  /*
   * Helper functions
   */

  private getOutputType = (type: string) => {
    switch (type.toLowerCase()) {
      case 'bech32': return OutputType.BECH32;
      case 'compatibility': return OutputType.COMPATIBILITY;
      case 'legacy': return OutputType.LEGACY;
    }

    throw `could not find output type: ${type}`;
  }

  private getFeeFromSwaps = (swaps: Swap[], reverseSwaps: ReverseSwap[]) => {
    // A map between the symbols of the currencies and the fees collected on that chain
    const fees = new Map<string, number>();

    const getFeeFromSwapMap = (array: Swap[] | ReverseSwap[], isReverse: boolean) => {
      array.forEach((swap: Swap | ReverseSwap) => {
        const { base, quote } = splitPairId(swap.pair);
        const feeSymbol = getChainCurrency(base, quote, swap.orderSide, isReverse);

        const fee = fees.get(feeSymbol);

        if (fee) {
          fees.set(feeSymbol, fee + swap.fee);
        } else {
          fees.set(feeSymbol, swap.fee);
        }
      });
    };

    getFeeFromSwapMap(swaps, false);
    getFeeFromSwapMap(reverseSwaps, true);

    return fees;
  }

  private sendSwapInfo = async (swap: Swap | ReverseSwap, isReverse: boolean) => {
    // tslint:disable-next-line: prefer-template
    await this.discord.sendMessage(`${isReverse ? 'Reverse swap' : 'Swap'} ${swap.id}:\n` +
        `${CommandHandler.codeBlock}${stringify(swap)}${CommandHandler.codeBlock}`);
  }

  private sendCouldNotFindSwap = async (id: string) => {
    await this.discord.sendMessage(`Could not find swap with id: ${id}`);
  }

  private formatError = (error: any) => {
    if (typeof error === 'string') {
      return error;
    } else if ('message' in error) {
      return error['message'];
    } else {
      return JSON.stringify(error);
    }
  }
}

export default CommandHandler;
