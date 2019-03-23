import { expect } from 'chai';
import { mock, instance, when, anything } from 'ts-mockito';
import Logger from '../../../lib/Logger';
import { getHexBuffer } from '../../../lib/Utils';
import RpcClient from '../../../lib/chain/RpcClient';
import ZmqClient from '../../../lib/chain/ZmqClient';
import ChainClient from '../../../lib/chain/ChainClient';

describe('ChainClient', () => {
  const rpcMock = mock(RpcClient);
  when(rpcMock.request('estimatesmartfee', anything()))
    .thenResolve({})
    .thenResolve({
      feerate: 0.00010640,
    });

  const relevantOutputs = new Set<string>();
  const zmqMock = mock(ZmqClient);
  when(zmqMock.relevantOutputs).thenReturn(relevantOutputs);

  const chainClient = new ChainClient(Logger.disabledLogger, {
    host: '',
    port: 0,
    rpcuser: '',
    rpcpass: '',
  }, 'BTC');

  // Access and execute private variables and functions to
  // init the ChainClient with the mocked classes
  chainClient['client'] = instance(rpcMock);
  chainClient['zmqClient'] = instance(zmqMock);

  chainClient['listenToZmq']();

  it('should estimate fee', async () => {
    // Verify that the default fee is 2 sats/vbyte
    expect(await chainClient.estimateFee()).to.be.equal(2);
    // Verify that the fee is calculated correctly
    expect(await chainClient.estimateFee(2)).to.be.equal(11);
  });

  it('should update the output filter', async () => {
    const outputs = [
      '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
      '0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098',
      '9b0fc92260312ce44e74ef369f5c66bbb85848f2eddd5a7a1cde251e54ccfdd5',
    ];

    const buffers: Buffer[] = [];

    outputs.forEach((output) => {
      buffers.push(getHexBuffer(output));
    });

    await chainClient.updateOutputFilter(buffers);

    expect(relevantOutputs.size).to.be.equal(outputs.length);

    outputs.forEach((output) => {
      expect(relevantOutputs.has(output)).to.be.true;
    });
  });
});
