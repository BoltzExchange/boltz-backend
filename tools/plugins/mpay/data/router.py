import copy
from typing import Any, Iterator

from pyln.client import Millisatoshi, Plugin

from plugins.mpay.data.network_info import ChannelInfo, NetworkInfo
from plugins.mpay.data.route_stats import HOP_SEPERATOR, RouteStats
from plugins.mpay.data.routes import Routes
from plugins.mpay.pay.excludes import ExcludesPayment
from plugins.mpay.pay.route import Route
from plugins.mpay.routing_hints import parse_routing_hints
from plugins.mpay.utils import format_error

_MIN_EMA_RATE = 0.5


class MaxHtlcTooSmallError(Exception):
    pass


class InExcludeListError(ValueError):
    def __init__(self, channel: str) -> None:
        super(ValueError, self).__init__(f"{channel} is in exclude list")


class Router:
    routes: Routes

    _pl: Plugin
    _network_info: NetworkInfo

    def __init__(self, pl: Plugin, routes: Routes, network_info: NetworkInfo) -> None:
        self.routes = routes

        self._pl = pl
        self._network_info = network_info

    def fetch_routes(
        self, dec: dict[str, Any], amount: Millisatoshi, excludes: ExcludesPayment
    ) -> Iterator[tuple[RouteStats, Route]]:
        has_routing_hint, destination, routing_hint = parse_routing_hints(dec)

        route_stats = self.routes.get_routes(destination, 0, _MIN_EMA_RATE, excludes)

        self._pl.log(f"Found {len(route_stats)} potential known routes to {destination}")

        for stat_route in route_stats:
            try:
                route = self._transform_stat_route(stat_route, amount, excludes)
                if has_routing_hint:
                    route.add_routing_hint(copy.deepcopy(routing_hint))

                yield stat_route, route
            except GeneratorExit:  # noqa: PERF203
                break
            except BaseException as e:
                # TODO: penalize in db?
                self._pl.log(f"Disregarding route {stat_route} because: {format_error(e)}")

    def _transform_stat_route(
        self, stats: RouteStats, amount: Millisatoshi, exclude_list: ExcludesPayment
    ) -> Route:
        for hop in stats.route:
            if hop in exclude_list:
                raise InExcludeListError(hop)

        chan_infos = [self._get_channel_info(hop) for hop in stats.route]

        # TODO: make sure all channels are active

        # Make sure the minimal htlc_maximum_msat size on the route is bigger than our amount
        if min(chan_infos, key=lambda e: e.htlc_maximum_msat).htlc_maximum_msat < int(amount):
            raise MaxHtlcTooSmallError

        return Route.from_channel_infos(amount, chan_infos)

    def _get_channel_info(self, hop: str) -> ChannelInfo:
        split = hop.split(HOP_SEPERATOR)
        return self._network_info.get_channel_info_side(split[0], int(split[1]))
