from typing import Any, Iterator

from pyln.client import Millisatoshi, Plugin, RpcError

from plugins.mpay.pay.route import Route
from plugins.mpay.routing_hints import parse_routing_hints


class NoRouteError(Exception):
    pass


class ChannelsHelper:
    _pl: Plugin

    def __init__(self, pl: Plugin) -> None:
        self._pl = pl

    def get_channel_exclude_list(self, amount: Millisatoshi) -> list[str]:
        return [
            channel["short_channel_id"] + suffix
            for channel in self._pl.rpc.listpeerchannels()["channels"]
            if not channel["peer_connected"]
            or channel["spendable_msat"] < amount
            or channel["maximum_htlc_out_msat"] < amount
            or not channel["status"][-1].startswith("CHANNELD_NORMAL:Channel ready for use")
            for suffix in ["/0", "/1"]
        ]

    # TODO: don't *always* use the routing hint but add it as option
    def get_route(
        self,
        dec: dict[str, Any],
        exclude: list[str],
        max_hops: int,
    ) -> Iterator[Route]:
        has_routing_hint, destination, routing_hint = parse_routing_hints(dec)

        while True:
            try:
                res = self._pl.rpc.getroute(
                    node_id=destination,
                    amount_msat=dec["amount_msat"],
                    exclude=exclude,
                    maxhops=max_hops,
                    cltv=0,
                    riskfactor=0,
                )
            except RpcError as e:
                if "message" in e.error and e.error["message"].startswith("Shortest route was"):
                    raise NoRouteError from None

                raise

            if "route" not in res:
                raise NoRouteError

            route = Route(res["route"])

            if has_routing_hint:
                route.add_routing_hint(routing_hint)

            yield route
