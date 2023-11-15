# ruff: noqa: E501

import copy
from copy import deepcopy
from typing import Any

import pytest
from pyln.client import Millisatoshi

from plugins.hold.tests.utils import RpcPlugin
from plugins.mpay.data.network_info import NetworkInfo
from plugins.mpay.pay.route import Fees, Route, RoutingHint


class TestRoute:
    @pytest.mark.parametrize(
        "info",
        [
            {"base_fee_millisatoshi": 0, "fee_per_millionth": 1},
            {"base_fee_millisatoshi": 123, "fee_per_millionth": 0},
            {"base_fee_millisatoshi": 421, "fee_per_millionth": 60},
        ],
    )
    def test_fees_from_channel_info(self, info: dict[str, Any]) -> None:
        fees = Fees.from_channel_info(info)

        assert fees.base_msat == info["base_fee_millisatoshi"]
        assert fees.proportional_millionths == info["fee_per_millionth"]

    def test_route_fees_mismatch(self) -> None:
        with pytest.raises(
            ValueError,
            match="invalid length of route or fees",
        ):
            Route([{}], [])

        with pytest.raises(
            ValueError,
            match="invalid length of route or fees",
        ):
            Route([], [Fees(0, 1)])

    @pytest.mark.parametrize(
        ("fee", "route_dict"),
        [
            (0, [{"amount_msat": Millisatoshi(1)}]),
            (
                11,
                [
                    {"amount_msat": Millisatoshi(20)},
                    {"amount_msat": Millisatoshi(10)},
                    {"amount_msat": Millisatoshi(9)},
                ],
            ),
            (
                8,
                [
                    {"amount_msat": Millisatoshi(10)},
                    {"amount_msat": Millisatoshi(9)},
                    {"amount_msat": Millisatoshi(2)},
                ],
            ),
            (
                9,
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
    def test_fee(self, fee: int, route_dict: list[dict[str, Any]]) -> None:
        assert Route(route_dict, [Fees(0, 0) for _ in route_dict]).fee == fee

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
        route = Route(route_dict, [Fees(0, 0) for _ in route_dict])
        assert route.most_expensive_channel() == (
            route[most_expensive],
            Millisatoshi(fee),
        )

    def test_exceeds_fee(self) -> None:
        route = Route(
            [
                {"amount_msat": Millisatoshi(20)},
                {"amount_msat": Millisatoshi(10)},
                {"amount_msat": Millisatoshi(9)},
            ],
            [Fees(0, 0) for _ in range(3)],
        )

        assert not route.exceeds_fee(Millisatoshi(12))
        assert not route.exceeds_fee(Millisatoshi(13))

        assert not route.exceeds_fee(Millisatoshi(11))

        assert route.exceeds_fee(Millisatoshi(1))
        assert route.exceeds_fee(Millisatoshi(0))

    def test_most_expensive_channel_no_hops(self) -> None:
        with pytest.raises(
            ValueError,
            match="route needs at least one hop to calculate most expensive one",
        ):
            Route([], []).most_expensive_channel()

    def test_add_cltv(self) -> None:
        data = [
            {"delay": 90, "amount_msat": Millisatoshi(20)},
            {"delay": 40, "amount_msat": Millisatoshi(10)},
            {"delay": 9, "amount_msat": Millisatoshi(9)},
        ]
        route = Route(deepcopy(data), [Fees(0, 0) for _ in data])

        delta = 10
        route.add_cltv(delta)

        for i, hop in enumerate(route.route):
            assert hop["delay"] == data[i]["delay"] + 10

    @pytest.mark.parametrize(
        ("index", "base", "ppm", "expected", "route_dict"),
        [
            (
                0,
                1,
                0,
                [11, 10],
                [{"amount_msat": Millisatoshi(10)}, {"amount_msat": Millisatoshi(10)}],
            ),
            (
                0,
                0,
                100_000,
                [11, 10],
                [{"amount_msat": Millisatoshi(10)}, {"amount_msat": Millisatoshi(10)}],
            ),
            (
                0,
                0,
                260_000,
                [13, 10],
                [{"amount_msat": Millisatoshi(10)}, {"amount_msat": Millisatoshi(10)}],
            ),
            (
                0,
                1,
                100_000,
                [12, 10],
                [{"amount_msat": Millisatoshi(10)}, {"amount_msat": Millisatoshi(10)}],
            ),
            (
                0,
                1,
                100_000,
                [23, 20, 10],
                [
                    {"amount_msat": Millisatoshi(20)},
                    {"amount_msat": Millisatoshi(20)},
                    {"amount_msat": Millisatoshi(10)},
                ],
            ),
            (
                1,
                1,
                100_000,
                [23, 23, 10],
                [
                    {"amount_msat": Millisatoshi(20)},
                    {"amount_msat": Millisatoshi(20)},
                    {"amount_msat": Millisatoshi(10)},
                ],
            ),
            (
                1,
                1,
                100_000,
                [111, 111, 100],
                [
                    {"amount_msat": Millisatoshi(100)},
                    {"amount_msat": Millisatoshi(100)},
                    {"amount_msat": Millisatoshi(100)},
                ],
            ),
        ],
    )
    def test_add_fees(
        self,
        index: int,
        base: int,
        ppm: int,
        expected: list[int],
        route_dict: list[dict[str, Any]],
    ) -> None:
        route = Route(route_dict, [Fees(0, 0) for _ in route_dict])
        route.add_fees(index, base, ppm)

        for i, hop in enumerate(route.route):
            assert int(hop["amount_msat"]) == expected[i]

    def test_add_routing_hint(self) -> None:
        hop_hint = {"the": "hint"}
        hint = RoutingHint(
            hop_hint=copy.deepcopy(hop_hint),
            cltv_expiry_delta=80,
            fees=Fees(base_msat=1_000, proportional_millionths=100_000),
        )

        route_data = [
            {"amount_msat": Millisatoshi(100), "delay": 100},
            {"amount_msat": Millisatoshi(100), "delay": 50},
            {"amount_msat": Millisatoshi(100), "delay": 20},
        ]
        route = Route(copy.deepcopy(route_data), [Fees(0, 0) for _ in route_data])
        route.add_routing_hint(hint)

        assert route[len(route) - 1] == hop_hint

        fee_delta = hint.fees.base_msat + (
            route_data[-1]["amount_msat"] * hint.fees.proportional_millionths / 1_000_000
        )

        for i, hop in enumerate(route_data):
            assert route[i]["delay"] == hop["delay"] + hint.cltv_expiry_delta
            assert route[i]["amount_msat"] == hop["amount_msat"] + fee_delta

    def test_pretty_print(self) -> None:
        # noinspection PyTypeChecker
        ni = NetworkInfo(RpcPlugin())
        route = Route(
            [
                {
                    "id": "026165850492521f4ac8abd9bd8088123446d126f648ca35e60f88177dc149ceb2",
                    "channel": "1x1x1",
                },
                {
                    "id": "02d96eadea3d780104449aca5c93461ce67c1564e2e1d73225fa67dd3b997a6018",
                    "channel": "2x2x2",
                },
            ],
            [Fees(0, 0) for _ in range(2)],
        )

        assert (
            route.pretty_print(ni) == "026165850492521f4ac8 (1x1x1) -> 02d96eadea3d78010444 (2x2x2)"
        )

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

    @pytest.mark.parametrize(
        ("fee", "amounts", "delays", "route_data"),
        [
            (
                0,
                [1_000_000],
                [0],
                [
                    {
                        "destination": "0224da9fd6e22d31ccbbbd51125d3e99a91f17f7aeec597c4f3c87cc0e1761fa1b",
                        "short_channel_id": "103x1x0",
                        "direction": 1,
                        "base_fee_millisatoshi": 1_000,
                        "fee_per_millionth": 1,
                        "delay": 80,
                    },
                ],
            ),
            (
                1_001,
                [1_001_001, 1_000_000],
                [80, 0],
                [
                    {
                        "destination": "031fcfcd51ace905450e663d10886735b713324561e8f19d0de5d6c8c51de183e9",
                        "short_channel_id": "110x1x0",
                        "direction": 1,
                        "base_fee_millisatoshi": 1,
                        "fee_per_millionth": 1,
                        "delay": 6,
                    },
                    {
                        "destination": "0224da9fd6e22d31ccbbbd51125d3e99a91f17f7aeec597c4f3c87cc0e1761fa1b",
                        "short_channel_id": "103x1x0",
                        "direction": 1,
                        "base_fee_millisatoshi": 1_000,
                        "fee_per_millionth": 1,
                        "delay": 80,
                    },
                ],
            ),
            (
                3_022,
                [1_003_022, 1_002_021, 1_000_000],
                [160, 80, 0],
                [
                    {
                        "destination": "031fcfcd51ace905450e663d10886735b713324561e8f19d0de5d6c8c51de183e9",
                        "short_channel_id": "110x1x0",
                        "direction": 1,
                        "base_fee_millisatoshi": 1,
                        "fee_per_millionth": 1,
                        "delay": 6,
                    },
                    {
                        "destination": "0224da9fd6e22d31ccbbbd51125d3e99a91f17f7aeec597c4f3c87cc0e1761fa1b",
                        "short_channel_id": "103x1x0",
                        "direction": 1,
                        "base_fee_millisatoshi": 1_000,
                        "fee_per_millionth": 1,
                        "delay": 80,
                    },
                    {
                        "destination": "035718afb1d31390e7883285e72690129af0de738e5a445363c812208f9c3cca35",
                        "short_channel_id": "104x1x0",
                        "direction": 0,
                        "base_fee_millisatoshi": 2_000,
                        "fee_per_millionth": 21,
                        "delay": 80,
                    },
                ],
            ),
            (
                103_334,
                [1_103_334, 1_102_222, 1_100_001, 1_000_000],
                [260, 180, 100, 0],
                [
                    {
                        "destination": "031fcfcd51ace905450e663d10886735b713324561e8f19d0de5d6c8c51de183e9",
                        "short_channel_id": "110x1x0",
                        "direction": 1,
                        "base_fee_millisatoshi": 1_000_000,
                        "fee_per_millionth": 1,
                        "delay": 6,
                    },
                    {
                        "destination": "0224da9fd6e22d31ccbbbd51125d3e99a91f17f7aeec597c4f3c87cc0e1761fa1b",
                        "short_channel_id": "103x1x0",
                        "direction": 1,
                        "base_fee_millisatoshi": 10,
                        "fee_per_millionth": 1_000,
                        "delay": 80,
                    },
                    {
                        "destination": "035718afb1d31390e7883285e72690129af0de738e5a445363c812208f9c3cca35",
                        "short_channel_id": "104x1x0",
                        "direction": 0,
                        "base_fee_millisatoshi": 21,
                        "fee_per_millionth": 2_000,
                        "delay": 80,
                    },
                    {
                        "destination": "031fcfcd51ace905450e663d10886735b713324561e8f19d0de5d6c8c51de183e9",
                        "short_channel_id": "105x1x0",
                        "direction": 0,
                        "base_fee_millisatoshi": 1,
                        "fee_per_millionth": 100_000,
                        "delay": 100,
                    },
                ],
            ),
        ],
    )
    def test_from_channel_infos(
        self,
        fee: int,
        amounts: list[int],
        delays: list[int],
        route_data: list[dict[str, Any]],
    ) -> None:
        amount = 1_000_000
        route = Route.from_channel_infos(Millisatoshi(amount), route_data)

        assert len(route) == len(route_data)
        assert route.fee == fee

        for i, hop in enumerate(route.route):
            assert hop["delay"] == delays[i]
            assert hop["amount_msat"] == amounts[i]

            assert hop["id"] == route_data[i]["destination"]
            assert hop["channel"] == route_data[i]["short_channel_id"]
            assert hop["direction"] == route_data[i]["direction"]
            assert hop["style"] == "tlv"

    def test_from_channel_infos_empty(self) -> None:
        with pytest.raises(
            ValueError,
            match="needs at last one channel info to create route",
        ):
            Route.from_channel_infos(Millisatoshi(1), [])
