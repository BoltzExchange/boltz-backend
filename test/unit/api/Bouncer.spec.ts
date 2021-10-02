import { createHmac } from 'crypto';
import Bouncer from '../../../lib/api/Bouncer';
import { getUnixTime } from '../../../lib/Utils';
import ReferralRepository from '../../../lib/db/repositories/ReferralRepository';

let mockGetReferralByApiKeyResult: any = null;
const mockGetReferralByApiKey = jest.fn().mockImplementation(() => {
  return mockGetReferralByApiKeyResult;
});

ReferralRepository.getReferralByApiKey = mockGetReferralByApiKey;

describe('Bouncer', () => {
  test('should validate request authentication', async () => {
    const time = getUnixTime();

    let providedHmac = 'HMAC';
    const mockReqGet = jest.fn().mockImplementation((name) => {
      switch (name) {
        case 'TS':
          return time;

        case 'API-KEY':
          return 'KEY';

        case 'API-HMAC':
          return providedHmac;

        default:
          return undefined;
      }
    });

    const req = {
      method: 'POST',
      path: '/some/path',
      rawBody: 'raw body',

      get: mockReqGet,
    } as any;

    mockGetReferralByApiKeyResult = {
      apiSecret: 'secret',
    };

    await expect(Bouncer.validateRequestAuthentication(req)).rejects.toEqual('unauthorized');

    providedHmac = createHmac('sha256', mockGetReferralByApiKeyResult.apiSecret)
      .update(`${time}${req.method}${req.path}${req.rawBody}`)
      .digest('hex');

    expect(await Bouncer.validateRequestAuthentication(req)).toEqual(mockGetReferralByApiKeyResult);

    mockGetReferralByApiKeyResult = null;
  });

  test('should verify HMACs', () => {
    const referral = {
      apiSecret: '1a84c246e9f7c0ecf9af6a80a6e58fd86af5a279f6dd1fbd4917ea30c8b54564',
    } as any;

    const ts = 123;
    const path = '/test/path';
    const body = 'some raw data';

    const verifyHmac = Bouncer['verifyHmac'];

    // GET request
    expect(() => verifyHmac(
      '',
      referral,
      ts,
      'GET',
      path,
      body,
    )).toThrow(Bouncer['errorUnauthorized']);

    const getHmac = 'd1ed72c152c32a237e7fd62b507b1e35296056fff3b4e04ee435bca31349a610';

    expect(() => verifyHmac(
      getHmac,
      referral,
      ts,
      'GET',
      path,
      body,
    )).not.toThrow();

    expect(() => verifyHmac(
      getHmac,
      referral,
      ts,
      'GET',
      path,
      'some other body that should be ignored',
    )).not.toThrow();

    // POST request
    expect(() => verifyHmac(
      '',
      referral,
      ts,
      'POST',
      path,
      body,
    )).toThrow(Bouncer['errorUnauthorized']);

    const postHmac = '85a75cd8d54df62a9a264b1750f92057eea939544138e3937c7586264643e931';

    expect(() => verifyHmac(
      postHmac,
      referral,
      ts,
      'POST',
      path,
      body,
    )).not.toThrow();

    expect(() => verifyHmac(
      postHmac,
      referral,
      ts,
      'POST',
      path,
      'some other body that should throw',
    )).toThrow(Bouncer['errorUnauthorized']);
  });

  test('should check timestamps', () => {
    const checkTimestamp = Bouncer['checkTimestamp'];

    // Sanity checks

    expect(() => checkTimestamp('asdf')).toThrow('TS header not a number');

    // Time deviation checks

    const now = getUnixTime();
    const timestampDelta = Bouncer['timestampDeltaTolerance'] * 2;

    expect(() => checkTimestamp(
      (now + timestampDelta).toString()),
    ).toThrow('TS header deviates from server time by more than 60 seconds');

    expect(() => checkTimestamp(
      (now - timestampDelta).toString()),
    ).toThrow('TS header deviates from server time by more than 60 seconds');

    // Should not throw
    expect(checkTimestamp(now.toString())).toEqual(now);
  });

  test('should fetch API credentials', async () => {
    const fetchApiCredentials = Bouncer['fetchApiCredentials'];

    mockGetReferralByApiKeyResult = null;
    await expect(fetchApiCredentials('asdf')).rejects.toEqual('unauthorized');

    mockGetReferralByApiKeyResult = 'someResult';
    expect(await fetchApiCredentials('apiKey')).toEqual(mockGetReferralByApiKeyResult);
  });

  test('should get request headers', () => {
    const mockReqGet = jest.fn().mockImplementation((name) => {
      switch (name) {
        case 'defined':
          return 'defined';

        default:
          return undefined;
      }
    });

    const req = {
      get: mockReqGet,
    } as any;

    const getRequestHeader = Bouncer['getRequestHeader'];

    expect(() => getRequestHeader(req, 'undefined')).toThrow('undefined header not set');
    expect(getRequestHeader(req, 'defined')).toEqual('defined');
  });
});
