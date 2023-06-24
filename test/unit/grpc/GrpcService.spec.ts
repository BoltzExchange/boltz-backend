import { ServiceError } from '@grpc/grpc-js';
import * as boltzrpc from '../../../lib/proto/boltzrpc_pb';
import { getHexBuffer, getHexString } from '../../../lib/Utils';
import Service from '../../../lib/service/Service';
import GrpcService from '../../../lib/grpc/GrpcService';

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

jest.mock('../../../lib/service/Service', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getInfo: mockGetInfo,
      getBalance: mockGetBalance,
      deriveKeys: mockDeriveKeys,
      deriveBlindingKeys: mockDeriveBlindingKeys,
      getAddress: mockGetAddress,
      sendCoins: mockSendCoins,
      updateTimeoutBlockDelta: mockUpdateTimeoutBlockDelta,
      addReferral: mockAddReferral,
    };
  });
});

const mockedService = <jest.Mock<Service>>(<any>Service);

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

  const grpcService = new GrpcService(service);

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

  test('should handle DeriveBlindingKeys', () => {
    const callData = {
      address:
        'el1qqww2k9af23daf05txwvr6wk0n4wufpjks3yp7rfll5lwseruxf42egqn08jcypll40ph6m0dh00505s43tslxxchmvh8zlxuw',
    };

    const cb = jest.fn();
    grpcService.deriveBlindingKeys(createCall(callData), cb);

    expect(cb).toHaveBeenCalledTimes(1);
    const res = new boltzrpc.DeriveBlindingKeyResponse();
    res.setPublicKey(getHexString(mockDeriveBlindingKeysResponse.publicKey));
    res.setPrivateKey(getHexString(mockDeriveBlindingKeysResponse.privateKey));
    expect(cb).toHaveBeenCalledWith(null, res);

    expect(mockDeriveBlindingKeys).toHaveBeenCalledTimes(1);
    expect(mockDeriveBlindingKeys).toHaveBeenCalledWith(callData.address);
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
});
