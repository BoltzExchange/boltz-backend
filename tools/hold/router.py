from dataclasses import dataclass
from typing import Any

from pyln.client import Plugin, RpcError


class NoRouteError(Exception):
    pass


@dataclass
class Hop:
    node_id: str
    channel: str
    direction: int
    amount_msat: int
    delay: int
    style: str

    def to_dict(self) -> dict[str, Any]:
        return dict(self.__dict__.items())


# TODO: exclude our channels where we don't have enough balance
class Router:
    plugin: Plugin

    def __init__(self, plugin: Plugin) -> None:
        self.plugin = plugin

    def get_route(
        self,
        destination: str,
        amount_msat: int,
        risk_factor: int,
        max_cltv: int | None,
        final_cltv_delta: int | None,
        max_retries: int | None,
    ) -> list[Hop]:
        exclude: list[str] = []

        for _ in range(max_retries if max_retries is not None else 10):
            route = self._get_route(
                destination, amount_msat, risk_factor, final_cltv_delta, exclude
            )
            if len(route) == 0:
                raise NoRouteError

            cltv_too_high = max_cltv is not None and route[0].delay > max_cltv
            if not cltv_too_high:
                return route

            most_expensive = Router._most_expensive_channel(route)
            exclude.append(f"{most_expensive.channel}/{most_expensive.direction}")

        raise NoRouteError

    def _get_route(
        self,
        destination: str,
        amount_msat: int,
        risk_factor: int,
        final_cltv_delta: int,
        exclude: list[str],
    ) -> list[Hop]:
        try:
            return Router._transform_route_res(
                self.plugin.rpc.getroute(
                    node_id=destination,
                    amount_msat=amount_msat,
                    riskfactor=risk_factor,
                    cltv=final_cltv_delta if final_cltv_delta is not None else 9,
                    exclude=exclude,
                )
            )
        except RpcError:
            raise NoRouteError from None

    @staticmethod
    def _most_expensive_channel(route: list[Hop]) -> Hop:
        if len(route) < 2:
            return route[0]

        max_hops = []
        max_delta = route[0].delay - route[1].delay
        max_hops.append(route[0])

        for i in range(1, len(route) - 1):
            delta = route[i].delay - route[i + 1].delay

            if delta == max_delta:
                max_hops.append(route[i])
            elif delta > max_delta:
                max_hops = [route[i]]
                max_delta = delta

        return max_hops[-1]

    @staticmethod
    def _transform_route_res(res: dict[str, any]) -> list[Hop]:
        return (
            [
                Hop(
                    node_id=hop["id"],
                    channel=hop["channel"],
                    direction=hop["direction"],
                    amount_msat=int(hop["amount_msat"]),
                    delay=hop["delay"],
                    style=hop["style"],
                )
                for hop in res["route"]
            ]
            if "route" in res
            else []
        )
