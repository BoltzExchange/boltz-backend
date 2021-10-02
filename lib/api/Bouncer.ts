import { Request } from 'express';
import { createHmac } from 'crypto';
import { getUnixTime } from '../Utils';
import Referral from '../db/models/Referral';
import ReferralRepository from '../db/repositories/ReferralRepository';

class Bouncer {
  private static readonly timestampDeltaTolerance = 60

  private static readonly errorUnauthorized = 'unauthorized';

  public static validateRequestAuthentication = async (req: Request): Promise<Referral> => {
    const ts = Bouncer.checkTimestamp(Bouncer.getRequestHeader(req, 'TS'));
    const referral = await Bouncer.fetchApiCredentials(Bouncer.getRequestHeader(req, 'API-KEY'));

    Bouncer.verifyHmac(
      Bouncer.getRequestHeader(req, 'API-HMAC'),
      referral,
      ts,
      req.method,
      req.path,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      req.rawBody,
    );

    return referral;
  };

  private static verifyHmac = (
    providedHmac: string,
    referral: Referral,
    ts: number,
    method: string,
    path: string,
    body: string,
  ) => {
    let hmac = createHmac('sha256', referral.apiSecret)
      .update(`${ts}${method}${path}`);

    if (method === 'POST') {
      hmac = hmac.update(body);
    }

    const hexHmac = hmac.digest('hex');

    if (providedHmac !== hexHmac) {
      throw Bouncer.errorUnauthorized;
    }
  }

  private static checkTimestamp = (providedTsRaw: string) => {
    const providedTs = parseInt(providedTsRaw);

    if (isNaN(providedTs)) {
      throw 'TS header not a number';
    }

    const now = getUnixTime();

    if (providedTs > now + Bouncer.timestampDeltaTolerance || providedTs < now - Bouncer.timestampDeltaTolerance) {
      throw `TS header deviates from server time by more than ${Bouncer.timestampDeltaTolerance} seconds`;
    }

    return providedTs;
  }

  private static fetchApiCredentials = async (apiKey: string) => {
    const referral = await ReferralRepository.getReferralByApiKey(apiKey);

    if (referral === null) {
      throw Bouncer.errorUnauthorized;
    }

    return referral;
  };

  private static getRequestHeader = (req: Request, name: string) => {
    const header = req.get(name);

    if (header === undefined) {
      throw `${name} header not set`;
    }

    return header;
  }
}

export default Bouncer;
