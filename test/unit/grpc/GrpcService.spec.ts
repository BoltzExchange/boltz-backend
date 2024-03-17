import { ServiceError } from '@grpc/grpc-js';
import { randomBytes } from 'crypto';
import Logger from '../../../lib/Logger';
import { getHexBuffer, getHexString } from '../../../lib/Utils';
import { CurrencyType } from '../../../lib/consts/Enums';
import GrpcService from '../../../lib/grpc/GrpcService';
import * as boltzrpc from '../../../lib/proto/boltzrpc_pb';
import Service from '../../../lib/service/Service';

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

const mockUpdateTimeoutBlockDelta = jest.fn().mockImplementation(() => {});

const mockAddReferralResponse = {
  apiKey: 'key',
  apiSecret: 'secret',
};
const mockAddReferral = jest
  .fn()
  .mockImplementation(() => mockAddReferralResponse);

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
  const res = new boltzrpc.UnblindOutputsResponse();
  res.setOutputsList(
    outputs.map((out) => {
      const rpcOut = new boltzrpc.UnblindOutputsResponse.UnblindedOutput();
      rpcOut.setValue(out.value);
      rpcOut.setAsset(out.asset);
      rpcOut.setIsLbtc(out.isLbtc);
      rpcOut.setScript(out.script);
      rpcOut.setNonce(out.nonce);

      if (out.rangeProof) {
        rpcOut.setRangeProof(out.rangeProof);
      }

      if (out.surjectionProof) {
        rpcOut.setSurjectionProof(out.surjectionProof);
      }

      return rpcOut;
    }),
  );

  return res;
};

jest.mock('../../../lib/service/Service', () => {
  return jest.fn().mockImplementation(() => {
    return {
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
      rescan: jest.fn().mockResolvedValue(831106),
      updateTimeoutBlockDelta: mockUpdateTimeoutBlockDelta,
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
    request: {
      toObject: () => {
        return data;
      },
    },
  } as any;
};

const createCallback = (
  callback: (error: ServiceError | any | null, response: any) => void,
) => {
  return (error: ServiceError | any | null, response: any) => {
    expect(error).toBeNull();
    callback(error, response);
  };
};

describe('GrpcService', () => {
  const service = mockedService();

  const grpcService = new GrpcService(Logger.disabledLogger, service);

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

    const res = new boltzrpc.DeriveBlindingKeyResponse();
    res.setPublicKey(getHexString(mockDeriveBlindingKeysResponse.publicKey));
    res.setPrivateKey(getHexString(mockDeriveBlindingKeysResponse.privateKey));

    expect(cb).toHaveBeenCalledWith(null, res);

    expect(mockDeriveBlindingKeys).toHaveBeenCalledTimes(1);
    expect(mockDeriveBlindingKeys).toHaveBeenCalledWith(callData.address);
  });

  test('should handle UnblindOutputs with transaction id set', async () => {
    const req: any = {
      request: {
        hasId: () => true,
        getId: () => 'id',
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
    expect(mockUnblindOutputsFromId).toHaveBeenCalledWith(req.request.getId());
  });

  test('should handle UnblindOutputs with transaction hex set', async () => {
    for (const [i, request] of [
      {
        hasId: () => false,
        getHex: () => 'hex',
      },
      {
        hasId: () => true,
        getId: () => '',
        getHex: () => 'hex',
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
        request.getHex(),
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
    };

    grpcService.getAddress(
      createCall(callData),
      createCallback((error, response) => {
        expect(error).toEqual(null);
        expect(response!.getAddress()).toEqual(gewAddressData);
      }),
    );

    expect(mockGetAddress).toHaveBeenCalledTimes(1);
    expect(mockGetAddress).toHaveBeenCalledWith(callData.symbol);
  });

  test('should handle SendCoins', () => {
    const callData = {
      data: true,
      random: 'random',
    };

    grpcService.sendCoins(
      createCall(callData),
      createCallback((error, response) => {
        expect(error).toEqual(null);

        expect(response!.getVout()).toEqual(sendCoinsData.vout);
        expect(response!.getTransactionId()).toEqual(
          sendCoinsData.transactionId,
        );
      }),
    );

    expect(mockSendCoins).toHaveBeenCalledTimes(1);
    expect(mockSendCoins).toHaveBeenCalledWith(callData);
  });

  test('should handle UpdateTimeoutBlockDelta', () => {
    const callData = {
      pair: 'pair',
      reverseTimeout: 1,
      swapMinimalTimeout: 2,
      swapMaximalTimeout: 3,
      swapTaproot: 4,
    };

    grpcService.updateTimeoutBlockDelta(
      createCall(callData),
      createCallback((error, response) => {
        expect(error).toEqual(null);
        expect(response).not.toEqual(null);
      }),
    );

    expect(mockUpdateTimeoutBlockDelta).toHaveBeenCalledTimes(1);
    expect(mockUpdateTimeoutBlockDelta).toHaveBeenCalledWith(callData.pair, {
      reverse: callData.reverseTimeout,
      swapTaproot: callData.swapTaproot,
      swapMinimal: callData.swapMinimalTimeout,
      swapMaximal: callData.swapMaximalTimeout,
    });
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

        expect(response!.getApiKey()).toEqual(mockAddReferralResponse.apiKey);
        expect(response!.getApiSecret()).toEqual(
          mockAddReferralResponse.apiSecret,
        );
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

  test('should sweep swaps of one currency', async () => {
    const symbol = 'BTC';

    await new Promise<void>((resolve) => {
      grpcService.sweepSwaps(
        createCall({ symbol }),
        createCallback((error, response: boltzrpc.SweepSwapsResponse) => {
          expect(error).toEqual(null);
          expect(response.toObject().claimedSymbolsMap).toEqual([
            ['BTC', { claimedIdsList: ['currency1', 'currency2'] }],
          ]);
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
          expect(response.toObject().claimedSymbolsMap).toEqual([
            ['BTC', { claimedIdsList: ['everything1', 'everything2'] }],
            ['L-BTC', { claimedIdsList: ['everything3'] }],
          ]);
          resolve();
        }),
      );
    });

    expect(service.swapManager.deferredClaimer.sweep).toHaveBeenCalledTimes(1);
  });

  test('should rescan', async () => {
    const symbol = 'BTC';
    const startHeight = 420;

    await new Promise<void>((resolve) => {
      grpcService.rescan(
        createCall({ symbol, startHeight }),
        createCallback((error, response: boltzrpc.RescanResponse) => {
          expect(error).toEqual(null);
          expect(response.toObject()).toEqual({
            startHeight,
            endHeight: 831106,
          });
          resolve();
        }),
      );
    });

    expect(service.rescan).toHaveBeenCalledTimes(1);
    expect(service.rescan).toHaveBeenCalledWith(symbol, startHeight);
  });

  test('should handle resolved callbacks', async () => {
    const call = randomBytes(32);
    const cb = jest.fn();
    const handler = jest.fn().mockResolvedValue(1);

    await grpcService['handleCallback'](call, cb, handler);

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

    await grpcService['handleCallback'](call, cb, handler);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(call);

    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(rejection, null);

    rejection = 'some string';

    await grpcService['handleCallback'](call, cb, handler);

    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenCalledWith(call);

    expect(cb).toHaveBeenCalledTimes(2);
    expect(cb).toHaveBeenCalledWith({ message: rejection }, null);
  });
});
