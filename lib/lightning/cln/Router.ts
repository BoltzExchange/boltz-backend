import { getHexBuffer, toProtoInt } from '../../Utils';
import type { NodeClient } from '../../proto/cln/node';
import * as noderpc from '../../proto/cln/node';
import { satToMsat } from '../ChannelUtils';
import Errors from '../Errors';
import type { Route } from '../LightningClient';

export const getRoute = async (
  nodeCaller: <T, U>(methodName: keyof NodeClient, params: T) => Promise<U>,
  destination: string,
  amount: number,
  cltvLimit: number = Number.MAX_SAFE_INTEGER,
  finalCltv: number = 9,
  riskFactor: number = 0,
  maxRetries: number = 10,
): Promise<Route> => {
  const excludes: string[] = [];
  const req: noderpc.GetrouteRequest = {
    ...noderpc.GetrouteRequest.create(),
    id: getHexBuffer(destination),
    amountMsat: {
      msat: toProtoInt(satToMsat(amount)),
    },
    cltv: finalCltv,
    riskfactor: toProtoInt(riskFactor),
    exclude: excludes,
  };

  for (let i = 0; i < maxRetries; i++) {
    const res = await nodeCaller<
      noderpc.GetrouteRequest,
      noderpc.GetrouteResponse
    >('getRoute', req);

    if (res.route.length === 0) {
      throw Errors.NO_ROUTE();
    }

    if (res.route[0].delay > cltvLimit) {
      const highestDelta = findHighestDeltaHop(res.route);
      excludes.push(`${highestDelta.channel}/${highestDelta.direction}`);
      continue;
    }

    return {
      ctlv: res.route[0].delay,
      feesMsat: Number(
        BigInt(res.route[0].amountMsat!.msat) - BigInt(satToMsat(amount)),
      ),
    };
  }

  throw Errors.NO_ROUTE();
};

const findHighestDeltaHop = (route: noderpc.GetrouteRoute[]) => {
  if (route.length < 2) {
    return route[0];
  }

  let highestDeltaHop = route[0];
  let maxDelta = route[0].delay - route[1].delay;

  for (let i = 1; i < route.length - 1; i++) {
    const delta = route[i].delay - route[i + 1].delay;

    if (delta > maxDelta) {
      maxDelta = delta;
      highestDeltaHop = route[i];
    }
  }

  return highestDeltaHop;
};
