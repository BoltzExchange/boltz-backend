import { wait } from '../../Utils';
import Logger from '../../../lib/Logger';
import Database from '../../../lib/db/Database';
import Service from '../../../lib/service/Service';
import { NotificationConfig } from '../../../lib/Config';
import PairRepository from '../../../lib/db/PairRepository';
import SwapRepository from '../../../lib/db/SwapRepository';
import { stringify, getHexBuffer } from '../../../lib/Utils';
import BackupScheduler from '../../../lib/backup/BackupScheduler';
import DiscordClient from '../../../lib/notifications/DiscordClient';
import CommandHandler from '../../../lib/notifications/CommandHandler';
import ReverseSwapRepository from '../../../lib/db/ReverseSwapRepository';
import ChannelCreationRepository from '../../../lib/db/ChannelCreationRepository';
import { satoshisToCoins, coinsToSatoshis } from '../../../lib/DenominationConverter';
import { Balance, WalletBalance, LightningBalance } from '../../../lib/proto/boltzrpc_pb';
import {
  swapExample,
  channelSwapExample,
  pendingSwapExample,
  reverseSwapExample,
  channelCreationExample,
  pendingReverseSwapExample,
} from './ExampleSwaps';

const getRandomNumber = () => Math.floor(Math.random() * 10000);

type callback = (message: string) => void;

let sendMessage: callback;

const mockSendMessage = jest.fn().mockImplementation(() => Promise.resolve());

jest.mock('../../../lib/notifications/DiscordClient', () => {
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

const mockedDiscordClient = <jest.Mock<DiscordClient>><any>DiscordClient;

const createWalletBalance = () => {
  const walletBalance = new WalletBalance();

  walletBalance.setTotalBalance(getRandomNumber());
  walletBalance.setConfirmedBalance(getRandomNumber());
  walletBalance.setUnconfirmedBalance(getRandomNumber());

  return walletBalance;
};

const btcBalance = new Balance();

btcBalance.setWalletBalance(createWalletBalance());

const lightningBalance = new LightningBalance();

lightningBalance.setLocalBalance(getRandomNumber());
lightningBalance.setRemoteBalance(getRandomNumber());

btcBalance.setLightningBalance(lightningBalance);

const newAddress = 'bcrt1qymqsjl5qre2zc94wd04nd27p5vkvxqge7f0a8k';

const database = new Database(Logger.disabledLogger, ':memory:');

const pairRepository = new PairRepository();

const swapRepository = new SwapRepository();
const reverseSwapRepository = new ReverseSwapRepository();
const channelCreationRepository = new ChannelCreationRepository();

const mockGetAddress = jest.fn().mockResolvedValue(newAddress);

const invoicePreimage = '765895dd514ce9358f1412c6b416d6a8f8ecea1a4e442d1e15ea8b76152fd241';
const mockPayInvoice = jest.fn().mockImplementation(async (_: string, invoice: string) => {
  if (invoice !== 'throw') {
    return {
      preimage: getHexBuffer(invoicePreimage),
    };
  } else {
    throw 'lnd error';
  }
});

const transactionId = '05cde2d7f0067604e3de2d2ce3e417dfd0dabecb63550a2b641b2d6cd3061780';
const transactionVout = 1;
const mockSendCoins = jest.fn().mockImplementation(async (args: {
  address: string,
}) => {
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
        swapRepository,
        reverseSwapRepository,
        channelCreationRepository,
      },
      getBalance: () => Promise.resolve({
        getBalancesMap: () => new Map<string, Balance>([
          ['BTC', btcBalance],
        ]),
      }),
      getAddress: mockGetAddress,
      payInvoice: mockPayInvoice,
      sendCoins: mockSendCoins,
    };
  });
});

const mockedService = <jest.Mock<Service>><any>Service;

const mockUploadDatabase = jest.fn().mockImplementation(() => Promise.resolve());

jest.mock('../../../lib/backup/BackupScheduler', () => {
  return jest.fn().mockImplementation(() => {
    return {
      uploadDatabase: mockUploadDatabase,
    };
  });
});

const mockedBackupScheduler = <jest.Mock<BackupScheduler>><any>BackupScheduler;

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

    await pairRepository.addPair({
      id: 'LTC/BTC',
      base: 'LTC',
      quote: 'BTC',
    });

    await Promise.all([
      swapRepository.addSwap(swapExample),
      swapRepository.addSwap(pendingSwapExample),

      reverseSwapRepository.addReverseSwap(reverseSwapExample),
      reverseSwapRepository.addReverseSwap(pendingReverseSwapExample),

      swapRepository.addSwap(channelSwapExample),
      channelCreationRepository.addChannelCreation(channelCreationExample),
    ]);
  });

  beforeEach(() => {
    mockSendMessage.mockClear();
  });

  test('should not respond to messages that are no commands', async () => {
    sendMessage('clearly not a command');
    await wait(5);

    expect(mockSendMessage).toHaveBeenCalledTimes(0);
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
    // tslint:disable-next-line: prefer-template
    expect(mockSendMessage).toHaveBeenCalledWith('Commands:\n\n' +
      '**help**: gets a list of all available commands\n' +
      '**getfees**: gets accumulated fees\n' +
      '**swapinfo**: gets all available information about a (reverse) swap\n' +
      '**getstats**: gets stats of all successful swaps\n' +
      '**getbalance**: gets the balance of the wallets and channels\n' +
      '**lockedfunds**: gets funds locked up by Boltz\n' +
      '**pendingswaps**: gets a list of pending (reverse) swaps\n' +
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
    expect(mockSendMessage).toHaveBeenCalledWith('`getfees`: gets accumulated fees');

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
      `Fees:\n\n**BTC**: ${satoshisToCoins(swapExample.fee! + reverseSwapExample.fee)} BTC`,
    );
  });

  test('should get information about (reverse) swaps', async () => {
    // Submarine Swap
    sendMessage(`swapinfo ${swapExample.id}`);
    await wait(50);

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      `Swap \`${swapExample.id}\`:\n\`\`\`${stringify(await swapRepository.getSwap({ id: swapExample.id }))}\`\`\``,
    );

    // Channel Creation Swap
    sendMessage(`swapinfo ${channelSwapExample.id}`);
    await wait(50);

    expect(mockSendMessage).toHaveBeenCalledTimes(2);
    expect(mockSendMessage).toHaveBeenCalledWith(
      // tslint:disable-next-line:prefer-template
      `Channel Creation \`${channelSwapExample.id}\`:\n\`\`\`` +
      `${stringify(await swapRepository.getSwap({ id: channelSwapExample.id })) }\n` +
      `${stringify(await channelCreationRepository.getChannelCreation({ swapId: channelSwapExample.id }))}\`\`\``,
    );

    // Reverse Swap
    sendMessage(`swapinfo ${reverseSwapExample.id}`);
    await wait(50);

    expect(mockSendMessage).toHaveBeenCalledTimes(3);
    expect(mockSendMessage).toBeCalledWith(
      `Reverse Swap \`${reverseSwapExample.id}\`:\n\`\`\`${stringify(await reverseSwapRepository.getReverseSwap({ id: reverseSwapExample.id }))}\`\`\``,
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
    sendMessage('getstats');
    await wait(50);

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      `\`\`\`${stringify({
        [new Date().getFullYear()]: {
          [new Date().getMonth() + 1]: {
            failureRates: {
              swaps: 0,
              reverseSwaps: 0,
            },
            volume: {
              BTC: 0.03,
            },
            trades: {
              'LTC/BTC': 3,
            },
          },
        },
      },
    )}\`\`\``);
  });

  test('should get balances', async () => {
    sendMessage('getbalance');
    await wait(5);

    const lightningBalance = btcBalance.getLightningBalance()!;

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      // tslint:disable-next-line: prefer-template
      'Balances:\n\n' +
      `**BTC**\nWallet: ${satoshisToCoins(btcBalance.getWalletBalance()!.getTotalBalance())} BTC\n\n` +
      'LND:\n' +
      `  Local: ${satoshisToCoins(lightningBalance.getLocalBalance())} BTC\n` +
      `  Remote: ${satoshisToCoins(lightningBalance.getRemoteBalance())} BTC`,
    );
  });

  test('should get locked up funds', async () => {
    sendMessage('lockedfunds');
    await wait(50);

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      // tslint:disable-next-line: prefer-template
      '**Locked up funds:**\n\n' +
      '**BTC**\n' +
      '  - *r654321*: 1000000\n',
    );
  });

  test('should get pending swaps', async () => {
    sendMessage('pendingswaps');
    await wait(50);

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      // tslint:disable-next-line: prefer-template
      '\n\n**Pending Swaps:**\n\n' +
      `- \`${pendingSwapExample.id}\`\n\n` +
      '**Pending reverse Swaps:**\n\n' +
      `- \`${pendingReverseSwapExample.id}\`\n`,
    );
  });

  test('should do a database backup', async () => {
    sendMessage('backup');
    await wait(5);

    expect(mockUploadDatabase).toHaveBeenCalledTimes(1);

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith('Uploaded backup of Boltz database');
  });

  test('should withdraw coins', async () => {
    const currency = 'btc';

    // Pay lightning invoices and respond with the preimage
    const invoice = 'invoice';

    sendMessage(`withdraw valid ${currency} ${invoice}`);
    await wait(5);

    expect(mockVerify).toHaveBeenCalledTimes(1);

    expect(mockPayInvoice).toHaveBeenCalledTimes(1);
    expect(mockPayInvoice).toHaveBeenCalledWith(currency.toUpperCase(), invoice);

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(`Paid lightning invoice\nPreimage: ${invoicePreimage}`);

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
    expect(mockSendMessage).toHaveBeenCalledWith(`Sent transaction: ${transactionId}:${transactionVout}`);

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
    expect(mockSendMessage).toHaveBeenCalledWith(`Sent transaction: ${transactionId}:${transactionVout}`);

    // Send an error if paying a lighting invoice fails
    const throwInvoice = 'throw';

    sendMessage(`withdraw valid ${currency} ${throwInvoice}`);
    await wait(5);

    expect(mockVerify).toHaveBeenCalledTimes(4);

    expect(mockPayInvoice).toHaveBeenCalledTimes(2);
    expect(mockPayInvoice).toHaveBeenCalledWith(currency.toUpperCase(), throwInvoice);

    expect(mockSendMessage).toHaveBeenCalledTimes(4);
    expect(mockSendMessage).toHaveBeenCalledWith('Could not pay lightning invoice: lnd error');

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
    expect(mockSendMessage).toHaveBeenCalledWith('Could not send coins: onchain error');

    // Send an error if an invalid number of arguments is provided
    sendMessage('withdraw');
    await wait(5);

    expect(mockSendMessage).toHaveBeenCalledTimes(6);
    expect(mockSendMessage).toHaveBeenCalledWith('Invalid number of arguments');

    // Send an error if the OTP token is invalid
    sendMessage('withdraw invalid token provided');
    await wait(5);

    expect(mockVerify).toBeCalledTimes(6);
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
    expect(mockSendMessage).toHaveBeenCalledWith('Could not get address: no currency was specified');
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
    await Promise.all([
      swapRepository.dropTable(),
      reverseSwapRepository.dropTable(),
    ]);

    await pairRepository.dropTable();
    await database.close();
  });
});
