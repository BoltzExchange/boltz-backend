import { wait } from '../../Utils';
import Logger from '../../../lib/Logger';
import Database from '../../../lib/db/Database';
import Service from '../../../lib/service/Service';
import { stringify, satoshisToCoins } from '../../../lib/Utils';
import { swapExample, reverseSwapExample } from './ExampleSwaps';
import PairRepository from '../../../lib/service/PairRepository';
import SwapRepository from '../../../lib/service/SwapRepository';
import BackupScheduler from '../../../lib/backup/BackupScheduler';
import DiscordClient from '../../../lib/notifications/DiscordClient';
import CommandHandler from '../../../lib/notifications/CommandHandler';
import ReverseSwapRepository from '../../../lib/service/ReverseSwapRepository';
import { OutputType, Balance, WalletBalance, LightningBalance, ChannelBalance } from '../../../lib/proto/boltzrpc_pb';

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

lightningBalance.setWalletBalance(createWalletBalance());

const channelBalance = new ChannelBalance();

channelBalance.setLocalBalance(getRandomNumber());
channelBalance.setRemoteBalance(getRandomNumber());

lightningBalance.setChannelBalance(channelBalance);

btcBalance.setLightningBalance(lightningBalance);

const newAddress = 'bcrt1qymqsjl5qre2zc94wd04nd27p5vkvxqge7f0a8k';

const database = new Database(Logger.disabledLogger, ':memory:');

const pairRepository = new PairRepository();

const swapRepository = new SwapRepository();
const reverseSwapRepository = new ReverseSwapRepository();

const mockNewAddress = jest.fn().mockImplementation(() => Promise.resolve(newAddress));

jest.mock('../../../lib/service/Service', () => {
  return jest.fn().mockImplementation(() => {
    return {
      swapRepository,
      reverseSwapRepository,
      getBalance: () => Promise.resolve({
        getBalancesMap: () => new Map<string, Balance>([
          ['BTC', btcBalance],
        ]),
      }),
      newAddress: mockNewAddress,
    };
  });
});

const mockedService = <jest.Mock<Service>><any>Service;

jest.mock('../../../lib/backup/BackupScheduler', () => {
  return jest.fn().mockImplementation(() => {
    return {
      uploadDatabase: () => Promise.resolve(),
    };
  });
});

const mockedBackupScheduler = <jest.Mock<BackupScheduler>><any>BackupScheduler;

describe('CommandHandler', () => {
  const service = mockedService();
  service.allowReverseSwaps = true;

  const commandHandler = new CommandHandler(
    Logger.disabledLogger,
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
      reverseSwapRepository.addReverseSwap(reverseSwapExample),
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
  });

  test('should get accumulated fees', async () => {
    sendMessage('getfees');

    // Calculating the fees takes a little longer than the other commands
    await wait(50);

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenLastCalledWith(
      `Fees:\n\n**BTC**: ${satoshisToCoins(swapExample.fee + reverseSwapExample.fee)} BTC`,
    );
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
      `  Wallet: ${satoshisToCoins(lightningBalance.getWalletBalance()!.getTotalBalance())} BTC\n\n` +
      '  Channels:\n' +
      `    Local: ${satoshisToCoins(lightningBalance.getChannelBalance()!.getLocalBalance())} BTC\n` +
      `    Remote: ${satoshisToCoins(lightningBalance.getChannelBalance()!.getRemoteBalance())} BTC`,
    );
  });

  test('should get information about (reverse) swaps', async () => {
    sendMessage(`swapinfo ${swapExample.id}`);
    await wait(50);

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      `Swap ${swapExample.id}:\n\`\`\`${stringify(await swapRepository.getSwap({ id: swapExample.id }))}\`\`\``,
    );

    sendMessage(`swapinfo ${reverseSwapExample.id}`);
    await wait(50);

    expect(mockSendMessage).toHaveBeenCalledTimes(2);
    expect(mockSendMessage).toBeCalledWith(
      `Reverse swap ${reverseSwapExample.id}:\n\`\`\`${stringify(await reverseSwapRepository.getReverseSwap({ id: reverseSwapExample.id }))}\`\`\``,
    );

    const errorMessage = 'Could not find swap with id: ';

    // Send an error if there is no id provided
    sendMessage('swapinfo');

    expect(mockSendMessage).toHaveBeenCalledTimes(3);
    expect(mockSendMessage).toHaveBeenCalledWith(errorMessage);

    // Send an error if the swap cannot be found
    const id = 'notFound';
    sendMessage(`swapinfo ${id}`);

    await wait(10);

    expect(mockSendMessage).toHaveBeenCalledTimes(4);
    expect(mockSendMessage).toHaveBeenCalledWith(`${errorMessage}${id}`);
  });

  test('should get statistics', async () => {
    sendMessage('getstats');
    await wait(50);

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      `\`\`\`${stringify({
        failureRates: {
          swaps: 0,
          reverseSwaps: 0,
        },
        volume: {
          BTC: 0.02,
        },
        trades: {
          'LTC/BTC': 2,
        },
      },
    )}\`\`\``);
  });

  test('should parse output types', () => {
    const getOutputType = commandHandler['getOutputType'];

    expect(getOutputType('bech32')).toEqual(OutputType.BECH32);
    expect(getOutputType('compatibility')).toEqual(OutputType.COMPATIBILITY);
    expect(getOutputType('legacy')).toEqual(OutputType.LEGACY);

    expect(getOutputType('BECH32')).toEqual(OutputType.BECH32);

    const notFound = 'not found';

    expect(getOutputType.bind(getOutputType, notFound)).toThrow(`could not find output type: ${notFound}`);
  });

  test('should generate new addresses', async () => {
    sendMessage('newaddress BTC');
    await wait(5);

    expect(mockNewAddress).toHaveBeenCalledTimes(1);
    expect(mockNewAddress).toHaveBeenCalledWith('BTC', OutputType.COMPATIBILITY);

    sendMessage('newaddress BTC bech32');
    await wait(5);

    expect(mockNewAddress).toHaveBeenCalledTimes(2);
    expect(mockNewAddress).toHaveBeenCalledWith('BTC', OutputType.BECH32);

    // Send an error if no currency is specified
    sendMessage('newaddress');
    await wait(5);

    expect(mockSendMessage).toHaveBeenCalledTimes(3);
    expect(mockSendMessage).toHaveBeenCalledWith('Could not generate address: no currency was specified');
  });

  test('should toggle reverse swaps', async () => {
    sendMessage('togglereverse');
    await wait(5);

    expect(service.allowReverseSwaps).toBeFalsy();

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith('Disabled reverse swaps');

    sendMessage('togglereverse');
    await wait(5);

    expect(service.allowReverseSwaps).toBeTruthy();

    expect(mockSendMessage).toHaveBeenCalledTimes(2);
    expect(mockSendMessage).toHaveBeenCalledWith('Enabled reverse swaps');
  });

  test('should do a database backup', async () => {
    sendMessage('backup');
    await wait(5);

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith('Uploaded backup of databases');
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
