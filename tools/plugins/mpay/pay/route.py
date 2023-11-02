from dataclasses import dataclass
from typing import Any

from pyln.client import Millisatoshi

from plugins.mpay.data.network_info import NetworkInfo


@dataclass
class RoutingHint:
    hop_hint: dict[str, Any]
    fee_base_msat: int
    fee_proportional_millionths: int
    cltv_expiry_delta: int


class Route:
    route: list[dict[str, Any]]

    def __init__(self, route: list[dict[str, Any]]) -> None:
        self.route = route

    def __len__(self) -> int:
        """Return the length of the route."""
        return len(self.route)

    @property
    def fee(self) -> Millisatoshi:
        return self.route[0]["amount_msat"] - self.route[-1]["amount_msat"]

    def exceeds_fee(self, max_fee: Millisatoshi) -> bool:
        return self.fee > max_fee

    def add_cltv(self, cltv: int) -> None:
        for hop in self.route:
            hop["delay"] += cltv

    def add_fees(self, base_msat: int, proportional_millionths: int) -> None:
        prev = None

        for cur in reversed(self.route):
            if prev is not None:
                # TODO: do we have to round or ceil?
                cur["amount_msat"] += Millisatoshi(
                    round(int(prev["amount_msat"]) * proportional_millionths / 1_000_000)
                )
                cur["amount_msat"] += base_msat

            prev = cur

    def add_routing_hint(self, hint: RoutingHint) -> None:
        self.add_cltv(hint.cltv_expiry_delta)

        # We have to add the hint before adding the fees because
        # the fees apply starting from the hop before the routing hint
        self.route.append(hint.hop_hint)
        self.add_fees(hint.fee_base_msat, hint.fee_proportional_millionths)

    def pretty_print(self, network_info: NetworkInfo) -> str:
        return " -> ".join(
            [f"{network_info.get_node_alias(hop['id'])} ({hop['channel']})" for hop in self.route]
        )

    @staticmethod
    def from_channel_infos(amount: Millisatoshi, infos: list[dict[str, Any]]) -> "Route":
        if len(infos) == 0:
            msg = "needs at last one channel info to create route"
            raise ValueError(msg)

        route = Route([Route._hop_from_channel_info(amount, infos[0])])

        for i, hop in enumerate(infos[1:]):
            prev_amount = route.route[i]["amount_msat"]

            route.add_cltv(hop["delay"])
            route.route.append(Route._hop_from_channel_info(prev_amount, hop))
            route.add_fees(hop["base_fee_millisatoshi"], hop["fee_per_millionth"])

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
