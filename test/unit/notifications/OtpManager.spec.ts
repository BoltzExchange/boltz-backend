import { join } from 'path';
import { authenticator } from 'otplib';
import { unlinkSync, existsSync, readFileSync } from 'fs';
import Logger from '../../../lib/Logger';
import { NotificationConfig } from '../../../lib/Config';
import OtpManager from '../../../lib/notifications/OtpManager';

const config: NotificationConfig = {
  prefix: 'prefix',
  otpsecretpath: `${__dirname}/otpSecret.dat`,

  token: '',
  channel: '',
  interval: 0,
};

const uriFilePath = join(__dirname, OtpManager['uriFile']);

const clearFiles = () => {
  if (existsSync(uriFilePath)) {
    unlinkSync(uriFilePath);
  }

  if (existsSync(config.otpsecretpath)) {
    unlinkSync(config.otpsecretpath);
  }
};

describe('OtpManager', () => {
  let secret: string;

  let otpManager: OtpManager;

  beforeAll(() => {
    clearFiles();
  });

  test('should create OTP secrets', () => {
    otpManager = new OtpManager(Logger.disabledLogger, config);
    secret = otpManager['secret'];

    expect(existsSync(config.otpsecretpath)).toBeTruthy();
    expect(existsSync(uriFilePath)).toBeTruthy();

    expect(readFileSync(config.otpsecretpath, { encoding: 'utf8' })).toEqual(secret);

    const uriFile = readFileSync(uriFilePath, { encoding: 'utf8' });
    expect(uriFile.includes(secret)).toBeTruthy();
  });

  test('should load OTP secrets from file', () => {
    otpManager = new OtpManager(Logger.disabledLogger, config);

    expect(otpManager['secret']).toBeTruthy();
  });

  test('should verify OTP tokens', () => {
    const token = authenticator.generate(secret);
    expect(otpManager.verify(token)).toBeTruthy();
  });

  test('should not accept the same OTP token twice', () => {
    const token = authenticator.generate(secret);
    expect(otpManager.verify(token)).toBeFalsy();
  });

  test('should not throw when checking invalid tokens', () => {
    expect(otpManager.verify('invalid')).toBeFalsy();
  });

  afterAll(() => {
    clearFiles();
  });
});
