// tslint:disable no-null-keyword

import { ServiceError } from 'grpc';
import { OutputType } from 'boltz-core';
import Service from '../../../lib/service/Service';
import GrpcService from '../../../lib/grpc/GrpcService';
import * as boltzrpc from '../../../lib/proto/boltzrpc_pb';

const getInfoData = {
  method: 'getInfo',
};

const mockGetInfo = jest.fn().mockResolvedValue(getInfoData);

const getBalanceData = {
  method: 'getBalance',
};

const mockGetBalance = jest.fn().mockResolvedValue(getBalanceData);

const newAddressData = 'address';

const mockNewAddress = jest.fn().mockResolvedValue(newAddressData);

const sendCoinsData = {
  vout: 1,
  transactionId: 'id',
};

const mockSendCoins = jest.fn().mockResolvedValue(sendCoinsData);

const mockUpdateTimeoutBlockDelta = jest.fn().mockImplementation(() => {});

jest.mock('../../../lib/service/Service', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getInfo: mockGetInfo,
      getBalance: mockGetBalance,
      newAddress: mockNewAddress,
      sendCoins: mockSendCoins,
      updateTimeoutBlockDelta: mockUpdateTimeoutBlockDelta,
    };
  });
});

const mockedService = <jest.Mock<Service>><any>Service;

const createCall = (data: any) => {
  return {
    request: {
      toObject: () => {
        return data;
      },
    },
  } as any;
};

const createCallback = (callback: (error: ServiceError | null, response: any) => void) => {
  return (error: ServiceError | null, response: any) => {
    try {
      callback(error, response);
    } catch (error) {
      fail(error);
    }
  };
};

describe('GrpcService', () => {
  const service = mockedService();

  const grpcService = new GrpcService(service);

  test('should handle GetInfo', () => {
    grpcService.getInfo(createCall({}), createCallback((error, response) => {
      expect(error).toEqual(null);
      expect(response).toEqual(getInfoData);
    }));

    expect(mockGetInfo).toHaveBeenCalledTimes(1);
  });

  test('should handle GetBalance', () => {
    const callData = {
      symbol: 'symbol',
    };

    grpcService.getBalance(createCall(callData), createCallback((error, response) => {
      expect(error).toEqual(null);
      expect(response).toEqual(getBalanceData);
    }));

    expect(mockGetBalance).toHaveBeenCalledTimes(1);
    expect(mockGetBalance).toHaveBeenCalledWith(callData.symbol);
  });

  test('should handle NewAddress', () => {
    const callData = {
      symbol: 'symbol',
      type: boltzrpc.OutputType.BECH32,
    };

    grpcService.newAddress(createCall(callData), createCallback((error, response) => {
      expect(error).toEqual(null);
      expect(response!.getAddress()).toEqual(newAddressData);
    }));

    expect(mockNewAddress).toHaveBeenCalledTimes(1);
    expect(mockNewAddress).toHaveBeenCalledWith(callData.symbol, OutputType.Bech32);
  });

  test('should handle SendCoins', () => {
    const callData = {
      data: true,
      random: 'random',
    };

    grpcService.sendCoins(createCall(callData), createCallback((error, response) => {
      expect(error).toEqual(null);

      expect(response!.getVout()).toEqual(sendCoinsData.vout);
      expect(response!.getTransactionId()).toEqual(sendCoinsData.transactionId);
    }));

    expect(mockSendCoins).toHaveBeenCalledTimes(1);
    expect(mockSendCoins).toHaveBeenCalledWith(callData);
  });

  test('should handle UpdateTimeoutBlockDelta', () => {
    const callData = {
      pair: 'pair',
      newDelta: 123,
    };

    grpcService.updateTimeoutBlockDelta(createCall(callData), createCallback((error, response) => {
      expect(error).toEqual(null);
      expect(response).not.toEqual(null);
    }));

    expect(mockUpdateTimeoutBlockDelta).toHaveBeenCalledTimes(1);
    expect(mockUpdateTimeoutBlockDelta).toHaveBeenCalledWith(callData.pair, callData.newDelta);
  });
});
