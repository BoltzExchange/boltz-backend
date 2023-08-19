import Logger from '../../../lib/Logger';
import Swap from '../../../lib/db/models/Swap';
import NodeSwitch from '../../../lib/swap/NodeSwitch';
import LndClient from '../../../lib/lightning/LndClient';
import ClnClient from '../../../lib/lightning/ClnClient';
import { Currency } from '../../../lib/wallet/WalletManager';
import ReverseSwap, { NodeType } from '../../../lib/db/models/ReverseSwap';

describe('NodeSwitch', () => {
  const clnClient = { serviceName: () => ClnClient.serviceName };
  const lndClient = { serviceName: () => LndClient.serviceName };

  const currency = {
    clnClient,
    lndClient,
  } as Currency;

  test.each`
    amount       | client       | currency
    ${1}         | ${clnClient} | ${currency}
    ${21}        | ${clnClient} | ${currency}
    ${1_000}     | ${clnClient} | ${currency}
    ${1_000_000} | ${clnClient} | ${currency}
    ${1_000_001} | ${lndClient} | ${currency}
    ${2_000_000} | ${lndClient} | ${currency}
    ${1}         | ${lndClient} | ${{ lndClient }}
    ${2_000_000} | ${clnClient} | ${{ clnClient }}
  `(
    'should get node for Swap of amount $amount',
    ({ amount, client, currency }) => {
      expect(
        NodeSwitch.getSwapNode(Logger.disabledLogger, currency, {
          invoiceAmount: amount,
        } as Swap),
      ).toEqual(client);
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
    amount       | client       | type            | currency
    ${1}         | ${clnClient} | ${NodeType.CLN} | ${currency}
    ${21}        | ${clnClient} | ${NodeType.CLN} | ${currency}
    ${1_000}     | ${clnClient} | ${NodeType.CLN} | ${currency}
    ${1_000_000} | ${clnClient} | ${NodeType.CLN} | ${currency}
    ${1_000_001} | ${lndClient} | ${NodeType.LND} | ${currency}
    ${2_000_000} | ${lndClient} | ${NodeType.LND} | ${currency}
    ${1}         | ${lndClient} | ${NodeType.LND} | ${{ lndClient }}
    ${2_000_000} | ${clnClient} | ${NodeType.CLN} | ${{ clnClient }}
  `(
    'should get node for Reverse Swap of amount $amount',
    ({ amount, client, type, currency }) => {
      expect(
        NodeSwitch.getNodeForReverseSwap(
          Logger.disabledLogger,
          '',
          currency,
          amount,
        ),
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
});
