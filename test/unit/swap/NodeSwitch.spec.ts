import Logger from '../../../lib/Logger';
import ReverseSwap, { NodeType } from '../../../lib/db/models/ReverseSwap';
import Swap from '../../../lib/db/models/Swap';
import { LightningClient } from '../../../lib/lightning/LightningClient';
import LndClient from '../../../lib/lightning/LndClient';
import ClnClient from '../../../lib/lightning/cln/ClnClient';
import { InvoiceType } from '../../../lib/sidecar/DecodedInvoice';
import Errors from '../../../lib/swap/Errors';
import NodeSwitch from '../../../lib/swap/NodeSwitch';
import { Currency } from '../../../lib/wallet/WalletManager';

describe('NodeSwitch', () => {
  const createNode = (
    service: string,
    connected: boolean = true,
  ): LightningClient =>
    ({
      serviceName: () => service,
      isConnected: () => connected,
    }) as LightningClient;

  const clnClient = createNode(ClnClient.serviceName) as LndClient;
  const lndClient = createNode(LndClient.serviceName) as ClnClient;

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
    ({ amount, client, currency, referral }) => {
      expect(
        new NodeSwitch(Logger.disabledLogger, {
          referralsIds: { breez: 'LND' },
        }).getSwapNode(currency, InvoiceType.Bolt11, {
          referral,
          invoiceAmount: amount,
        } as Swap),
      ).toEqual(client);
    },
  );

  test.each`
    type                         | client
    ${InvoiceType.Bolt11}        | ${lndClient}
    ${InvoiceType.Bolt12Invoice} | ${clnClient}
  `('should get node for Swap with invoice type $type', ({ type, client }) => {
    expect(
      new NodeSwitch(Logger.disabledLogger, {}).getSwapNode(currency, type, {
        invoiceAmount: 1_000_001,
      }),
    ).toEqual(client);
  });

  test.each`
    swapNode | currency         | expected
    ${'LND'} | ${currency}      | ${lndClient}
    ${'CLN'} | ${currency}      | ${clnClient}
    ${'LND'} | ${{ clnClient }} | ${clnClient}
  `(
    'should get node for Swap with swapNode $swapNode configured',
    ({ swapNode, currency, expected }) => {
      expect(
        new NodeSwitch(Logger.disabledLogger, {
          swapNode,
        }).getSwapNode(currency, InvoiceType.Bolt11, {} as Swap),
      ).toEqual(expected);
    },
  );

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
    currency                                                         | client       | expected
    ${{ lndClient: lndClient, clnClient: clnClient }}                | ${lndClient} | ${lndClient}
    ${{ lndClient: lndClient, clnClient: clnClient }}                | ${clnClient} | ${clnClient}
    ${{ lndClient: lndClient, clnClient: clnClient }}                | ${undefined} | ${lndClient}
    ${{ clnClient: clnClient }}                                      | ${lndClient} | ${lndClient}
    ${{ clnClient: clnClient }}                                      | ${undefined} | ${clnClient}
    ${{ lndClient: createNode('LND', false), clnClient: clnClient }} | ${undefined} | ${clnClient}
    ${{}}                                                            | ${lndClient} | ${lndClient}
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
      NodeSwitch.fallback({ lndClient: createNode('LND', false) } as Currency),
    ).toThrow(Errors.NO_AVAILABLE_LIGHTNING_CLIENT().message);
    expect(() =>
      NodeSwitch.fallback({
        lndClient: createNode('LND', false),
        clnClient: createNode('CLN', false),
      } as Currency),
    ).toThrow(Errors.NO_AVAILABLE_LIGHTNING_CLIENT().message);
  });
});
