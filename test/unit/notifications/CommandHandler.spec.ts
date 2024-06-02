import { NotificationConfig } from '../../../lib/Config';
import {
  coinsToSatoshis,
  satoshisToSatcomma,
} from '../../../lib/DenominationConverter';
import Logger from '../../../lib/Logger';
import {
  getHexBuffer,
  getHexString,
  mapToObject,
  stringify,
} from '../../../lib/Utils';
import BackupScheduler from '../../../lib/backup/BackupScheduler';
import { SwapType, swapTypeToString } from '../../../lib/consts/Enums';
import ReferralStats from '../../../lib/data/ReferralStats';
import Stats from '../../../lib/data/Stats';
import Database from '../../../lib/db/Database';
import ChannelCreationRepository from '../../../lib/db/repositories/ChannelCreationRepository';
import PairRepository from '../../../lib/db/repositories/PairRepository';
import ReverseSwapRepository from '../../../lib/db/repositories/ReverseSwapRepository';
import SwapRepository from '../../../lib/db/repositories/SwapRepository';
import CommandHandler from '../../../lib/notifications/CommandHandler';
import { codeBlock } from '../../../lib/notifications/Markup';
import DiscordClient from '../../../lib/notifications/clients/DiscordClient';
import { Balances, GetBalanceResponse } from '../../../lib/proto/boltzrpc_pb';
import Service from '../../../lib/service/Service';
import { wait } from '../../Utils';
import {
  channelCreationExample,
  channelSwapExample,
  pendingReverseSwapExample,
  pendingSwapExample,
  reverseSwapExample,
  swapExample,
} from './ExampleSwaps';

const getRandomNumber = () => Math.floor(Math.random() * 10000);

type callback = (message: string) => void;

let sendMessage: callback;

const mockSendMessage = jest.fn().mockImplementation(() => Promise.resolve());

jest.mock('../../../lib/notifications/clients/DiscordClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      on: (event: string, callback: callback) => {
        expect(event).toEqual('message');

        sendMessage = callback;
      },
      sendMessage: mockSendMessage,
    };
  });
});

const referralStats = 'referralStats';

const mockGenerateReferralStats = jest
  .fn()
  .mockImplementation(() => Promise.resolve(referralStats));

jest.mock('../../../lib/data/ReferralStats');

const mockedDiscordClient = <jest.Mock<DiscordClient>>(<any>DiscordClient);

const createWalletBalance = () => {
  const walletBalance = new Balances.WalletBalance();

  walletBalance.setConfirmed(getRandomNumber());
  walletBalance.setUnconfirmed(getRandomNumber());

  return walletBalance;
};

const btcBalance = new Balances();

btcBalance.getWalletsMap().set('Core', createWalletBalance());

const lightningBalance = new Balances.LightningBalance();

lightningBalance.setLocal(getRandomNumber());
lightningBalance.setRemote(getRandomNumber());

btcBalance.getLightningMap().set('LND', lightningBalance);

const newAddress = 'bcrt1qymqsjl5qre2zc94wd04nd27p5vkvxqge7f0a8k';

const database = new Database(Logger.disabledLogger, ':memory:');

const mockGetAddress = jest.fn().mockResolvedValue(newAddress);

const mockedLockedFunds = new Map<string, any>();
mockedLockedFunds.set('BTC', {
  chainSwaps: [
    {
      type: SwapType.Chain,
      id: 'chain123',
      sendingData: {
        amount: 123,
      },
    },
  ],
  reverseSwaps: [
    { type: SwapType.ReverseSubmarine, id: 'r654321', onchainAmount: 1000000 },
  ],
});

const invoicePreimage = getHexBuffer(
  '765895dd514ce9358f1412c6b416d6a8f8ecea1a4e442d1e15ea8b76152fd241',
);
const mockPayInvoice = jest
  .fn()
  .mockImplementation(async (_: string, invoice: string) => {
    if (invoice !== 'throw') {
      return {
        preimage: invoicePreimage,
      };
    } else {
      throw 'lnd error';
    }
  });

const transactionId =
  '05cde2d7f0067604e3de2d2ce3e417dfd0dabecb63550a2b641b2d6cd3061780';
const transactionVout = 1;
const mockSendCoins = jest
  .fn()
  .mockImplementation(async (args: { address: string }) => {
    if (args.address !== 'throw') {
      return {
        transactionId,
        vout: transactionVout,
      };
    } else {
      throw 'onchain error';
    }
  });

jest.mock('../../../lib/service/Service', () => {
  return jest.fn().mockImplementation(() => {
    return {
      swapManager: {
        deferredClaimer: {
          pendingSweeps: jest.fn().mockReturnValue({
            [SwapType.Submarine]: new Map<string, string[]>([
              ['BTC', ['everything1', 'everything2']],
              ['L-BTC', ['everything3']],
            ]),
          }),
        },
      },
      getBalance: async () => {
        const res = new GetBalanceResponse();

        res.getBalancesMap().set('BTC', btcBalance);

        return res;
      },
      getLockedFunds: jest.fn().mockResolvedValue(mockedLockedFunds),
      getAddress: mockGetAddress,
      payInvoice: mockPayInvoice,
      sendCoins: mockSendCoins,
    };
  });
});

const mockedService = <jest.Mock<Service>>(<any>Service);

const mockUploadDatabase = jest
  .fn()
  .mockImplementation(() => Promise.resolve());

jest.mock('../../../lib/backup/BackupScheduler', () => {
  return jest.fn().mockImplementation(() => {
    return {
      uploadDatabase: mockUploadDatabase,
    };
  });
});

const mockedBackupScheduler = <jest.Mock<BackupScheduler>>(
  (<any>BackupScheduler)
);

const mockVerify = jest.fn().mockImplementation((token: string) => {
  return token === 'valid';
});

jest.mock('../../../lib/notifications/OtpManager', () => {
  return jest.fn().mockImplementation(() => {
    return {
      verify: mockVerify,
    };
  });
});

describe('CommandHandler', () => {
  const service = mockedService();
  service.allowReverseSwaps = true;

  new CommandHandler(
    Logger.disabledLogger,
    {} as any as NotificationConfig,
    mockedDiscordClient(),
    service,
    mockedBackupScheduler(),
  );

  beforeAll(async () => {
    await database.init();

    await PairRepository.addPair({
      id: 'LTC/BTC',
      base: 'LTC',
      quote: 'BTC',
    });

    await Promise.all([
      SwapRepository.addSwap(swapExample),
      SwapRepository.addSwap(pendingSwapExample),

      ReverseSwapRepository.addReverseSwap(reverseSwapExample),
      ReverseSwapRepository.addReverseSwap(pendingReverseSwapExample),

      SwapRepository.addSwap(channelSwapExample),
    ]);

    await ChannelCreationRepository.addChannelCreation(channelCreationExample);
  });

  beforeEach(() => {
    mockSendMessage.mockClear();
    ReferralStats.getReferralFees = mockGenerateReferralStats;
  });

  test('should not respond to messages that are not commands', async () => {
    sendMessage('clearly not a command');
    await wait(5);

    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  test('should deal with commands that are not all lower case', async () => {
    sendMessage('hElP');
    await wait(5);

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
  });

  test('should send help message', async () => {
    sendMessage('help');
    await wait(5);

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      'Commands:\n\n' +
        '**help**: gets a list of all available commands\n' +
        '**getfees**: gets accumulated fees\n' +
        '**swapinfo**: gets all available information about a swap\n' +
        '**getstats**: gets statistics grouped by year and month for the current and last 6 months\n' +
        '**getbalance**: gets the balance of the wallets and channels\n' +
        '**lockedfunds**: gets funds locked up by Boltz\n' +
        '**pendingswaps**: gets a list of pending swaps\n' +
        '**pendingsweeps**: gets all pending sweeps\n' +
        '**getreferrals**: gets stats for all referral IDs\n' +
        '**backup**: uploads a backup of the databases\n' +
        '**withdraw**: withdraws coins from Boltz\n' +
        '**getaddress**: gets an address for a currency\n' +
        '**togglereverse**: enables or disables reverse swaps',
    );
  });

  test('should send help for single command', async () => {
    // Should just send the description for commands that have no additonal arguments
    sendMessage('help getfees');
    await wait(5);

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      '`getfees`: gets accumulated fees',
    );

    // Should send the description and the usage for commands that have arguments
    sendMessage('help help');
    await wait(5);

    expect(mockSendMessage).toHaveBeenCalledTimes(2);
    expect(mockSendMessage).toHaveBeenCalledWith(
      '`help`: gets a list of all available commands\n\n**Usage:**\n\n`help [command]`: gets more information about a single command',
    );
  });

  test('should get accumulated fees', async () => {
    sendMessage('getfees');

    // Calculating the fees takes a little longer than the other commands
    await wait(50);

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenLastCalledWith(
      `Fees:\n\n**BTC**: ${satoshisToSatcomma(
        swapExample.fee! + reverseSwapExample.fee,
      )} BTC`,
    );
  });

  test('should get information about (reverse) swaps', async () => {
    // Submarine Swap
    sendMessage(`swapinfo ${swapExample.id}`);
    await wait(50);

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      `Submarine Swap \`${swapExample.id}\`:\n\`\`\`${stringify(
        await SwapRepository.getSwap({ id: swapExample.id }),
      )}\`\`\``,
    );

    // Channel Creation Swap
    sendMessage(`swapinfo ${channelSwapExample.id}`);
    await wait(50);

    expect(mockSendMessage).toHaveBeenCalledTimes(2);
    expect(mockSendMessage).toHaveBeenCalledWith(
      `Channel Creation \`${channelSwapExample.id}\`:\n\`\`\`` +
        `${stringify(
          await SwapRepository.getSwap({ id: channelSwapExample.id }),
        )}\n` +
        `${stringify(
          await ChannelCreationRepository.getChannelCreation({
            swapId: channelSwapExample.id,
          }),
        )}\`\`\``,
    );

    // Reverse Swap
    sendMessage(`swapinfo ${reverseSwapExample.id}`);
    await wait(50);

    expect(mockSendMessage).toHaveBeenCalledTimes(3);
    expect(mockSendMessage).toHaveBeenCalledWith(
      `Reverse Swap \`${reverseSwapExample.id}\`:\n\`\`\`${stringify(
        await ReverseSwapRepository.getReverseSwap({
          id: reverseSwapExample.id,
        }),
      )}\`\`\``,
    );

    const errorMessage = 'Could not find swap with id: ';

    // Send an error if there is no id provided
    sendMessage('swapinfo');

    expect(mockSendMessage).toHaveBeenCalledTimes(4);
    expect(mockSendMessage).toHaveBeenCalledWith(errorMessage);

    // Send an error if the swap cannot be found
    const id = 'notFound';
    sendMessage(`swapinfo ${id}`);

    await wait(10);

    expect(mockSendMessage).toHaveBeenCalledTimes(5);
    expect(mockSendMessage).toHaveBeenCalledWith(`${errorMessage}${id}`);
  });

  test('should get statistics', async () => {
    const spy = jest.spyOn(Stats, 'generate');

    sendMessage('getstats');
    await wait(50);

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      `\`\`\`${stringify({
        [new Date().getFullYear()]: {
          [new Date().getMonth() + 1]: {
            volume: {
              total: (0.03).toFixed(8),
              'LTC/BTC': (0.03).toFixed(8),
            },
            trades: {
              total: 3,
              'LTC/BTC': 3,
            },
            failureRates: {
              reverse: 0,
              submarine: 0,
            },
          },
        },
      })}\`\`\``,
    );
    expect(spy).toHaveBeenCalledTimes(1);

    const date = new Date();
    date.setMonth(date.getMonth() - 5);
    expect(spy).toHaveBeenLastCalledWith(
      date.getUTCFullYear(),
      date.getUTCMonth(),
    );

    sendMessage('getstats all');
    await wait(50);

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith(0, 0);

    sendMessage('getstats invalid');
    await wait(50);

    expect(mockSendMessage).toHaveBeenCalledTimes(3);
    expect(mockSendMessage).toHaveBeenCalledWith('Invalid parameter: invalid');
    expect(spy).toHaveBeenCalledTimes(2);
  });

  test('should get balances', async () => {
    sendMessage('getbalance');
    await wait(5);

    const wallet: Balances.WalletBalance = btcBalance
      .getWalletsMap()
      .get('Core');
    const lightning: Balances.LightningBalance = btcBalance
      .getLightningMap()
      .get('LND');

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      'Balances:\n\n' +
        `**BTC**\n\nCore Wallet: ${satoshisToSatcomma(
          wallet.getConfirmed() + wallet.getUnconfirmed(),
        )} BTC\n\n` +
        'LND:\n' +
        `  Local: ${satoshisToSatcomma(lightning.getLocal())} BTC\n` +
        `  Remote: ${satoshisToSatcomma(lightning.getRemote())} BTC`,
    );
  });

  test('should get locked up funds', async () => {
    sendMessage('lockedfunds');
    await wait(50);

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      '**Locked up funds:**\n\n' +
        '**BTC**\n' +
        '  - Reverse `r654321`: 0.01,000,000\n' +
        '  - Chain `chain123`: 0.00,000,123\n' +
        '\nTotal: 0.01,000,123\n',
    );
  });

  test('should get pending swaps', async () => {
    sendMessage('pendingswaps');
    await wait(50);

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      '\n\n**Pending Submarine Swaps:**\n\n' +
        `- \`${pendingSwapExample.id}\`\n\n` +
        '**Pending Reverse Swaps:**\n\n' +
        `- \`${pendingReverseSwapExample.id}\`\n`,
    );
  });

  test('should get pending sweeps', async () => {
    sendMessage('pendingsweeps');
    await wait(50);

    expect(
      service.swapManager.deferredClaimer.pendingSweeps,
    ).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      `${codeBlock}${stringify({
        [swapTypeToString(SwapType.Submarine)]: mapToObject(
          service.swapManager.deferredClaimer.pendingSweeps()[
            SwapType.Submarine
          ],
        ),
      })}${codeBlock}`,
    );
  });

  test('should get referral stats', async () => {
    sendMessage('getreferrals');
    await wait(50);

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      `\`\`\`${stringify(referralStats)}\`\`\``,
    );
  });

  test('should do a database backup', async () => {
    sendMessage('backup');
    await wait(5);

    expect(mockUploadDatabase).toHaveBeenCalledTimes(1);

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      'Uploaded backup of Boltz database',
    );
  });

  test('should withdraw coins', async () => {
    const currency = 'btc';

    // Pay lightning invoices and respond with the preimage
    const invoice = 'invoice';

    sendMessage(`withdraw valid ${currency} ${invoice}`);
    await wait(5);

    expect(mockVerify).toHaveBeenCalledTimes(1);

    expect(mockPayInvoice).toHaveBeenCalledTimes(1);
    expect(mockPayInvoice).toHaveBeenCalledWith(
      currency.toUpperCase(),
      invoice,
    );

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      `Paid lightning invoice\nPreimage: ${getHexString(invoicePreimage)}`,
    );

    // Send onchain coins and respond with transaction id and vout
    const address = 'address';
    const amount = 1;

    sendMessage(`withdraw valid ${currency} ${address} ${amount}`);
    await wait(5);

    expect(mockVerify).toHaveBeenCalledTimes(2);

    expect(mockSendCoins).toHaveBeenCalledTimes(1);
    expect(mockSendCoins).toHaveBeenCalledWith({
      address,
      sendAll: false,
      symbol: currency.toUpperCase(),
      amount: coinsToSatoshis(amount),
    });

    expect(mockSendMessage).toHaveBeenCalledTimes(2);
    expect(mockSendMessage).toHaveBeenCalledWith(
      `Sent transaction: ${transactionId}:${transactionVout}`,
    );

    // Send all onchain coins
    sendMessage(`withdraw valid ${currency} ${address} all`);
    await wait(5);

    expect(mockVerify).toHaveBeenCalledTimes(3);

    expect(mockSendCoins).toHaveBeenCalledTimes(2);
    expect(mockSendCoins).toHaveBeenCalledWith({
      address,
      amount: 0,
      sendAll: true,
      symbol: currency.toUpperCase(),
    });

    expect(mockSendMessage).toHaveBeenCalledTimes(3);
    expect(mockSendMessage).toHaveBeenCalledWith(
      `Sent transaction: ${transactionId}:${transactionVout}`,
    );

    // Send an error if paying a lighting invoice fails
    const throwInvoice = 'throw';

    sendMessage(`withdraw valid ${currency} ${throwInvoice}`);
    await wait(5);

    expect(mockVerify).toHaveBeenCalledTimes(4);

    expect(mockPayInvoice).toHaveBeenCalledTimes(2);
    expect(mockPayInvoice).toHaveBeenCalledWith(
      currency.toUpperCase(),
      throwInvoice,
    );

    expect(mockSendMessage).toHaveBeenCalledTimes(4);
    expect(mockSendMessage).toHaveBeenCalledWith(
      'Could not pay lightning invoice: lnd error',
    );

    // Send an error if sending onchain coins fails
    const throwAddress = 'throw';

    sendMessage(`withdraw valid ${currency} ${throwAddress} ${amount}`);
    await wait(5);

    expect(mockVerify).toHaveBeenCalledTimes(5);

    expect(mockSendCoins).toHaveBeenCalledTimes(3);
    expect(mockSendCoins).toHaveBeenCalledWith({
      sendAll: false,
      address: throwAddress,
      symbol: currency.toUpperCase(),
      amount: coinsToSatoshis(amount),
    });

    expect(mockSendMessage).toHaveBeenCalledTimes(5);
    expect(mockSendMessage).toHaveBeenCalledWith(
      'Could not send coins: onchain error',
    );

    // Send an error if an invalid number of arguments is provided
    sendMessage('withdraw');
    await wait(5);

    expect(mockSendMessage).toHaveBeenCalledTimes(6);
    expect(mockSendMessage).toHaveBeenCalledWith('Invalid number of arguments');

    // Send an error if the OTP token is invalid
    sendMessage('withdraw invalid token provided');
    await wait(5);

    expect(mockVerify).toHaveBeenCalledTimes(6);
    expect(mockVerify).toHaveBeenNthCalledWith(6, 'invalid');

    expect(mockSendMessage).toHaveBeenCalledTimes(7);
    expect(mockSendMessage).toHaveBeenCalledWith('Invalid OTP token');
  });

  test('should get addresses', async () => {
    sendMessage('getaddress BTC');
    await wait(5);

    expect(mockGetAddress).toHaveBeenCalledTimes(1);
    expect(mockGetAddress).toHaveBeenCalledWith('BTC');

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(`\`${newAddress}\``);

    // Send an error if no currency is specified
    sendMessage('getaddress');
    await wait(5);

    expect(mockSendMessage).toHaveBeenCalledTimes(2);
    expect(mockSendMessage).toHaveBeenCalledWith(
      'Could not get address: no currency was specified',
    );
  });

  test('should toggle reverse swaps', async () => {
    sendMessage('togglereverse');
    await wait(5);

    expect(service.allowReverseSwaps).toBeFalsy();

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith('Disabled Reverse Swaps');

    sendMessage('togglereverse');
    await wait(5);

    expect(service.allowReverseSwaps).toBeTruthy();

    expect(mockSendMessage).toHaveBeenCalledTimes(2);
    expect(mockSendMessage).toHaveBeenCalledWith('Enabled Reverse Swaps');
  });

  afterAll(async () => {
    await ChannelCreationRepository.dropTable();

    await Promise.all([
      SwapRepository.dropTable(),
      ReverseSwapRepository.dropTable(),
    ]);

    await PairRepository.dropTable();
    await database.close();
  });
});
