import { ServiceError } from 'grpc';
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

jest.mock('../../../lib/service/Service', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getInfo: mockGetInfo,
      getBalance: mockGetBalance,
      deriveKeys: mockDeriveKeys,
      getAddress: mockGetAddress,
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
    expect(error).toBeNull();
    callback(error, response);
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
    grpcService.getBalance(createCall({}), createCallback((error, response) => {
      expect(error).toEqual(null);
      expect(response).toEqual(getBalanceData);
    }));

    expect(mockGetBalance).toHaveBeenCalledTimes(1);
  });

  test('should handle DeriveKeys', () => {
    const callData = {
      symbol: 'symbol',
      index: 123,
    };

    grpcService.deriveKeys(createCall(callData), createCallback((error, response) => {
      expect(error).toEqual(null);
      expect(response).toEqual(mockDeriveKeysData);
    }));

    expect(mockDeriveKeys).toHaveBeenCalledTimes(1);
    expect(mockDeriveKeys).toHaveBeenCalledWith(callData.symbol, callData.index);
  });

  test('should handle GetAddress', () => {
    const callData = {
      symbol: 'symbol',
    };

    grpcService.getAddress(createCall(callData), createCallback((error, response) => {
      expect(error).toEqual(null);
      expect(response!.getAddress()).toEqual(gewAddressData);
    }));

    expect(mockGetAddress).toHaveBeenCalledTimes(1);
    expect(mockGetAddress).toHaveBeenCalledWith(callData.symbol);
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
