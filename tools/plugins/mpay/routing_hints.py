from typing import Any

from plugins.mpay.pay.route import Fees, RoutingHint


class OnlySingleRoutingHintsError(Exception):
    pass


# TODO: don't *always* use the routing hint but add it as option
def parse_routing_hints(dec: dict[str, Any]) -> tuple[bool, str, RoutingHint | None]:
    payee = dec["payee"]

    if "routes" not in dec:
        return False, payee, None

    routing_hints = dec["routes"]
    if len(routing_hints) != 1 or len(routing_hints[0]) != 1:
        # TODO: multiple routing hints support
        raise OnlySingleRoutingHintsError

    hop_hint = routing_hints[0][0]

    return (
        True,
        hop_hint["pubkey"],
        RoutingHint(
            hop_hint={
                "id": payee,
                "channel": hop_hint["short_channel_id"],
                "direction": 1,
                "amount_msat": dec["amount_msat"],
                "delay": 0,
                "style": "tlv",
            },
            fees=Fees(
                base_msat=hop_hint["fee_base_msat"],
                proportional_millionths=hop_hint["fee_proportional_millionths"],
            ),
            cltv_expiry_delta=hop_hint["cltv_expiry_delta"],
        ),
    )
