import { expect } from 'chai';
import { getHexString, getHexBuffer } from '../../../lib/Utils';
import * as scripts from '../../../lib/swap/Scripts';

describe('Scripts', () => {
  const redeemScript = '00';

  it('should get P2WPKH output script', () => {
    const testData = {
      args: {
        hash: publicKeyHash,
      },
      result: '00140000000000000000000000000000000000000000',
    };

    const result = scripts.p2wpkhOutput(getHexBuffer(testData.args.hash));
    expect(getHexString(result)).to.be.equal(testData.result);
  });

  it('should get P2WSH output script', () => {
    const testData = {
      args: {
        scriptHex: redeemScript,
      },
      result: '00206e340b9cffb37a989ca544e6bb780a2c78901d3fb33738768511a30617afa01d',
    };

    const result = scripts.p2wshOutput(getHexBuffer(testData.args.scriptHex));
    expect(getHexString(result)).to.be.equal(testData.result);
  });

  it('should get P2PKH output script', () => {
    const testData = {
      args: {
        hash: publicKeyHash,
      },
      result: '76a914000000000000000000000000000000000000000088ac',
    };

    const result = scripts.p2pkhOutput(getHexBuffer(testData.args.hash));
    expect(getHexString(result)).to.be.equal(testData.result);
  });

  it('should get P2SH output script', () => {
    const testData = {
      args: {
        scriptHex: redeemScript,
      },
      result: 'a9149f7fd096d37ed2c0e3f7f0cfc924beef4ffceb6887',
    };

    const result = scripts.p2shOutput(getHexBuffer(testData.args.scriptHex));
    expect(getHexString(result)).to.be.equal(testData.result);
  });

  it('should get P2SH nested P2WSH output script', () => {
    const testData =  {
      args: {
        scriptHex: redeemScript,
      },
      result: 'a91466a823e1ae9236a70fe7321f5b26b09ec422a37787',
    };

    const result = scripts.p2shP2wshOutput(getHexBuffer(testData.args.scriptHex));
    expect(getHexString(result)).to.be.equal(testData.result);
  });
});

export const publicKeyHash = '0000000000000000000000000000000000000000';
