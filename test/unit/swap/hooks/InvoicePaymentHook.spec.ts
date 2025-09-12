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
      grpcNode             | expected
      ${boltzrpc.Node.CLN} | ${{ node: NodeType.CLN }}
      ${boltzrpc.Node.LND} | ${{ node: NodeType.LND }}
      ${undefined}         | ${{ node: undefined }}
    `(
      'should parse gRPC node $grpcNode to NodeType $expectedNodeType',
      ({ grpcNode, expected }) => {
        const mockResponse = {
          hasAction: () => true,
          getAction: () => grpcNode,
          hasTimePreference: () => false,
        } as boltzrpc.InvoicePaymentHookResponse;

        expect(hook['parseGrpcAction'](mockResponse)).toEqual(expected);
      },
    );

    describe('when no action provided', () => {
      test('should return node undefined if no time preference', () => {
        const mockResponse = {
          hasAction: () => false,
          hasTimePreference: () => false,
        } as boltzrpc.InvoicePaymentHookResponse;
        expect(hook['parseGrpcAction'](mockResponse)).toEqual({
          node: undefined,
        });
      });

      test('should return time preference when time preference provided', () => {
        const mockResponse = {
          hasAction: () => false,
          hasTimePreference: () => true,
          getTimePreference: () => -0.5,
        } as boltzrpc.InvoicePaymentHookResponse;

        expect(hook['parseGrpcAction'](mockResponse)).toEqual({
          node: undefined,
          timePreference: -0.5,
        });
      });
    });

    describe('when both action and time preference provided', () => {
      test('should return both node and time preference', () => {
        const mockResponse = {
          hasAction: () => true,
          getAction: () => boltzrpc.Node.LND,
          hasTimePreference: () => true,
          getTimePreference: () => 0.8,
        } as boltzrpc.InvoicePaymentHookResponse;

        expect(hook['parseGrpcAction'](mockResponse)).toEqual({
          node: NodeType.LND,
          timePreference: 0.8,
        });
      });
    });

    describe('time preference validation', () => {
      test.each`
        timePreference
        ${-1}
        ${-0.123}
        ${0}
        ${0.123}
        ${0.5}
        ${1}
      `(
        'should parse gRPC time preference $timePreference to $expected',
        ({ timePreference }) => {
          const mockResponse = {
            hasAction: () => true,
            getAction: () => boltzrpc.Node.CLN,
            hasTimePreference: () => true,
            getTimePreference: () => timePreference,
          } as boltzrpc.InvoicePaymentHookResponse;

          expect(hook['parseGrpcAction'](mockResponse)).toEqual({
            timePreference,
            node: NodeType.CLN,
          });
        },
      );

      test.each`
        timePreference
        ${-1.1}
        ${1.1}
        ${2}
        ${-2}
      `(
        'should return undefined if time preference is invalid: $timePreference',
        ({ timePreference }) => {
          const mockResponse = {
            hasAction: () => true,
            getAction: () => boltzrpc.Node.CLN,
            hasTimePreference: () => true,
            getTimePreference: () => timePreference,
            getId: () => 'test',
          } as boltzrpc.InvoicePaymentHookResponse;

          expect(hook['parseGrpcAction'](mockResponse)).toBeUndefined();
        },
      );
    });
  });
});
