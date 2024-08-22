import { getHexBuffer } from '../../Utils';
import { NodeClient } from '../../proto/cln/node_grpc_pb';
import * as noderpc from '../../proto/cln/node_pb';
import * as primivites from '../../proto/cln/primitives_pb';
import { satToMsat } from '../ChannelUtils';
import Errors from '../Errors';
import { Route } from '../LightningClient';

export const getRoute = async (
  nodeCaller: <T, U>(
    methodName: keyof NodeClient,
    params: T,
    toObject?: boolean,
  ) => Promise<U>,
  destination: string,
  amount: number,
  cltvLimit: number = Number.MAX_SAFE_INTEGER,
  finalCltv: number = 9,
  riskFactor: number = 0,
  maxRetries: number = 10,
): Promise<Route> => {
  const req = new noderpc.GetrouteRequest();
  req.setId(getHexBuffer(destination));

  const amountMsat = new primivites.Amount();
  amountMsat.setMsat(satToMsat(amount));
  req.setAmountMsat(amountMsat);

  req.setCltv(finalCltv);
  req.setRiskfactor(riskFactor);

  const excludes: string[] = [];
  req.setExcludeList(excludes);

  for (let i = 0; i < maxRetries; i++) {
    const res = await nodeCaller<
      noderpc.GetrouteRequest,
      noderpc.GetrouteResponse.AsObject
    >('getRoute', req, true);

    if (res.routeList.length === 0) {
      throw Errors.NO_ROUTE();
    }

    if (res.routeList[0].delay > cltvLimit) {
      const highestDelta = findHighestDeltaHop(res.routeList);
      excludes.push(`${highestDelta.channel}/${highestDelta.direction}`);

      req.setExcludeList(excludes);
      continue;
    }

    return {
      ctlv: res.routeList[0].delay,
      feesMsat: Number(
        BigInt(res.routeList[0].amountMsat!.msat) - BigInt(satToMsat(amount)),
      ),
    };
  }

  throw Errors.NO_ROUTE();
};

const findHighestDeltaHop = (route: noderpc.GetrouteRoute.AsObject[]) => {
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
