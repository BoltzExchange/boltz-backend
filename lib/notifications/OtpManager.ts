import { dirname, join } from 'path';
import { authenticator } from 'otplib';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import Logger from '../Logger';
import { NotificationConfig } from '../Config';

class OtpManager {
  private secret: string;

  // This variable keeps track of the last used token to prevent that the same token can be used multiple times
  private lastUsedToken = '';

  private static service = 'Boltz';
  private static uriFile = 'otpUri.txt';

  constructor(private logger: Logger, config: NotificationConfig) {
    if (existsSync(config.otpsecretpath)) {
      this.secret = readFileSync(config.otpsecretpath, { encoding: 'utf8' });

      this.logger.info('Loaded existing OTP secret');
    } else {
      this.secret = authenticator.generateSecret();
      writeFileSync(config.otpsecretpath, this.secret);

      this.logger.warn('Generated new OTP secret');

      this.generateUri(config.prefix, config.otpsecretpath);
    }
  }

  public verify = (token: string) => {
    try {
      if (token !== this.lastUsedToken) {
        const valid = authenticator.check(token, this.secret);

        if (valid) {
          this.lastUsedToken = token;
        }

        return valid;
      }
    } catch (error) {
      this.logger.debug(`Could not check OTP token ${token}: ${error}`);
    }

    return false;
  }

  private generateUri = (prefix: string, secretPath: string) => {
    const uri = authenticator.keyuri(
      encodeURIComponent(prefix),
      encodeURIComponent(OtpManager.service),
      this.secret,
    );

    const path = join(dirname(secretPath), OtpManager.uriFile);

    writeFileSync(path, uri);
  }
}

export default OtpManager;
