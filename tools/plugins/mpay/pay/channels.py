import copy
from dataclasses import dataclass
from typing import Any, Iterator

from pyln.client import Millisatoshi, Plugin, RpcError

from plugins.mpay.data.network_info import NetworkInfo
from plugins.mpay.pay.excludes import ExcludesPayment
from plugins.mpay.pay.route import Fees, Route
from plugins.mpay.routing_hints import parse_routing_hints


class NoRouteError(Exception):
    pass


@dataclass
class PeerChannels:
    channels: list[dict[str, Any]]

    def get_direct_channels(self, destination: str, amount: Millisatoshi) -> list[str]:
        return [
            PeerChannels._get_channel_id(channel)
            for channel in self.channels
            if PeerChannels._has_channel_id(channel)
            and channel["peer_id"] == destination
            and PeerChannels._channel_is_suitable(channel, amount)
        ]

    def get_exclude_list(self, amount: Millisatoshi) -> list[str]:
        return [
            PeerChannels._get_channel_id(channel)
            for channel in self.channels
            if PeerChannels._has_channel_id(channel)
            and not PeerChannels._channel_is_suitable(channel, amount)
        ]

    @staticmethod
    def _channel_is_suitable(channel: dict[str, Any], amount: Millisatoshi) -> bool:
        return (
            channel["peer_connected"]
            and channel["spendable_msat"] > amount
            and channel["maximum_htlc_out_msat"] > amount
            and len(channel["status"]) > 0
            and channel["status"][-1].startswith("CHANNELD_NORMAL:Channel ready for use")
        )

    @staticmethod
    def _get_channel_id(channel: dict[str, Any]) -> str:
        return f"{channel['short_channel_id']}/{channel['direction']}"

    @staticmethod
    def _has_channel_id(channel: dict[str, Any]) -> bool:
        return "short_channel_id" in channel


class ChannelsHelper:
    _pl: Plugin
    _ni: NetworkInfo

    def __init__(self, pl: Plugin, network_info: NetworkInfo) -> None:
        self._pl = pl
        self._ni = network_info

    def get_peer_channels(self) -> PeerChannels:
        return PeerChannels(self._pl.rpc.listpeerchannels()["channels"])

    def get_route(
        self,
        dec: dict[str, Any],
        excludes: ExcludesPayment,
        max_hops: int,
    ) -> Iterator[Route]:
        has_routing_hint, destination, routing_hint = parse_routing_hints(dec)

        while True:
            try:
                res = self._pl.rpc.getroute(
                    node_id=destination,
                    amount_msat=dec["amount_msat"],
                    exclude=excludes.to_list(),
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

            route = Route(
                res["route"],
                [
                    Fees.from_channel_info(
                        self._ni.get_channel_info_side(hop["channel"], hop["direction"])
                    )
                    for hop in res["route"]
                ],
            )

            if has_routing_hint:
                route.add_routing_hint(copy.deepcopy(routing_hint))

            yield route
