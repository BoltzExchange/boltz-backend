import { getHexBuffer, toProtoInt } from '../../Utils';
import type { NodeClient } from '../../proto/cln/node';
import * as noderpc from '../../proto/cln/node';
import { satToMsat } from '../ChannelUtils';
import Errors from '../Errors';
import type { Route } from '../LightningClient';

// CLN does not allow a route delay of more than 2016 blocks
const maxRouteDelay = 2016;

export const getRoute = async (
  nodeCaller: <T, U>(methodName: keyof NodeClient, params: T) => Promise<U>,
  source: string,
  destination: string,
  amount: number,
  cltvLimit?: number,
  finalCltv: number = 9,
): Promise<Route> => {
  const amountMsat = satToMsat(amount);

  const req: noderpc.GetroutesRequest = {
    ...noderpc.GetroutesRequest.create(),
    source: getHexBuffer(source),
    destination: getHexBuffer(destination),
    amountMsat: {
      msat: toProtoInt(amountMsat),
    },
    // "getroutes" replaces the deprecated "getroute"; these layers together
    // with "maxparts: 1" are CLN's documented single path equivalent
    layers: ['auto.localchans', 'auto.sourcefree'],
    maxparts: 1,
    finalCltv,
    // Lets CLN enforce the CLTV limit for us, replacing the manual
    // exclude/retry loop we needed with "getroute"
    maxdelay:
      cltvLimit !== undefined
        ? Math.min(cltvLimit, maxRouteDelay)
        : maxRouteDelay,
    // We only query the route to estimate its CLTV and fees, so we allow
    // spending up to the full amount in fees to maximize the chance of
    // finding a route
    maxfeeMsat: {
      msat: toProtoInt(amountMsat),
    },
  };

  const res = await nodeCaller<
    noderpc.GetroutesRequest,
    noderpc.GetroutesResponse
  >('getRoutes', req);

  if (res.routes.length === 0 || res.routes[0].path.length === 0) {
    throw Errors.NO_ROUTE();
  }

  const firstHop = res.routes[0].path[0];

  // CLN v26.06 renamed these fields ("delay" -> "cltvIn", "amountMsat" ->
  // "amountInMsat") while keeping the same meaning. Read whichever the node
  // returns so we support v26.04 through v26.06 (and beyond, once the
  // deprecated fields are removed)
  const ctlv = firstHop.cltvIn ?? firstHop.delay;
  const amountInMsat = firstHop.amountInMsat ?? firstHop.amountMsat;

  if (ctlv === undefined || amountInMsat === undefined) {
    throw Errors.NO_ROUTE();
  }

  return {
    ctlv,
    feesMsat: Number(BigInt(amountInMsat.msat) - BigInt(amountMsat)),
  };
};
