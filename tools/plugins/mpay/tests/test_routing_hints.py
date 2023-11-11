from typing import Any

import pytest
from pyln.client import Millisatoshi

from plugins.mpay.pay.route import Fees, RoutingHint
from plugins.mpay.routing_hints import OnlySingleRoutingHintsError, parse_routing_hints


class TestRoutingHints:
    def test_parse_routing_hints_no_routes(self) -> None:
        payee = "destination"
        assert parse_routing_hints({"payee": payee}) == (False, payee, None)

    @pytest.mark.parametrize(
        "dec",
        [
            {"payee": "test", "routes": []},
            {"payee": "test", "routes": [[]]},
            {"payee": "test", "routes": [[{}], []]},
        ],
    )
    def test_parse_routing_hints_only_single_error(self, dec: dict[str, Any]) -> None:
        with pytest.raises(OnlySingleRoutingHintsError):
            parse_routing_hints(dec)

    def test_parse_routing_hints(self) -> None:
        dec = {
            "payee": "test",
            "amount_msat": Millisatoshi(1233214),
            "routes": [
                [
                    {
                        "pubkey": "hint pubkey",
                        "short_channel_id": "id",
                        "fee_base_msat": 123,
                        "fee_proportional_millionths": 10,
                        "cltv_expiry_delta": 10,
                    }
                ]
            ],
        }

        assert parse_routing_hints(dec) == (
            True,
            dec["routes"][0][0]["pubkey"],
            RoutingHint(
                hop_hint={
                    "id": dec["payee"],
                    "channel": dec["routes"][0][0]["short_channel_id"],
                    "direction": 1,
                    "amount_msat": dec["amount_msat"],
                    "delay": 0,
                    "style": "tlv",
                },
                fees=Fees(
                    base_msat=dec["routes"][0][0]["fee_base_msat"],
                    proportional_millionths=dec["routes"][0][0]["fee_proportional_millionths"],
                ),
                cltv_expiry_delta=dec["routes"][0][0]["cltv_expiry_delta"],
            ),
        )
