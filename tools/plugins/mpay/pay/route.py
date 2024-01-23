from dataclasses import dataclass
from itertools import pairwise
from typing import Any

from pyln.client import Millisatoshi

from plugins.mpay.data.network_info import NetworkInfo


@dataclass
class Fees:
    base_msat: int
    proportional_millionths: int

    @staticmethod
    def from_channel_info(info: dict[str, Any]) -> "Fees":
        return Fees(
            base_msat=info["base_fee_millisatoshi"],
            proportional_millionths=info["fee_per_millionth"],
        )


@dataclass
class RoutingHint:
    hop_hint: dict[str, Any]
    cltv_expiry_delta: int

    fees: Fees


class Route:
    route: list[dict[str, Any]]

    fees: list[Fees]

    def __init__(self, route: list[dict[str, Any]], fees: list[Fees]) -> None:
        if len(route) != len(fees):
            msg = "invalid length of route or fees"
            raise ValueError(msg)

        self.route = route
        self.fees = fees

    def __len__(self) -> int:
        """Return the length of the route."""
        return len(self.route)

    def __getitem__(self, item: int) -> dict[str, Any]:
        """Get a hop from the route."""
        return self.route[item]

    @property
    def fee(self) -> Millisatoshi:
        return self.route[0]["amount_msat"] - self.route[-1]["amount_msat"]

    @property
    def delay(self) -> int:
        return self.route[0]["delay"]

    def most_expensive_channel(self) -> tuple[dict[str, Any], Millisatoshi]:
        if len(self) == 0:
            msg = "route needs at least one hop to calculate most expensive one"
            raise ValueError(msg)

        most_expensive: tuple[dict[str, Any], Millisatoshi] = (
            self.route[0],
            Millisatoshi(0),
        )
        if len(self) == 1:
            return most_expensive

        for first, second in pairwise(self.route):
            fee = first["amount_msat"] - second["amount_msat"]
            if fee > most_expensive[1]:
                most_expensive = (first, fee)

        return most_expensive

    def highest_delay_channel(self) -> tuple[dict[str, Any], int]:
        if len(self) == 0:
            msg = "route needs at least one hop to calculate highest delay hop"
            raise ValueError(msg)

        highest_delay: tuple[dict[str, Any], int] = (
            self.route[-1],
            self.route[-1]["delay"],
        )
        if len(self) == 1:
            return highest_delay

        for first, second in pairwise(self.route):
            delay = first["delay"] - second["delay"]
            if delay > highest_delay[1]:
                highest_delay = (first, delay)

        return highest_delay

    def exceeds_fee(self, max_fee: Millisatoshi) -> bool:
        return self.fee >= max_fee

    def exceeds_delay(self, max_delay: int) -> bool:
        return self.delay >= max_delay

    def add_cltv(self, cltv: int) -> None:
        for hop in self.route:
            hop["delay"] += cltv

    def add_fees(self, index: int, base_msat: int, proportional_millionths: int) -> None:
        self.fees[index + 1] = Fees(
            base_msat=base_msat, proportional_millionths=proportional_millionths
        )
        hop = self[index]

        ppm_fee = round(int(hop["amount_msat"]) * proportional_millionths / 1_000_000)
        hop["amount_msat"] += base_msat + ppm_fee

        for i in reversed(range(index)):
            self[i]["amount_msat"] = Millisatoshi(int(self[i + 1]["amount_msat"]))

            fees = self.fees[i + 1]
            self.add_fees(i, fees.base_msat, fees.proportional_millionths)

    def add_routing_hint(self, hint: RoutingHint) -> None:
        self.add_cltv(hint.cltv_expiry_delta)

        self.route.append(hint.hop_hint)
        self.fees.append(hint.fees)

        self.add_fees(len(self) - 2, hint.fees.base_msat, hint.fees.proportional_millionths)

    def pretty_print(self, network_info: NetworkInfo) -> str:
        return " -> ".join(
            [f"{network_info.get_node_alias(hop['id'])} ({hop['channel']})" for hop in self.route]
        )

    @staticmethod
    def channel_to_short_id(channel: dict[str, Any]) -> str:
        return f"{channel['channel']}/{channel['direction']}"

    @staticmethod
    def from_channel_infos(amount: Millisatoshi, infos: list[dict[str, Any]]) -> "Route":
        if len(infos) == 0:
            msg = "needs at last one channel info to create route"
            raise ValueError(msg)

        route = Route([], [])

        for i, hop_dict in enumerate(infos):
            fees = Fees(hop_dict["base_fee_millisatoshi"], hop_dict["fee_per_millionth"])
            route.fees.append(fees)

            if i != 0:
                route.add_cltv(hop_dict["delay"])
                route.add_fees(
                    i - 1,
                    fees.base_msat,
                    fees.proportional_millionths,
                )

            route.route.append(Route._hop_from_channel_info(amount, hop_dict))

        return route

    @staticmethod
    def _hop_from_channel_info(amount: Millisatoshi, info: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": info["destination"],
            "channel": info["short_channel_id"],
            "direction": info["direction"],
            "amount_msat": Millisatoshi(int(amount)),
            "delay": 0,
            "style": "tlv",
        }
