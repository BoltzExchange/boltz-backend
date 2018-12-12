import { expect } from 'chai';
import os from 'os';
import * as utils from '../../lib/Utils';

describe('Utils', () => {
  it('should split derivation path', () => {
    const master = 'm';
    const sub = [0, 2, 543];
    const derivationPath = `${master}/${sub[0]}/${sub[1]}/${sub[2]}`;

    const result = utils.splitDerivationPath(derivationPath);

    expect(result.master).to.be.equal(master);
    expect(result.sub.length).to.be.equal(sub.length);

    sub.forEach((value, index) => {
      expect(result.sub[index]).to.be.equal(value);
    });
  });

  it('should concat error code', () => {
    const prefix = 0;
    const code = 1;

    expect(utils.concatErrorCode(prefix, code)).to.be.equal(`${prefix}.${code}`);
  });

  it('should capitalize the first letter', () => {
    const input = 'test123';
    const result = input.charAt(0).toUpperCase() + input.slice(1);

    expect(utils.capitalizeFirstLetter(input)).to.be.equal(result);
  });

  it('should resolve home', () => {
    const input = '~.boltz';

    if (os.platform() !== 'win32') {
      expect(utils.resolveHome(input).charAt(0)).to.be.equal('/');
    } else {
      expect(utils.resolveHome(input)).to.be.equal(input);
    }
  });

  it('should get a hex encoded Buffers and strings', () => {
    const string = 'test';

    expect(utils.getHexBuffer(string)).to.be.deep.equal(Buffer.from(string, 'hex'));
    expect(utils.getHexString(Buffer.from(string))).to.be.equal(Buffer.from(string).toString('hex'));
  });

  it('should check whether it is an object', () => {
    expect(utils.isObject({})).to.be.true;
    expect(utils.isObject([])).to.be.false;
  });

  it('should split host and port', () => {
    const host = 'localhost';
    const port = '9000';

    const input = `${host}:${port}`;

    expect(utils.splitListen(input)).to.be.deep.equal({ host, port });
  });

  it('should reverse a string', () => {
    const input = 'test123';

    expect(utils.reverseString(input)).to.be.equal(input.split('').reverse().join(''));
  });
});
