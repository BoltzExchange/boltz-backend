import Logger from '../../../lib/Logger';
import CountryCodes from '../../../lib/service/CountryCodes';

describe('CountryCodes', () => {
  const cc = new CountryCodes(Logger.disabledLogger, {
    countries: ['SV', 'AT'],
    ipV4Ranges:
      'https://cdn.jsdelivr.net/npm/@ip-location-db/asn-country/asn-country-ipv4-num.csv',
    ipV6Ranges:
      'https://cdn.jsdelivr.net/npm/@ip-location-db/asn-country/asn-country-ipv6-num.csv',
  });

  test('should download IP ranges', async () => {
    expect(cc['ranges'].length).toEqual(0);
    await cc.downloadRanges();

    expect(cc['ranges'].length).toBeGreaterThan(1);

    const range = cc['ranges'][0];
    expect(range.country).not.toBeUndefined();
    expect(typeof range.country).toEqual('string');
    expect(typeof range.start).toEqual('bigint');
    expect(typeof range.end).toEqual('bigint');
  });

  test.each`
    ip                                           | country
    ${'45.5.12.0'}                               | ${'SV'}
    ${'45.5.12.1'}                               | ${'SV'}
    ${'2801:1e:e000:ffff:ffff:ffff:ffff:fffe'}   | ${'SV'}
    ${'2c0f:fff0:ffff:ffff:ffff:ffff:ffff:ffff'} | ${'NG'}
    ${'not an IP address'}                       | ${undefined}
  `('should get country code for IP $ip', ({ ip, country }) => {
    expect(cc.getCountryCode(ip)).toEqual(country);
  });

  test.each`
    country      | relevant
    ${'SV'}      | ${true}
    ${'AT'}      | ${true}
    ${'DE'}      | ${false}
    ${undefined} | ${false}
  `('should get if $country is relevant', ({ country, relevant }) => {
    expect(cc.isRelevantCountry(country)).toEqual(relevant);
  });
});
