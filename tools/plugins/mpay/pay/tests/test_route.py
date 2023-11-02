from typing import Any

import pytest
from pyln.client import Millisatoshi

from plugins.mpay.pay.route import Route


class TestRoute:
    @pytest.mark.parametrize(
        ("most_expensive", "fee", "route_dict"),
        [
            (0, 0, [{"amount_msat": Millisatoshi(1)}]),
            (
                0,
                10,
                [
                    {"amount_msat": Millisatoshi(20)},
                    {"amount_msat": Millisatoshi(10)},
                    {"amount_msat": Millisatoshi(9)},
                ],
            ),
            (
                1,
                7,
                [
                    {"amount_msat": Millisatoshi(10)},
                    {"amount_msat": Millisatoshi(9)},
                    {"amount_msat": Millisatoshi(2)},
                ],
            ),
            (
                3,
                8,
                [
                    {"amount_msat": Millisatoshi(10)},
                    {"amount_msat": Millisatoshi(10)},
                    {"amount_msat": Millisatoshi(10)},
                    {"amount_msat": Millisatoshi(9)},
                    {"amount_msat": Millisatoshi(1)},
                ],
            ),
        ],
    )
    def test_most_expensive_channel(
        self, most_expensive: int, fee: int, route_dict: list[dict[str, Any]]
    ) -> None:
        route = Route(route_dict)
        assert route.most_expensive_channel() == (route[most_expensive], Millisatoshi(fee))

    @pytest.mark.parametrize(
        "channel",
        [
            {"channel": "1x1x1", "direction": 0},
            {"channel": "1x1x1", "direction": 1},
            {"channel": "1x2x3", "direction": 1},
        ],
    )
    def test_channel_to_short_id(self, channel: dict[str, Any]) -> None:
        assert Route.channel_to_short_id(channel) == f"{channel['channel']}/{channel['direction']}"
