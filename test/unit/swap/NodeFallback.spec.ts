import crypto from 'crypto';
import Logger from '../../../lib/Logger';
import { NodeType } from '../../../lib/db/models/ReverseSwap';
import Errors from '../../../lib/swap/Errors';
import NodeFallback from '../../../lib/swap/NodeFallback';
import NodeSwitch from '../../../lib/swap/NodeSwitch';
import RoutingHints from '../../../lib/swap/routing/RoutingHints';
import { Currency } from '../../../lib/wallet/WalletManager';
import { raceCall } from '../../Utils';

let nodeForReverseSwap: any;

jest.mock('../../../lib/swap/NodeSwitch', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getNodeForReverseSwap: jest.fn().mockImplementation(() => {
        return nodeForReverseSwap;
      }),
    };
  });
});

const MockedNodeSwitch = <jest.Mock<NodeSwitch>>(<any>NodeSwitch);

const mockGetRoutingHintsResult = ['some', 'hints'];

jest.mock('../../../lib/swap/routing/RoutingHints', () => {
  return jest.fn().mockImplementation(() => ({
    getRoutingHints: jest.fn().mockResolvedValue(mockGetRoutingHintsResult),
  }));
});

const MockedRoutingHints = <jest.Mock<RoutingHints>>(<any>RoutingHints);

describe('NodeFallback', () => {
  const currency = { symbol: 'BTC' } as Currency;

  const nodeSwitch = MockedNodeSwitch();
  const routingHints = MockedRoutingHints();

  const fallback = new NodeFallback(
    Logger.disabledLogger,
    nodeSwitch,
    routingHints,
  );

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  test('should get holistic invoice', async () => {
    const invoice = 'lnbc1';
    const nodeType = NodeType.LND;

    nodeForReverseSwap = {
      nodeType,
      lightningClient: {
        raceCall,
        addHoldInvoice: jest.fn().mockResolvedValue(invoice),
      },
    };

    const id = 'someId';
    const holdInvoiceAmount = 10_000;
    const preimageHash = crypto.randomBytes(32);
    const cltvExpiry = 150;
    const expiry = 3600;
    const memo = 'pay pls';

    const res = await fallback.getReverseSwapInvoice(
      id,
      undefined,
      undefined,
      currency,
      holdInvoiceAmount,
      preimageHash,
      cltvExpiry,
      expiry,
      memo,
    );
    expect(res.paymentRequest).toEqual(invoice);
    expect(res.routingHints).toEqual([]);
    expect(res.nodeType).toEqual(nodeType);
    expect(res.lightningClient).toEqual(nodeForReverseSwap.lightningClient);

    expect(nodeSwitch.getNodeForReverseSwap).toHaveBeenCalledTimes(1);
    expect(nodeSwitch.getNodeForReverseSwap).toHaveBeenCalledWith(
      id,
      currency,
      holdInvoiceAmount,
      undefined,
    );
    expect(routingHints.getRoutingHints).toHaveBeenCalledTimes(0);
    expect(
      nodeForReverseSwap.lightningClient.addHoldInvoice,
    ).toHaveBeenCalledTimes(1);
    expect(
      nodeForReverseSwap.lightningClient.addHoldInvoice,
    ).toHaveBeenCalledWith(
      holdInvoiceAmount,
      preimageHash,
      cltvExpiry,
      expiry,
      memo,
      [],
    );
  });

  test('should get holistic invoice with routing hints', async () => {
    const referralId = 'referralId';
    const routingNode = 'someNode';
    const invoice = 'lnbc1';
    const nodeType = NodeType.LND;

    nodeForReverseSwap = {
      nodeType,
      lightningClient: {
        raceCall,
        addHoldInvoice: jest.fn().mockResolvedValue(invoice),
      },
    };

    const id = 'someId';
    const holdInvoiceAmount = 10_000;
    const preimageHash = crypto.randomBytes(32);
    const cltvExpiry = 150;
    const expiry = 3600;
    const memo = 'pay pls';

    const res = await fallback.getReverseSwapInvoice(
      id,
      referralId,
      routingNode,
      currency,
      holdInvoiceAmount,
      preimageHash,
      cltvExpiry,
      expiry,
      memo,
    );
    expect(res.paymentRequest).toEqual(invoice);
    expect(res.routingHints).toEqual(mockGetRoutingHintsResult);
    expect(res.nodeType).toEqual(nodeType);
    expect(res.lightningClient).toEqual(nodeForReverseSwap.lightningClient);

    expect(nodeSwitch.getNodeForReverseSwap).toHaveBeenCalledTimes(1);
    expect(nodeSwitch.getNodeForReverseSwap).toHaveBeenCalledWith(
      id,
      currency,
      holdInvoiceAmount,
      referralId,
    );
    expect(routingHints.getRoutingHints).toHaveBeenCalledTimes(1);
    expect(routingHints.getRoutingHints).toHaveBeenCalledWith(
      currency.symbol,
      routingNode,
      nodeForReverseSwap.nodeType,
    );
    expect(
      nodeForReverseSwap.lightningClient.addHoldInvoice,
    ).toHaveBeenCalledTimes(1);
    expect(
      nodeForReverseSwap.lightningClient.addHoldInvoice,
    ).toHaveBeenCalledWith(
      holdInvoiceAmount,
      preimageHash,
      cltvExpiry,
      expiry,
      memo,
      res.routingHints,
    );
  });

  test('should concat node and external routing hints', async () => {
    nodeForReverseSwap = {
      nodeType: NodeType.LND,
      lightningClient: {
        raceCall,
        addHoldInvoice: jest.fn().mockResolvedValue('lnbc1'),
      },
    };

    const invoiceAmount = 10_000;
    const preimageHash = crypto.randomBytes(32);
    const cltvExpiry = 150;
    const expiry = 3600;
    const memo = 'to pay';
    const hints: any = [[{ some: 'hints' }]];

    await fallback.getReverseSwapInvoice(
      'someId',
      undefined,
      'routingNode',
      currency,
      invoiceAmount,
      preimageHash,
      cltvExpiry,
      expiry,
      memo,
      hints,
    );

    expect(
      nodeForReverseSwap.lightningClient.addHoldInvoice,
    ).toHaveBeenCalledTimes(1);
    expect(
      nodeForReverseSwap.lightningClient.addHoldInvoice,
    ).toHaveBeenCalledWith(
      invoiceAmount,
      preimageHash,
      cltvExpiry,
      expiry,
      memo,
      mockGetRoutingHintsResult.concat(hints),
    );
  });

  test('should fallback to different client after timeout', async () => {
    nodeForReverseSwap = {
      nodeType: NodeType.LND,
      lightningClient: {
        raceCall,
        serviceName: () => 'LND',
        addHoldInvoice: jest
          .fn()
          .mockImplementation(() => new Promise(() => {})),
      },
    };

    const id = 'someId';
    const invoice = 'lnbc1';
    const holdInvoiceAmount = 10_000;
    const preimageHash = crypto.randomBytes(32);

    const promise = fallback.getReverseSwapInvoice(
      id,
      undefined,
      undefined,
      currency,
      holdInvoiceAmount,
      preimageHash,
    );
    expect(
      nodeForReverseSwap.lightningClient.addHoldInvoice,
    ).toHaveBeenCalledTimes(1);

    nodeForReverseSwap = {
      nodeType: NodeType.CLN,
      lightningClient: {
        raceCall,
        addHoldInvoice: jest.fn().mockResolvedValue(invoice),
      },
    };
    jest.runOnlyPendingTimers();

    const res = await promise;
    expect(
      nodeForReverseSwap.lightningClient.addHoldInvoice,
    ).toHaveBeenCalledTimes(1);

    expect(res.paymentRequest).toEqual(invoice);
    expect(res.routingHints).toEqual([]);
    expect(res.nodeType).toEqual(NodeType.CLN);
    expect(res.lightningClient).toEqual(nodeForReverseSwap.lightningClient);

    expect(nodeSwitch.getNodeForReverseSwap).toHaveBeenCalledTimes(2);
    expect(routingHints.getRoutingHints).toHaveBeenCalledTimes(0);
  });

  test('should throw non timeout related errors', async () => {
    const otherError = 'not working';

    nodeForReverseSwap = {
      nodeType: NodeType.LND,
      lightningClient: {
        raceCall,
        addHoldInvoice: jest.fn().mockRejectedValue(otherError),
      },
    };

    await expect(
      fallback.getReverseSwapInvoice(
        'id',
        undefined,
        undefined,
        currency,
        10_000,
        crypto.randomBytes(32),
      ),
    ).rejects.toEqual(otherError);
    expect(
      nodeForReverseSwap.lightningClient.addHoldInvoice,
    ).toHaveBeenCalledTimes(1);
  });

  test('should error when no clients are available', async () => {
    nodeForReverseSwap = {};
    await expect(
      fallback.getReverseSwapInvoice(
        '',
        undefined,
        undefined,
        currency,
        1,
        crypto.randomBytes(32),
      ),
    ).rejects.toEqual(Errors.NO_AVAILABLE_LIGHTNING_CLIENT());
  });
});
