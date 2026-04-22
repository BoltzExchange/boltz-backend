import type { ServiceError } from '@grpc/grpc-js';
import { randomBytes } from 'crypto';
import Logger from '../../../lib/Logger';
import {
  getHexBuffer,
  getHexString,
  removeHexPrefix,
} from '../../../lib/Utils';
import type Api from '../../../lib/api/Api';
import { CurrencyType, SwapType } from '../../../lib/consts/Enums';
import type PendingEthereumTransaction from '../../../lib/db/models/PendingEthereumTransaction';
import PendingEthereumTransactionRepository from '../../../lib/db/repositories/PendingEthereumTransactionRepository';
import ReferralRepository from '../../../lib/db/repositories/ReferralRepository';
import TransactionLabelRepository from '../../../lib/db/repositories/TransactionLabelRepository';
import GrpcService from '../../../lib/grpc/GrpcService';
import * as boltzrpc from '../../../lib/proto/boltzrpc';
import Service from '../../../lib/service/Service';
import type NodeSwitch from '../../../lib/swap/NodeSwitch';
import type CreationHook from '../../../lib/swap/hooks/CreationHook';
import type InvoiceCreationHook from '../../../lib/swap/hooks/InvoiceCreationHook';
import type EthereumManager from '../../../lib/wallet/ethereum/EthereumManager';
import { networks } from '../../../lib/wallet/ethereum/EvmNetworks';

const getInfoData = {
  method: 'getInfo',
};

const mockGetInfo = jest.fn().mockResolvedValue(getInfoData);

const getBalanceData = {
  method: 'getBalance',
};
const mockGetBalance = jest.fn().mockResolvedValue(getBalanceData);

const mockDeriveKeysData = {
  method: 'deriveKeys',
};
const mockDeriveKeys = jest.fn().mockReturnValue(mockDeriveKeysData);

const gewAddressData = 'address';
const mockGetAddress = jest.fn().mockResolvedValue(gewAddressData);

const sendCoinsData = {
  vout: 1,
  transactionId: 'id',
};

const mockSendCoins = jest.fn().mockResolvedValue(sendCoinsData);

const mockAddReferralResponse = {
  apiKey: 'key',
  apiSecret: 'secret',
};
const mockAddReferral = jest
  .fn()
  .mockImplementation(() => mockAddReferralResponse);

const mockRotateReferralKeysResponse = {
  apiKey: 'rotated-key',
  apiSecret: 'rotated-secret',
};
const mockRotateReferralKeys = jest
  .fn()
  .mockImplementation(() => mockRotateReferralKeysResponse);

const mockDeriveBlindingKeysResponse = {
  publicKey: getHexBuffer('aa'),
  privateKey: getHexBuffer('bb'),
};
const mockDeriveBlindingKeys = jest
  .fn()
  .mockReturnValue(mockDeriveBlindingKeysResponse);

const mockUnblindOutputsFromIdResult = [
  {
    value: 1,
    asset: randomBytes(32),
    isLbtc: true,
    script: randomBytes(60),
    nonce: randomBytes(32),
  },
  {
    value: 2,
    asset: randomBytes(32),
    isLbtc: true,
    script: randomBytes(60),
    nonce: randomBytes(32),
    rangeProof: randomBytes(128),
    surjectionProof: randomBytes(33),
  },
];
const mockUnblindOutputsFromId = jest
  .fn()
  .mockResolvedValue(mockUnblindOutputsFromIdResult);

const mockUnblindOutputs = jest
  .fn()
  .mockResolvedValue(mockUnblindOutputsFromIdResult);

const transformOutputs = (outputs: any[]) => {
  return {
    outputs: outputs.map((out) => ({
      value: out.value.toString(),
      asset: out.asset,
      isLbtc: out.isLbtc,
      script: out.script,
      nonce: out.nonce,
      rangeProof: out.rangeProof,
      surjectionProof: out.surjectionProof,
    })),
  };
};

jest.mock('../../../lib/service/Service', () => {
  return jest.fn().mockImplementation(() => {
    return {
      walletManager: {
        ethereumManagers: [],
      },
      elementsService: {
        unblindOutputs: mockUnblindOutputs,
        deriveBlindingKeys: mockDeriveBlindingKeys,
        unblindOutputsFromId: mockUnblindOutputsFromId,
      },
      swapManager: {
        deferredClaimer: {
          sweep: jest.fn().mockResolvedValue(
            new Map<string, string[]>([
              ['BTC', ['everything1', 'everything2']],
              ['L-BTC', ['everything3']],
            ]),
          ),
          sweepSymbol: jest.fn().mockResolvedValue(['currency1', 'currency2']),
        },
      },
      getInfo: mockGetInfo,
      getBalance: mockGetBalance,
      deriveKeys: mockDeriveKeys,
      getAddress: mockGetAddress,
      sendCoins: mockSendCoins,
      addReferral: mockAddReferral,
      rotateReferralKeys: mockRotateReferralKeys,
      rescan: jest.fn().mockResolvedValue(831106),
      checkTransaction: jest.fn().mockResolvedValue(undefined),
    };
  });
});

const mockedService = <jest.Mock<Service>>(<any>Service);

const mockParseTransactionResult = 'parsed tx';
const mockParseTransaction = jest
  .fn()
  .mockReturnValue(mockParseTransactionResult);

jest.mock('../../../lib/Core', () => {
  return {
    parseTransaction: (...args: any[]) => mockParseTransaction(...args),
  };
});

const createCall = (data: any) => {
  return {
    request: data,
  } as any;
};

const createCallback = (
  callback: (error: ServiceError | any | null, response: any) => void,
) => {
  return (error: ServiceError | any | null, response: any) => {
    callback(error, response);
  };
};

const callUnaryAsPromise = <T>(
  method: (
    call: any,
    callback: (error: any, response?: T | null) => void,
  ) => void,
  call: any,
): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    method(call, (error, response) => {
      if (error) {
        reject(error);
      } else {
        resolve(response!);
      }
    });
  });

TransactionLabelRepository.getLabel = jest.fn().mockResolvedValue(null);

describe('GrpcService', () => {
  const service = mockedService();
  const api = {
    swapInfos: {
      cache: {
        delete: jest.fn(),
        clear: jest.fn(),
      },
    },
  } as unknown as Api;

  const grpcService = new GrpcService(Logger.disabledLogger, service, api);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should handle GetInfo', () => {
    grpcService.getInfo(
      createCall({}),
      createCallback((error, response) => {
        expect(error).toEqual(null);
        expect(response).toEqual(getInfoData);
      }),
    );

    expect(mockGetInfo).toHaveBeenCalledTimes(1);
  });

  test('should handle GetBalance', () => {
    grpcService.getBalance(
      createCall({}),
      createCallback((error, response) => {
        expect(error).toEqual(null);
        expect(response).toEqual(getBalanceData);
      }),
    );

    expect(mockGetBalance).toHaveBeenCalledTimes(1);
  });

  test('should handle DeriveKeys', () => {
    const callData = {
      symbol: 'symbol',
      index: 123,
    };

    grpcService.deriveKeys(
      createCall(callData),
      createCallback((error, response) => {
        expect(error).toEqual(null);
        expect(response).toEqual(mockDeriveKeysData);
      }),
    );

    expect(mockDeriveKeys).toHaveBeenCalledTimes(1);
    expect(mockDeriveKeys).toHaveBeenCalledWith(
      callData.symbol,
      callData.index,
    );
  });

  test('should handle DeriveBlindingKeys', async () => {
    const callData = {
      address:
        'el1qqww2k9af23daf05txwvr6wk0n4wufpjks3yp7rfll5lwseruxf42egqn08jcypll40ph6m0dh00505s43tslxxchmvh8zlxuw',
    };

    const cb = jest.fn();
    await grpcService.deriveBlindingKeys(createCall(callData), cb);

    expect(cb).toHaveBeenCalledTimes(1);

    const res: boltzrpc.DeriveBlindingKeyResponse = {
      publicKey: getHexString(mockDeriveBlindingKeysResponse.publicKey),
      privateKey: getHexString(mockDeriveBlindingKeysResponse.privateKey),
    };

    expect(cb).toHaveBeenCalledWith(null, res);

    expect(mockDeriveBlindingKeys).toHaveBeenCalledTimes(1);
    expect(mockDeriveBlindingKeys).toHaveBeenCalledWith(callData.address);
  });

  test('should handle UnblindOutputs with transaction id set', async () => {
    const req: any = {
      request: {
        id: 'id',
      },
    };

    const cb = jest.fn();
    await grpcService.unblindOutputs(req, cb);

    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(
      null,
      transformOutputs(mockUnblindOutputsFromIdResult),
    );

    expect(mockUnblindOutputsFromId).toHaveBeenCalledTimes(1);
    expect(mockUnblindOutputsFromId).toHaveBeenCalledWith(req.request.id);
  });

  test('should handle UnblindOutputs with transaction hex set', async () => {
    for (const [i, request] of [
      {
        id: undefined,
        hex: 'hex',
      },
      {
        id: '',
        hex: 'hex',
      },
    ].entries()) {
      const req: any = {
        request,
      };

      const cb = jest.fn();
      await grpcService.unblindOutputs(req, cb);

      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith(
        null,
        transformOutputs(mockUnblindOutputsFromIdResult),
      );

      expect(mockParseTransaction).toHaveBeenCalledTimes(i + 1);
      expect(mockParseTransaction).toHaveBeenCalledWith(
        CurrencyType.Liquid,
        request.hex,
      );

      expect(mockUnblindOutputs).toHaveBeenCalledTimes(i + 1);
      expect(mockUnblindOutputs).toHaveBeenCalledWith(
        mockParseTransactionResult,
      );
    }
  });

  test('should handle GetAddress', () => {
    const callData = {
      symbol: 'symbol',
      label: 'data',
    };

    grpcService.getAddress(
      createCall(callData),
      createCallback((error, response) => {
        expect(error).toEqual(null);
        expect(response!.address).toEqual(gewAddressData);
      }),
    );

    expect(mockGetAddress).toHaveBeenCalledTimes(1);
    expect(mockGetAddress).toHaveBeenCalledWith(
      callData.symbol,
      callData.label,
    );
  });

  test('should handle SendCoins', () => {
    const callData = {
      symbol: 'BTC',
      address: 'bcrt1qtest',
      amount: 100000,
      label: 'test label',
      sendAll: false,
      fee: 2,
    };

    grpcService.sendCoins(
      createCall(callData),
      createCallback((error, response) => {
        expect(error).toEqual(null);

        expect(response!.vout).toEqual(sendCoinsData.vout);
        expect(response!.transactionId).toEqual(sendCoinsData.transactionId);
      }),
    );

    expect(mockSendCoins).toHaveBeenCalledTimes(1);
    expect(mockSendCoins).toHaveBeenCalledWith(
      callData.symbol,
      callData.address,
      callData.amount,
      callData.label,
      callData.sendAll,
      callData.fee,
    );
  });

  test('should handle AddReferral', () => {
    const callData = {
      id: 'someId',
      feeShare: 123,
      routingNode: '03',
    };

    grpcService.addReferral(
      createCall(callData),
      createCallback((error, response) => {
        expect(error).toEqual(null);

        expect(response!.apiKey).toEqual(mockAddReferralResponse.apiKey);
        expect(response!.apiSecret).toEqual(mockAddReferralResponse.apiSecret);
      }),
    );

    expect(mockAddReferral).toHaveBeenCalledTimes(1);
    expect(mockAddReferral).toHaveBeenCalledWith({
      ...callData,
    });

    callData.routingNode = '';

    grpcService.addReferral(
      createCall(callData),
      createCallback((error, response) => {
        expect(error).toEqual(null);
        expect(response).not.toEqual(null);
      }),
    );

    expect(mockAddReferral).toHaveBeenCalledTimes(2);
    expect(mockAddReferral).toHaveBeenCalledWith({
      ...callData,
      routingNode: undefined,
    });
  });

  test.each(['__proto__', 'constructor', 'prototype'])(
    'should propagate reserved referral id error for AddReferral: %s',
    async (id) => {
      mockAddReferral.mockRejectedValueOnce(
        new Error(`referral IDs cannot use reserved names: ${id}`),
      );

      await expect(
        callUnaryAsPromise<boltzrpc.AddReferralResponse>(
          grpcService.addReferral,
          createCall({ id, feeShare: 1 }),
        ),
      ).rejects.toEqual(
        new Error(`referral IDs cannot use reserved names: ${id}`),
      );
    },
  );

  test('should handle RotateReferralKeys', async () => {
    const id = 'someId';

    const response =
      await callUnaryAsPromise<boltzrpc.RotateReferralKeysResponse>(
        grpcService.rotateReferralKeys,
        createCall({ id }),
      );

    expect(response.apiKey).toEqual(mockRotateReferralKeysResponse.apiKey);
    expect(response.apiSecret).toEqual(
      mockRotateReferralKeysResponse.apiSecret,
    );
    expect(mockRotateReferralKeys).toHaveBeenCalledTimes(1);
    expect(mockRotateReferralKeys).toHaveBeenCalledWith(id);
  });

  test('should propagate empty id errors from RotateReferralKeys', async () => {
    mockRotateReferralKeys.mockRejectedValueOnce(
      new Error('referral IDs cannot be empty'),
    );

    await expect(
      callUnaryAsPromise<boltzrpc.RotateReferralKeysResponse>(
        grpcService.rotateReferralKeys,
        createCall({ id: '' }),
      ),
    ).rejects.toEqual(new Error('referral IDs cannot be empty'));
  });

  test('should propagate not found errors from RotateReferralKeys', async () => {
    mockRotateReferralKeys.mockRejectedValueOnce(
      'could not find referral with id: ref',
    );

    await expect(
      callUnaryAsPromise<boltzrpc.RotateReferralKeysResponse>(
        grpcService.rotateReferralKeys,
        createCall({ id: 'ref' }),
      ),
    ).rejects.toEqual({ message: 'could not find referral with id: ref' });
  });

  test('should sweep swaps of one currency', async () => {
    const symbol = 'BTC';

    await new Promise<void>((resolve) => {
      grpcService.sweepSwaps(
        createCall({ symbol }),
        createCallback((error, response: boltzrpc.SweepSwapsResponse) => {
          expect(error).toEqual(null);
          expect(response.claimedSymbols).toEqual({
            BTC: { claimedIds: ['currency1', 'currency2'] },
          });
          resolve();
        }),
      );
    });

    expect(
      service.swapManager.deferredClaimer.sweepSymbol,
    ).toHaveBeenCalledTimes(1);
    expect(
      service.swapManager.deferredClaimer.sweepSymbol,
    ).toHaveBeenCalledWith(symbol);
  });

  test('should sweep swaps of all currencies', async () => {
    await new Promise<void>((resolve) => {
      grpcService.sweepSwaps(
        createCall({}),
        createCallback((error, response: boltzrpc.SweepSwapsResponse) => {
          expect(error).toEqual(null);
          expect(response.claimedSymbols).toEqual({
            BTC: { claimedIds: ['everything1', 'everything2'] },
            'L-BTC': { claimedIds: ['everything3'] },
          });
          resolve();
        }),
      );
    });

    expect(service.swapManager.deferredClaimer.sweep).toHaveBeenCalledTimes(1);
  });

  describe('listSwaps', () => {
    const listedSwaps = {
      submarine: ['sub', 'id'],
      reverse: ['reverse'],
      chain: ['some', 'ids'],
    };
    service.listSwaps = jest.fn().mockResolvedValue(listedSwaps);

    afterEach(() => {
      jest.clearAllMocks();
    });

    test('should list swaps', async () => {
      const status = 'swap.created';
      const limit = 123;

      const res = await new Promise<{
        error: unknown;
        response: boltzrpc.ListSwapsResponse;
      }>((resolve) => {
        grpcService.listSwaps(
          createCall({ status, limit }),
          createCallback((error, response: boltzrpc.ListSwapsResponse) =>
            resolve({ error, response }),
          ),
        );
      });
      expect(res.error).toBeNull();
      expect(res.response).toEqual({
        chainSwaps: listedSwaps.chain,
        reverseSwaps: listedSwaps.reverse,
        submarineSwaps: listedSwaps.submarine,
      });

      expect(service.listSwaps).toHaveBeenCalledTimes(1);
      expect(service.listSwaps).toHaveBeenCalledWith(status, limit);
    });

    test.each`
      status
      ${''}
      ${undefined}
    `('should coalesce empty status to undefined', async ({ status }) => {
      const limit = 1;

      await new Promise<{
        error: unknown;
        response: boltzrpc.ListSwapsResponse;
      }>((resolve) => {
        grpcService.listSwaps(
          createCall({ status, limit }),
          createCallback((error, response: boltzrpc.ListSwapsResponse) =>
            resolve({ error, response }),
          ),
        );
      });

      expect(service.listSwaps).toHaveBeenCalledTimes(1);
      expect(service.listSwaps).toHaveBeenCalledWith(undefined, limit);
    });
  });

  describe('rescan', () => {
    test('should rescan', async () => {
      const symbol = 'BTC';
      const startHeight = 420;

      await new Promise<void>((resolve) => {
        grpcService.rescan(
          createCall({ symbol, startHeight }),
          createCallback((error, response: boltzrpc.RescanResponse) => {
            expect(error).toEqual(null);
            expect(response).toEqual({
              startHeight,
              endHeight: '831106',
            });
            resolve();
          }),
        );
      });

      expect(service.rescan).toHaveBeenCalledTimes(1);
      expect(service.rescan).toHaveBeenCalledWith(
        symbol,
        startHeight,
        undefined,
      );
    });

    test('should rescan including mempool', async () => {
      const symbol = 'BTC';
      const startHeight = 421;

      await new Promise<void>((resolve) => {
        grpcService.rescan(
          createCall({ symbol, startHeight, includeMempool: true }),
          createCallback((error, response: boltzrpc.RescanResponse) => {
            expect(error).toEqual(null);
            expect(response).toEqual({
              startHeight,
              endHeight: '831106',
            });
            resolve();
          }),
        );
      });

      expect(service.rescan).toHaveBeenCalledTimes(1);
      expect(service.rescan).toHaveBeenCalledWith(symbol, startHeight, true);
    });
  });

  describe('checkTransaction', () => {
    test('should check transaction', async () => {
      const symbol = 'BTC';
      const id = 'someTxId';

      await new Promise<void>((resolve) => {
        grpcService.checkTransaction(
          createCall({ symbol, id }),
          createCallback((error, response) => {
            expect(error).toEqual(null);
            expect(response).toEqual({});
            resolve();
          }),
        );
      });

      expect(service.checkTransaction).toHaveBeenCalledTimes(1);
      expect(service.checkTransaction).toHaveBeenCalledWith(symbol, id);
    });
  });

  describe('getLabel', () => {
    test('should get label for transaction id', async () => {
      const label = {
        symbol: 'RBTC',
        label: 'some text',
      };
      TransactionLabelRepository.getLabel = jest.fn().mockResolvedValue(label);

      const txId = 'txId';

      await new Promise<void>((resolve) => {
        grpcService.getLabel(
          createCall({ txId }),
          createCallback((error, response: boltzrpc.GetLabelResponse) => {
            expect(error).toEqual(null);
            expect(response).toEqual(label);
            resolve();
          }),
        );
      });

      expect(TransactionLabelRepository.getLabel).toHaveBeenCalledTimes(1);
      expect(TransactionLabelRepository.getLabel).toHaveBeenCalledWith(txId);
    });

    test('should throw error when no label could be found', async () => {
      TransactionLabelRepository.getLabel = jest.fn().mockResolvedValue(null);

      const txId = 'notFound';

      await new Promise<void>((resolve) => {
        grpcService.getLabel(
          createCall({ txId }),
          createCallback((error) => {
            expect(error).toEqual({ message: 'no label found' });
            resolve();
          }),
        );
      });

      expect(TransactionLabelRepository.getLabel).toHaveBeenCalledTimes(1);
      expect(TransactionLabelRepository.getLabel).toHaveBeenCalledWith(txId);
    });
  });

  describe('getPendingEvmTransactions', () => {
    test('should get pending EVM transactions', async () => {
      const txs = [
        {
          hash: '0x1234',
          hex: '0x12345678',
          nonce: 123,
          etherAmount: 21_000_000_000,
          chain: networks.Rootstock.symbol,
        },
      ] as PendingEthereumTransaction[];

      PendingEthereumTransactionRepository.getTransactions = jest
        .fn()
        .mockResolvedValue(txs);

      const res = await new Promise<any>((resolve) => {
        grpcService.getPendingEvmTransactions(
          createCall({}),
          createCallback((error, response) => {
            expect(error).toEqual(null);
            resolve(response);
          }),
        );
      });

      expect(res.transactions).toEqual([
        {
          symbol: networks.Rootstock.symbol,
          hash: getHexBuffer(removeHexPrefix(txs[0].hash)),
          hex: getHexBuffer(removeHexPrefix(txs[0].hex)),
          nonce: txs[0].nonce.toString(),
          amountSent: txs[0].etherAmount.toString(),
        },
      ]);

      expect(
        PendingEthereumTransactionRepository.getTransactions,
      ).toHaveBeenCalledTimes(1);
      expect(
        PendingEthereumTransactionRepository.getTransactions,
      ).toHaveBeenCalledWith();
    });

    test('should get pending EVM transactions with received amount', async () => {
      const txs = [
        {
          hash: '0x1234',
          hex: '0x12345678',
          nonce: 123,
          etherAmount: 21_000_000_000,
          chain: networks.Rootstock.symbol,
        },
      ] as PendingEthereumTransaction[];

      PendingEthereumTransactionRepository.getTransactions = jest
        .fn()
        .mockResolvedValue(txs);

      const claimedAmount = 123123123123n;
      grpcService['service'].walletManager.ethereumManagers.push({
        hasSymbol: jest.fn().mockReturnValue(true),
        getClaimedAmount: jest
          .fn()
          .mockResolvedValue({ amount: claimedAmount }),
      } as unknown as EthereumManager);

      const res = await new Promise<any>((resolve) => {
        grpcService.getPendingEvmTransactions(
          createCall({}),
          createCallback((error, response) => {
            expect(error).toEqual(null);
            resolve(response);
          }),
        );
      });

      expect(res.transactions).toEqual([
        {
          symbol: networks.Rootstock.symbol,
          hash: getHexBuffer(removeHexPrefix(txs[0].hash)),
          hex: getHexBuffer(removeHexPrefix(txs[0].hex)),
          nonce: txs[0].nonce.toString(),
          amountSent: txs[0].etherAmount.toString(),
          amountReceived: claimedAmount.toString(),
        },
      ]);
    });

    test('should get pending EVM transactions with label', async () => {
      const txs = [
        {
          hash: '0x1234',
          hex: '0x12345678',
          nonce: 123,
          etherAmount: 21_000_000_000,
          chain: networks.Rootstock.symbol,
        },
      ] as PendingEthereumTransaction[];

      PendingEthereumTransactionRepository.getTransactions = jest
        .fn()
        .mockResolvedValue(txs);

      const claimedAmount = 123123123123n;
      grpcService['service'].walletManager.ethereumManagers.push({
        hasSymbol: jest.fn().mockReturnValue(true),
        getClaimedAmount: jest
          .fn()
          .mockResolvedValue({ amount: claimedAmount }),
      } as unknown as EthereumManager);

      TransactionLabelRepository.getLabel = jest.fn().mockResolvedValue({
        symbol: networks.Rootstock.symbol,
        label: 'some label',
      });

      const res = await new Promise<any>((resolve) => {
        grpcService.getPendingEvmTransactions(
          createCall({}),
          createCallback((error, response) => {
            expect(error).toEqual(null);
            resolve(response);
          }),
        );
      });

      expect(res.transactions).toEqual([
        {
          symbol: networks.Rootstock.symbol,
          label: 'some label',
          hash: getHexBuffer(removeHexPrefix(txs[0].hash)),
          hex: getHexBuffer(removeHexPrefix(txs[0].hex)),
          nonce: txs[0].nonce.toString(),
          amountSent: txs[0].etherAmount.toString(),
          amountReceived: claimedAmount.toString(),
        },
      ]);

      expect(TransactionLabelRepository.getLabel).toHaveBeenCalledTimes(1);
      expect(TransactionLabelRepository.getLabel).toHaveBeenCalledWith(
        txs[0].hash,
      );
    });

    test('should get pending EVM transactions with token symbol from token address', async () => {
      TransactionLabelRepository.getLabel = jest.fn().mockResolvedValue(null);

      const txs = [
        {
          hash: '0x1234',
          hex: '0x12345678',
          nonce: 123,
          etherAmount: 21_000_000_000,
          chain: networks.Rootstock.symbol,
        },
      ] as PendingEthereumTransaction[];

      PendingEthereumTransactionRepository.getTransactions = jest
        .fn()
        .mockResolvedValue(txs);

      const claimedAmount = 123123123123n;
      const tokenAddress = '0xTokenAddress123';
      const tokenSymbol = 'USDT';

      grpcService['service'].walletManager.ethereumManagers.length = 0;
      grpcService['service'].walletManager.ethereumManagers.push({
        hasSymbol: jest.fn().mockReturnValue(true),
        getClaimedAmount: jest.fn().mockResolvedValue({
          amount: claimedAmount,
          token: tokenAddress,
        }),
        tokenAddresses: new Map([[tokenSymbol, tokenAddress]]),
      } as unknown as EthereumManager);

      const res = await new Promise<any>((resolve) => {
        grpcService.getPendingEvmTransactions(
          createCall({}),
          createCallback((error, response) => {
            expect(error).toEqual(null);
            resolve(response);
          }),
        );
      });

      expect(res.transactions).toEqual([
        {
          symbol: tokenSymbol,
          hash: getHexBuffer(removeHexPrefix(txs[0].hash)),
          hex: getHexBuffer(removeHexPrefix(txs[0].hex)),
          nonce: txs[0].nonce.toString(),
          amountSent: txs[0].etherAmount.toString(),
          amountReceived: claimedAmount.toString(),
        },
      ]);
    });
  });

  describe('calculateTransactionFee', () => {
    test('should calculate transaction fee in sat/vbyte', async () => {
      const symbol = 'BTC';
      const transactionId = 'tx';

      service.calculateTransactionFee = jest.fn().mockResolvedValue({
        absolute: 123321,
        satPerVbyte: 21,
      });

      await new Promise<void>((resolve) => {
        grpcService.calculateTransactionFee(
          createCall({ symbol, transactionId }),
          createCallback(
            (error, response: boltzrpc.CalculateTransactionFeeResponse) => {
              expect(error).toEqual(null);
              expect(response).toEqual({
                absolute: '123321',
                satPerVbyte: 21,
                gwei: undefined,
              });
              resolve();
            },
          ),
        );
      });

      expect(service.calculateTransactionFee).toHaveBeenCalledTimes(1);
      expect(service.calculateTransactionFee).toHaveBeenCalledWith(
        symbol,
        transactionId,
      );
    });

    test('should calculate transaction fee in gwei', async () => {
      const symbol = 'RBTC';
      const transactionId = '0xtx';

      service.calculateTransactionFee = jest.fn().mockResolvedValue({
        gwei: 3.14,
        absolute: 3210,
      });

      await new Promise<void>((resolve) => {
        grpcService.calculateTransactionFee(
          createCall({ symbol, transactionId }),
          createCallback(
            (error, response: boltzrpc.CalculateTransactionFeeResponse) => {
              expect(error).toEqual(null);
              expect(response).toEqual({
                gwei: 3.14,
                absolute: '3210',
                satPerVbyte: undefined,
              });
              resolve();
            },
          ),
        );
      });

      expect(service.calculateTransactionFee).toHaveBeenCalledTimes(1);
      expect(service.calculateTransactionFee).toHaveBeenCalledWith(
        symbol,
        transactionId,
      );
    });
  });

  describe('swapCreationHook', () => {
    test('should set swap creation hook stream', () => {
      (service.swapManager.creationHook as any) = {
        connectToStream: jest.fn(),
      } as Partial<CreationHook>;

      const stream = {
        good: 'stream',
      } as any;
      grpcService.swapCreationHook(stream);

      expect(
        service.swapManager.creationHook.connectToStream,
      ).toHaveBeenCalledTimes(1);
      expect(
        service.swapManager.creationHook.connectToStream,
      ).toHaveBeenCalledWith(stream);
    });
  });

  describe('invoiceCreationHook', () => {
    test('should set invoice creation hook stream', () => {
      (service.swapManager.invoiceCreationHook as any) = {
        connectToStream: jest.fn(),
      } as Partial<InvoiceCreationHook>;

      const stream = {
        good: 'stream',
      } as any;
      grpcService.invoiceCreationHook(stream);

      expect(
        service.swapManager.invoiceCreationHook.connectToStream,
      ).toHaveBeenCalledTimes(1);
      expect(
        service.swapManager.invoiceCreationHook.connectToStream,
      ).toHaveBeenCalledWith(stream);
    });
  });

  describe('getReferrals', () => {
    test('should get all referrals', async () => {
      ReferralRepository.getReferrals = jest.fn().mockResolvedValue([
        {
          id: '1',
        },
        {
          id: '2',
          config: {
            test: 'data',
          },
        },
      ]);

      const res = await new Promise<boltzrpc.GetReferralsResponse>(
        (resolve, reject) => {
          grpcService.getReferrals(createCall({}), (error, response) => {
            if (error) {
              reject(error);
            } else {
              resolve(response!);
            }
          });
        },
      );

      const list = res.referral;
      expect(list).toHaveLength(2);

      expect(list[0].id).toEqual('1');
      expect(list[0].config).toBeUndefined();

      expect(list[1].id).toEqual('2');
      expect(list[1].config).toEqual(JSON.stringify({ test: 'data' }));

      expect(ReferralRepository.getReferrals).toHaveBeenCalledTimes(1);
    });

    test('should get referral by id', async () => {
      ReferralRepository.getReferralById = jest.fn().mockResolvedValue({
        id: 'ref',
        config: {
          data: 'test',
        },
      });

      const res = await new Promise<boltzrpc.GetReferralsResponse>(
        (resolve, reject) => {
          grpcService.getReferrals(
            createCall({ id: 'ref' }),
            (error, response) => {
              if (error) {
                reject(error);
              } else {
                resolve(response!);
              }
            },
          );
        },
      );

      const list = res.referral;
      expect(list).toHaveLength(1);

      expect(list[0].id).toEqual('ref');
      expect(list[0].config).toEqual(JSON.stringify({ data: 'test' }));

      expect(ReferralRepository.getReferralById).toHaveBeenCalledTimes(1);
      expect(ReferralRepository.getReferralById).toHaveBeenCalledWith('ref');
    });

    test('should throw when no referral with id exists', async () => {
      ReferralRepository.getReferralById = jest.fn().mockResolvedValue(null);

      await expect(
        new Promise<boltzrpc.GetReferralsResponse>((resolve, reject) => {
          grpcService.getReferrals(
            createCall({ id: 'ref' }),
            (error, response) => {
              if (error) {
                reject(error);
              } else {
                resolve(response!);
              }
            },
          );
        }),
      ).rejects.toEqual({ message: 'could not find referral with id: ref' });
    });
  });

  describe('setReferral', () => {
    beforeAll(() => {
      ReferralRepository.setConfig = jest.fn();
    });

    test('should set config', async () => {
      const ref = { id: 'ref' };
      ReferralRepository.getReferralById = jest.fn().mockResolvedValue(ref);

      const config = {
        some: 'new data',
      };

      await new Promise<boltzrpc.SetReferralResponse>((resolve, reject) => {
        grpcService.setReferral(
          createCall({ id: 'ref', config: JSON.stringify(config) }),
          (error, response) => {
            if (error) {
              reject(error);
            } else {
              resolve(response!);
            }
          },
        );
      });

      expect(ReferralRepository.getReferralById).toHaveBeenCalledTimes(1);
      expect(ReferralRepository.getReferralById).toHaveBeenCalledWith('ref');

      expect(ReferralRepository.setConfig).toHaveBeenCalledTimes(1);
      expect(ReferralRepository.setConfig).toHaveBeenCalledWith(ref, config);
    });

    test.each`
      config
      ${null}
      ${undefined}
    `('should set config to null', async ({ value }) => {
      const ref = { id: 'ref' };
      ReferralRepository.getReferralById = jest.fn().mockResolvedValue(ref);

      await new Promise<boltzrpc.SetReferralResponse>((resolve, reject) => {
        grpcService.setReferral(
          createCall({ id: 'ref', config: value }),
          (error, response) => {
            if (error) {
              reject(error);
            } else {
              resolve(response!);
            }
          },
        );
      });

      expect(ReferralRepository.getReferralById).toHaveBeenCalledTimes(1);
      expect(ReferralRepository.getReferralById).toHaveBeenCalledWith('ref');

      expect(ReferralRepository.setConfig).toHaveBeenCalledTimes(1);
      expect(ReferralRepository.setConfig).toHaveBeenCalledWith(ref, null);
    });

    test('should throw when new config is not an object', async () => {
      ReferralRepository.getReferralById = jest.fn().mockResolvedValue({});

      await expect(
        new Promise<boltzrpc.SetReferralResponse>((resolve, reject) => {
          grpcService.setReferral(
            createCall({ id: 'ref', config: '"not an object"' }),
            (error, response) => {
              if (error) {
                reject(error);
              } else {
                resolve(response!);
              }
            },
          );
        }),
      ).rejects.toEqual({ message: 'config is not an object' });
    });

    test('should throw when no referral with id exists', async () => {
      ReferralRepository.getReferralById = jest.fn().mockResolvedValue(null);

      await expect(
        new Promise<boltzrpc.SetReferralResponse>((resolve, reject) => {
          grpcService.setReferral(
            createCall({ id: 'ref' }),
            (error, response) => {
              if (error) {
                reject(error);
              } else {
                resolve(response!);
              }
            },
          );
        }),
      ).rejects.toEqual({ message: 'could not find referral with id: ref' });
    });
  });

  describe('invoicePaymentClnThreshold', () => {
    test('should set invoice payment cln thresholds', async () => {
      const mock = jest.fn();

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      grpcService['service'].nodeSwitch = {
        updateClnThresholds: mock,
      } as Partial<NodeSwitch>;

      await new Promise<boltzrpc.InvoiceClnThresholdResponse>(
        (resolve, reject) => {
          grpcService.invoiceClnThreshold(
            createCall({
              thresholds: [
                {
                  type: boltzrpc.SwapType.SUBMARINE,
                  threshold: 123,
                },
              ],
            }),
            (error, response) => {
              if (error) {
                reject(error);
              } else {
                resolve(response!);
              }
            },
          );
        },
      );

      expect(mock).toHaveBeenCalledTimes(1);
      expect(mock).toHaveBeenCalledWith([
        {
          type: SwapType.Submarine,
          threshold: 123,
        },
      ]);
    });
  });

  describe('devClearSwapUpdateCache', () => {
    test.each`
      id
      ${''}
      ${null}
      ${undefined}
    `('should clear cache when id is "$id"', async ({ id }) => {
      await new Promise<boltzrpc.DevClearSwapUpdateCacheResponse>(
        (resolve, reject) => {
          grpcService.devClearSwapUpdateCache(
            createCall({ id }),
            (error, response) => {
              if (error) {
                reject(error);
              } else {
                resolve(response!);
              }
            },
          );
        },
      );

      expect(api.swapInfos.cache.clear).toHaveBeenCalledTimes(1);
    });

    test('should delete entry from cache when id is provided', async () => {
      const id = 'asdf';
      await new Promise<boltzrpc.DevClearSwapUpdateCacheResponse>(
        (resolve, reject) => {
          grpcService.devClearSwapUpdateCache(
            createCall({ id }),
            (error, response) => {
              if (error) {
                reject(error);
              } else {
                resolve(response!);
              }
            },
          );
        },
      );

      expect(api.swapInfos.cache.delete).toHaveBeenCalledTimes(1);
      expect(api.swapInfos.cache.delete).toHaveBeenCalledWith(id);
    });
  });

  test('should handle resolved callbacks', async () => {
    const call = randomBytes(32);
    const cb = jest.fn();
    const handler = jest.fn().mockResolvedValue(1);

    await GrpcService['handleCallback'](call, cb, handler);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(call);

    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(null, await handler());
  });

  test('should handle rejected callbacks', async () => {
    const call = randomBytes(32);
    const cb = jest.fn();

    let rejection: any = { message: 'no' };
    const handler = jest.fn().mockImplementation(() => {
      throw rejection;
    });

    await GrpcService['handleCallback'](call, cb, handler);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(call);

    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(rejection, null);

    rejection = 'some string';

    await GrpcService['handleCallback'](call, cb, handler);

    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenCalledWith(call);

    expect(cb).toHaveBeenCalledTimes(2);
    expect(cb).toHaveBeenCalledWith({ message: rejection }, null);
  });
});
