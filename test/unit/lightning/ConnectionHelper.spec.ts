import Logger from '../../../lib/Logger';
import LndClient from '../../../lib/lightning/LndClient';
import ConnectionHelper from '../../../lib/lightning/ConnectionHelper';

let mockGetNodeInfoResult: any = {};
const mockGetNodeInfo = jest.fn().mockImplementation(async () => {
  return mockGetNodeInfoResult;
});

let mockConnectPeerThrows = false;
const mockConnectPeer = jest.fn().mockImplementation(async () => {
  if (mockConnectPeerThrows) {
    throw 'some error';
  }
});

jest.mock('../../../lib/lightning/LndClient', () => {
  return jest.fn().mockImplementation(() => ({
    connectPeer: mockConnectPeer,
    getNodeInfo: mockGetNodeInfo,
  }));
});

const MockedLndClient = <jest.Mock<LndClient>><any>LndClient;

describe('ConnectionHelper', () => {
  const lndClient = new MockedLndClient();
  const remotePublicKey = '0307ddfc30d0bbe50c52efcf05e6946dd1822854ca0c3edad73dc07fd88a8db1a0';

  const connectionHelper = new ConnectionHelper(Logger.disabledLogger);

  test('should connect to LND nodes by public key', async () => {
    const nodeAddress = '1.2.3.4';

    mockGetNodeInfoResult = {
      node: {
        addressesList: [
          {
            addr: nodeAddress,
          },
        ],
      },
    };
    mockConnectPeerThrows = false;

    await connectionHelper.connectByPublicKey(lndClient, remotePublicKey);

    expect(mockGetNodeInfo).toHaveBeenCalledTimes(1);
    expect(mockGetNodeInfo).toHaveBeenCalledWith(remotePublicKey);

    expect(mockConnectPeer).toHaveBeenCalledTimes(1);
    expect(mockConnectPeer).toHaveBeenCalledWith(remotePublicKey, nodeAddress);
  });

  test('should throw when no addresses are advertised', async () => {
    const expectedError = 'node does not advertise addresses';

    // No node info at all
    mockGetNodeInfoResult = {};
    await expect(connectionHelper.connectByPublicKey(lndClient, remotePublicKey)).rejects.toEqual(expectedError);

    // No publicly advertised addresses
    mockGetNodeInfoResult = {
      node: {
        addressesList: [],
      },
    }
    await expect(connectionHelper.connectByPublicKey(lndClient, remotePublicKey)).rejects.toEqual(expectedError);
  });

  test('should throw when connecting to all addresses fails', async () => {
    mockGetNodeInfoResult = {
      node: {
        addressesList: [
          {
            addr: 'random.onion',
          },
          {
            addr: '1.1.1.1',
          },
        ],
      }
    };
    mockConnectPeerThrows = true;

    await expect(connectionHelper.connectByPublicKey(lndClient, remotePublicKey)).rejects.toEqual(
      'could not connect to any of the advertised addresses',
    );
  });
});
