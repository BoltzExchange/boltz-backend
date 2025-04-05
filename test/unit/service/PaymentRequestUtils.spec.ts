import { networks } from 'liquidjs-lib';
import type { ParsedUrlQuery } from 'querystring';
import { decode } from 'querystring';
import { satoshisToCoins } from '../../../lib/DenominationConverter';
import PaymentRequestUtils from '../../../lib/service/PaymentRequestUtils';

// https://github.com/tdex-network/tdex-app/blob/44ed63b15cd86e5fab7906f8e65c12e0e24f3101/src/utils/bip21.ts#L4
const decodeBip21 = (
  uri: string,
  urnScheme?: string,
): { address: string; options: ParsedUrlQuery } => {
  urnScheme = urnScheme || 'bitcoin';
  let amount: number;
  const urnSchemeActual = uri.slice(0, urnScheme.length).toLowerCase();
  if (urnSchemeActual !== urnScheme || uri.charAt(urnScheme.length) !== ':') {
    throw new Error('Invalid BIP21 URI: ' + uri);
  }

  const split = uri.indexOf('?');
  const address = uri.slice(
    urnScheme.length + 1,
    split === -1 ? undefined : split,
  );

  const query = split === -1 ? '' : uri.slice(split + 1);
  const options = decode(query);
  if (options.amount) {
    amount = Number(options.amount);
    if (!isFinite(amount)) throw new Error('Invalid amount');
    if (amount < 0) throw new Error('Invalid amount');
  }

  return { address: address, options: options };
};

describe('PaymentRequestUtils', () => {
  const pru = new PaymentRequestUtils({
    network: networks.liquid,
  } as any);

  test('should encode BTC BIP21', () => {
    const symbol = 'BTC';
    const address = 'bcrt1qxmhp6s7j2n6ffkymnkrtxnxyf40l37h2g3pwlk';
    const satoshis = 1123123;
    const label = 'Some payment info';

    expect(pru.encodeBip21(symbol, address, satoshis)).toEqual(
      `bitcoin:${address}?amount=${satoshis / 100_000_000}`,
    );
    expect(pru.encodeBip21(symbol, address, satoshis, label)).toEqual(
      `bitcoin:${address}?amount=${satoshisToCoins(
        satoshis,
      )}&label=${label.replace(/ /g, '%20')}`,
    );
  });

  test('should not encode BIP-21 with scientific notation', () => {
    const address = 'bcrt1qxmhp6s7j2n6ffkymnkrtxnxyf40l37h2g3pwlk';
    expect(pru.encodeBip21('BTC', address, 42)).toEqual(
      `bitcoin:${address}?amount=0.00000042`,
    );
  });

  test.each`
    satoshis
    ${undefined}
    ${0}
  `(
    'should skip encoding amount when satoshis is $satoshis',
    ({ satoshis }) => {
      const symbol = 'BTC';
      const address = 'bcrt1qxmhp6s7j2n6ffkymnkrtxnxyf40l37h2g3pwlk';
      const label = 'no_amount';

      expect(pru.encodeBip21(symbol, address, satoshis, label)).toEqual(
        `bitcoin:${address}?label=${label}`,
      );
    },
  );

  test('should encode LTC BIP21', () => {
    const symbol = 'LTC';
    const address =
      'ltc1ppdaqq7q0nagcd6v02n7zslck5dg8ugzmx445as9ytr0prc42zq3qa3e64v';
    const satoshis = 5678978945;
    const label = '&asdfa§%&asdf';

    expect(pru.encodeBip21(symbol, address, satoshis, label)).toEqual(
      `litecoin:${address}?amount=${satoshisToCoins(
        satoshis,
      )}&label=${encodeURIComponent(label)}`,
    );
  });

  test('should encode L-BTC BIP21', () => {
    const symbol = 'L-BTC';
    const address =
      'ert1qmlpr7ujjcjmm95gg7hrmhcetty59yck9rxrg3qm3dsl0juhrhpvqy7m2jq';
    const satoshi = 34522334;
    const label = 'Swap from Lightning';

    expect(pru.encodeBip21(symbol, address, satoshi, label)).toEqual(
      `liquidnetwork:${address}?amount=${satoshisToCoins(
        satoshi,
      )}&label=${encodeURIComponent(label)}&assetid=${
        networks.liquid.assetHash
      }`,
    );

    expect(
      decodeBip21(
        pru.encodeBip21(symbol, address, satoshi, label)!,
        'liquidnetwork',
      ),
    ).toEqual({
      address,
      options: {
        label,
        amount: `${satoshisToCoins(satoshi)}`,
        assetid: networks.liquid.assetHash,
      },
    });
  });

  test('should encode testnet L-BTC BIP21', () => {
    const symbol = 'L-BTC';
    const address =
      'ert1qmlpr7ujjcjmm95gg7hrmhcetty59yck9rxrg3qm3dsl0juhrhpvqy7m2jq';
    const satoshi = 34522334;
    const label = 'Swap from Lightning';

    const pruTestnet = new PaymentRequestUtils({
      network: networks.testnet,
    } as any);

    expect(
      decodeBip21(
        pruTestnet.encodeBip21(symbol, address, satoshi, label)!,
        'liquidtestnet',
      ),
    ).toEqual({
      address,
      options: {
        label,
        amount: `${satoshisToCoins(satoshi)}`,
        assetid: networks.testnet.assetHash,
      },
    });
  });

  test('should not encode L-BTC BIP21 when asset hash is missing', () => {
    const symbol = 'L-BTC';
    const address =
      'ert1qmlpr7ujjcjmm95gg7hrmhcetty59yck9rxrg3qm3dsl0juhrhpvqy7m2jq';
    const satoshi = 34522334;
    const label = 'Swap from Lightning';

    expect(
      new PaymentRequestUtils().encodeBip21(symbol, address, satoshi, label),
    ).toBeUndefined();
  });
});
