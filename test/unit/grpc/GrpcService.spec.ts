// tslint:disable no-null-keyword

import { ServiceError } from 'grpc';
import Service from '../../../lib/service/Service';
import GrpcService from '../../../lib/grpc/GrpcService';

const getInfoData = {
  method: 'getInfo',
};

const mockGetInfo = jest.fn().mockImplementation(() => getInfoData);

const getBalanceData = {
  method: 'getBalance',
};

const mockGetBalance = jest.fn().mockImplementation(() => getBalanceData);

const newAddressData = 'address';

const mockNewAddress = jest.fn().mockImplementation(() => newAddressData);

const sendCoinsData = {
  vout: 1,
  transactionId: 'id',
};

const mockSendCoins = jest.fn().mockImplementation(() => sendCoinsData);

jest.mock('../../../lib/service/Service', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getInfo: mockGetInfo,
      getBalance: mockGetBalance,
      newAddress: mockNewAddress,
      sendCoins: mockSendCoins,
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
      type: 'type',
      symbol: 'symbol',
    };

    grpcService.newAddress(createCall(callData), createCallback((error, response) => {
      expect(error).toEqual(null);
      expect(response!.getAddress()).toEqual(newAddressData);
    }));

    expect(mockNewAddress).toHaveBeenCalledTimes(1);
    expect(mockNewAddress).toHaveBeenCalledWith(callData.symbol, callData.type);
  });

  test('should handle SendCoins', () => {
    const callData = {
      random: 'random',
      data: true,
    };

    grpcService.sendCoins(createCall(callData), createCallback((error, response) => {
      expect(error).toEqual(null);

      expect(response!.getVout()).toEqual(sendCoinsData.vout);
      expect(response!.getTransactionId()).toEqual(sendCoinsData.transactionId);
    }));

    expect(mockSendCoins).toHaveBeenCalledTimes(1);
    expect(mockSendCoins).toHaveBeenCalledWith(callData);
  });
});
