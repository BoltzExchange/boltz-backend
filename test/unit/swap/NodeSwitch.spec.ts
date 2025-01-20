import { randomBytes } from 'crypto';
import Logger from '../../../lib/Logger';
import { getHexString } from '../../../lib/Utils';
import LightningPayment from '../../../lib/db/models/LightningPayment';
import ReverseSwap, { NodeType } from '../../../lib/db/models/ReverseSwap';
import Swap from '../../../lib/db/models/Swap';
import LightningPaymentRepository from '../../../lib/db/repositories/LightningPaymentRepository';
import { satToMsat } from '../../../lib/lightning/ChannelUtils';
import { LightningClient } from '../../../lib/lightning/LightningClient';
import LndClient from '../../../lib/lightning/LndClient';
import ClnClient from '../../../lib/lightning/cln/ClnClient';
import DecodedInvoice, {
  InvoiceType,
} from '../../../lib/sidecar/DecodedInvoice';
import Errors from '../../../lib/swap/Errors';
import NodeSwitch from '../../../lib/swap/NodeSwitch';
import { Currency } from '../../../lib/wallet/WalletManager';

describe('NodeSwitch', () => {
  const createNode = (
    service: string,
    type: NodeType,
    connected: boolean = true,
  ): LightningClient =>
    ({
      type,
      serviceName: () => service,
      isConnected: () => connected,
    }) as LightningClient;

  const clnClient = createNode(
    ClnClient.serviceName,
    NodeType.CLN,
  ) as LndClient;
  const lndClient = createNode(
    LndClient.serviceName,
    NodeType.LND,
  ) as ClnClient;

  let currency = {
    clnClient,
    lndClient,
  } as unknown as Currency;

  beforeEach(() => {
    currency = {
      clnClient,
      lndClient,
    } as unknown as Currency;
  });

  test.each`
    config
    ${undefined}
    ${{}}
  `('should handle empty config', ({ config }) => {
    const ns = new NodeSwitch(Logger.disabledLogger, config);
    expect(ns['clnAmountThreshold']).toEqual(
      NodeSwitch['defaultClnAmountThreshold'],
    );
    expect(ns['referralIds'].size).toEqual(0);
  });

  test('should parse config', () => {
    const config = {
      clnAmountThreshold: 21,
      swapNode: 'LND',
      referralsIds: {
        test: 'CLN',
        breez: 'LND',
        other: 'notFound',
      },
    };
    const ns = new NodeSwitch(Logger.disabledLogger, config);

    expect(ns['clnAmountThreshold']).toEqual(config.clnAmountThreshold);
    expect(ns['swapNode']).toEqual(NodeType.LND);

    const referrals = ns['referralIds'];
    expect(referrals.size).toEqual(2);
    expect(referrals.get('test')).toEqual(NodeType.CLN);
    expect(referrals.get('breez')).toEqual(NodeType.LND);
  });

  test.each`
    amount       | referral     | client       | currency
    ${1}         | ${undefined} | ${clnClient} | ${currency}
    ${21}        | ${undefined} | ${clnClient} | ${currency}
    ${1_000}     | ${undefined} | ${clnClient} | ${currency}
    ${1_000_000} | ${undefined} | ${clnClient} | ${currency}
    ${1_000_001} | ${undefined} | ${lndClient} | ${currency}
    ${2_000_000} | ${undefined} | ${lndClient} | ${currency}
    ${1}         | ${'breez'}   | ${lndClient} | ${currency}
    ${1_000}     | ${'breez'}   | ${lndClient} | ${currency}
    ${1_000_000} | ${'breez'}   | ${lndClient} | ${currency}
    ${2_000_000} | ${'breez'}   | ${lndClient} | ${currency}
    ${2_000_000} | ${'breez'}   | ${clnClient} | ${{ clnClient }}
    ${1}         | ${undefined} | ${lndClient} | ${{ lndClient }}
    ${2_000_000} | ${undefined} | ${clnClient} | ${{ clnClient }}
  `(
    'should get node for Swap of amount $amount and referral id $referral',
    async ({ amount, client, currency, referral }) => {
      await expect(
        new NodeSwitch(Logger.disabledLogger, {
          referralsIds: { breez: 'LND' },
        }).getSwapNode(
          currency,
          {
            type: InvoiceType.Bolt11,
            amountMsat: satToMsat(amount),
          } as DecodedInvoice,
          {
            referral,
          } as Swap,
        ),
      ).resolves.toEqual(client);
    },
  );

  test.each`
    type                         | client
    ${InvoiceType.Bolt11}        | ${lndClient}
    ${InvoiceType.Bolt12Invoice} | ${clnClient}
  `(
    'should get node for Swap with invoice type $type',
    async ({ type, client }) => {
      await expect(
        new NodeSwitch(Logger.disabledLogger, {}).getSwapNode(
          currency,
          { type, amountMsat: satToMsat(1_000_001) } as DecodedInvoice,
          {},
        ),
      ).resolves.toEqual(client);
    },
  );

  test.each`
    swapNode | currency         | expected
    ${'LND'} | ${currency}      | ${lndClient}
    ${'CLN'} | ${currency}      | ${clnClient}
    ${'LND'} | ${{ clnClient }} | ${clnClient}
  `(
    'should get node for Swap with swapNode $swapNode configured',
    async ({ swapNode, currency, expected }) => {
      await expect(
        new NodeSwitch(Logger.disabledLogger, {
          swapNode,
        }).getSwapNode(
          currency,
          { type: InvoiceType.Bolt11 } as DecodedInvoice,
          {} as Swap,
        ),
      ).resolves.toEqual(expected);
    },
  );

  describe('xpay handling', () => {
    afterAll(() => {
      LightningPaymentRepository.findByPreimageHashAndNode = jest
        .fn()
        .mockResolvedValue(null);
    });

    test.each`
      retries                            | expected
      ${null}                            | ${clnClient}
      ${undefined}                       | ${clnClient}
      ${0}                               | ${clnClient}
      ${NodeSwitch['maxClnRetries'] - 1} | ${clnClient}
      ${NodeSwitch['maxClnRetries']}     | ${lndClient}
      ${NodeSwitch['maxClnRetries'] + 1} | ${lndClient}
      ${1}                               | ${lndClient}
      ${2}                               | ${lndClient}
      ${3}                               | ${lndClient}
    `(
      'should fallback to LND when xpay max retries are reached',
      async ({ retries, expected }) => {
        const decoded = {
          type: InvoiceType.Bolt11,
          paymentHash: randomBytes(32),
          amountMsat: satToMsat(21_000),
        } as DecodedInvoice;

        LightningPaymentRepository.findByPreimageHashAndNode = jest
          .fn()
          .mockResolvedValue({ retries } as LightningPayment);

        await expect(
          new NodeSwitch(Logger.disabledLogger, {}).getSwapNode(
            currency,
            decoded,
            {},
          ),
        ).resolves.toEqual(expected);

        expect(
          LightningPaymentRepository.findByPreimageHashAndNode,
        ).toHaveBeenCalledTimes(1);
        expect(
          LightningPaymentRepository.findByPreimageHashAndNode,
        ).toHaveBeenCalledWith(
          getHexString(decoded.paymentHash!),
          NodeType.CLN,
        );
      },
    );
  });

  test.each`
    type            | node
    ${NodeType.LND} | ${lndClient}
    ${NodeType.CLN} | ${clnClient}
    ${21}           | ${clnClient}
  `('should get node for NodeType $type', ({ type, node }) => {
    expect(
      NodeSwitch.getReverseSwapNode(currency, {
        node: type,
      } as ReverseSwap),
    ).toEqual(node);
  });

  test.each`
    amount       | referral     | client       | type            | currency
    ${1}         | ${undefined} | ${clnClient} | ${NodeType.CLN} | ${currency}
    ${21}        | ${undefined} | ${clnClient} | ${NodeType.CLN} | ${currency}
    ${1_000}     | ${undefined} | ${clnClient} | ${NodeType.CLN} | ${currency}
    ${1_000_000} | ${undefined} | ${clnClient} | ${NodeType.CLN} | ${currency}
    ${1_000_001} | ${undefined} | ${lndClient} | ${NodeType.LND} | ${currency}
    ${2_000_000} | ${undefined} | ${lndClient} | ${NodeType.LND} | ${currency}
    ${1}         | ${'breez'}   | ${lndClient} | ${NodeType.LND} | ${currency}
    ${2_000_000} | ${'breez'}   | ${lndClient} | ${NodeType.LND} | ${currency}
    ${2_000_000} | ${'breez'}   | ${clnClient} | ${NodeType.CLN} | ${{ clnClient }}
    ${1}         | ${undefined} | ${lndClient} | ${NodeType.LND} | ${{ lndClient }}
    ${2_000_000} | ${undefined} | ${clnClient} | ${NodeType.CLN} | ${{ clnClient }}
  `(
    'should get node for Reverse Swap for amount $amount and referral $referral',
    ({ amount, referral, client, type, currency }) => {
      expect(
        new NodeSwitch(Logger.disabledLogger, {
          referralsIds: { breez: 'LND' },
        }).getNodeForReverseSwap('', currency, amount, referral),
      ).toEqual({ nodeType: type, lightningClient: client });
    },
  );

  test.each`
    has      | currency
    ${true}  | ${currency}
    ${true}  | ${{ lndClient }}
    ${true}  | ${{ clnClient }}
    ${false} | ${{}}
  `('should check if currency has clients', ({ has, currency }) => {
    expect(NodeSwitch.hasClient(currency)).toEqual(has);
  });

  test.each`
    currency                                                                       | client       | expected
    ${{ lndClient: lndClient, clnClient: clnClient }}                              | ${lndClient} | ${lndClient}
    ${{ lndClient: lndClient, clnClient: clnClient }}                              | ${clnClient} | ${clnClient}
    ${{ lndClient: lndClient, clnClient: clnClient }}                              | ${undefined} | ${lndClient}
    ${{ clnClient: clnClient }}                                                    | ${lndClient} | ${lndClient}
    ${{ clnClient: clnClient }}                                                    | ${undefined} | ${clnClient}
    ${{ lndClient: createNode('LND', NodeType.LND, false), clnClient: clnClient }} | ${undefined} | ${clnClient}
    ${{}}                                                                          | ${lndClient} | ${lndClient}
  `(
    'should fallback based on client availability',
    ({ currency, client, expected }) => {
      expect(NodeSwitch.fallback(currency, client)).toEqual(expected);
    },
  );

  test('should throw when no clients are available', () => {
    expect(() => NodeSwitch.fallback({} as Currency)).toThrow(
      Errors.NO_AVAILABLE_LIGHTNING_CLIENT().message,
    );
    expect(() =>
      NodeSwitch.fallback({
        lndClient: createNode('LND', NodeType.LND, false),
      } as Currency),
    ).toThrow(Errors.NO_AVAILABLE_LIGHTNING_CLIENT().message);
    expect(() =>
      NodeSwitch.fallback({
        lndClient: createNode('LND', NodeType.LND, false),
        clnClient: createNode('CLN', NodeType.CLN, false),
      } as Currency),
    ).toThrow(Errors.NO_AVAILABLE_LIGHTNING_CLIENT().message);
  });
});
