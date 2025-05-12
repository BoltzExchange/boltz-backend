import Logger from '../../../../lib/Logger';
import { NodeType } from '../../../../lib/db/models/ReverseSwap';
import type NotificationClient from '../../../../lib/notifications/NotificationClient';
import * as boltzrpc from '../../../../lib/proto/boltzrpc_pb';
import type DecodedInvoice from '../../../../lib/sidecar/DecodedInvoice';
import InvoicePaymentHook from '../../../../lib/swap/hooks/InvoicePaymentHook';

describe('InvoicePaymentHook', () => {
  let hook: InvoicePaymentHook;

  beforeEach(() => {
    jest.clearAllMocks();
    hook = new InvoicePaymentHook(
      Logger.disabledLogger,
      {} as unknown as NotificationClient,
    );
  });

  describe('hook', () => {
    test('should return undefined if not connected', async () => {
      hook['isConnected'] = jest.fn().mockReturnValue(false);

      const mockSendHook = jest.fn();
      hook['sendHook'] = mockSendHook;

      await expect(
        hook.hook('id', '', {} as unknown as DecodedInvoice),
      ).resolves.toBeUndefined();
      expect(mockSendHook).not.toHaveBeenCalled();
    });
  });

  describe('parseGrpcAction', () => {
    test.each`
      grpcNode             | expectedNodeType
      ${boltzrpc.Node.CLN} | ${NodeType.CLN}
      ${boltzrpc.Node.LND} | ${NodeType.LND}
    `(
      'should parse gRPC node $grpcNode to NodeType $expectedNodeType',
      ({ grpcNode, expectedNodeType }) => {
        const mockResponse = {
          getAction: () => grpcNode,
        } as boltzrpc.InvoicePaymentHookResponse;

        const result = hook['parseGrpcAction'](mockResponse);
        expect(result).toBe(expectedNodeType);
      },
    );
  });
});
