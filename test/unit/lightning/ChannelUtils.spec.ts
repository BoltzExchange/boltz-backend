import {
  msatToSat,
  satToMsat,
  scidClnToLnd,
  scidLndToCln,
} from '../../../lib/lightning/ChannelUtils';

describe('ChannelUtils', () => {
  test.each`
    lnd                  | cln
    ${'136339441909760'} | ${'124x1x0'}
    ${'128642860515328'} | ${'117x1x0'}
  `(
    'should convert LND ($lnd) to CLN ($cln) short channel id',
    ({ cln, lnd }) => {
      expect(scidLndToCln(lnd)).toEqual(cln);
    },
  );

  test.each`
    lnd                  | cln
    ${'136339441909760'} | ${'124x1x0'}
    ${'128642860515328'} | ${'117x1x0'}
  `(
    'should convert CLN ($cln) to LND ($lnd) short channel id',
    ({ cln, lnd }) => {
      expect(scidClnToLnd(cln)).toEqual(lnd);
    },
  );

  test.each`
    msats              | sats
    ${1000}            | ${1}
    ${100_000}         | ${100}
    ${100_000_123}     | ${100_000}
    ${100_000_600}     | ${100_001}
    ${300_000_000_000} | ${300_000_000}
  `('should convert msats ($msats) to sats ($sats)', ({ msats, sats }) => {
    expect(msatToSat(msats)).toEqual(sats);
  });

  test.each`
    msats              | sats
    ${1000}            | ${1}
    ${100_000}         | ${100}
    ${100_000_000}     | ${100_000}
    ${100_001_000}     | ${100_001}
    ${300_000_000_000} | ${300_000_000}
  `('should convert sats ($sats) to msats ($msats)', ({ msats, sats }) => {
    expect(satToMsat(sats)).toEqual(msats);
  });
});
