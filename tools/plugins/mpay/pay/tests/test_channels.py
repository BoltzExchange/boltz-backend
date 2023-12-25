from typing import Any

import pytest
from pyln.client import Millisatoshi

from plugins.hold.tests.utils import LndNode, RpcPlugin, cln_con, lnd
from plugins.mpay.data.network_info import NetworkInfo
from plugins.mpay.pay.channels import ChannelsHelper, NoRouteError, PeerChannels
from plugins.mpay.pay.excludes import Excludes, ExcludesPayment
from plugins.mpay.pay.route import Fees, Route


class TestPeerChannels:
    @pytest.mark.parametrize(
        ("amount", "destination", "excluded", "channels"),
        [
            (
                100,
                "039277ad",
                [1],
                [
                    {
                        "peer_connected": False,
                        "peer_id": "039277ad",
                    },
                    {
                        "peer_connected": True,
                        "peer_id": "039277ad",
                        "spendable_msat": Millisatoshi(101),
                        "maximum_htlc_out_msat": Millisatoshi(101),
                        "short_channel_id": "124x1x0",
                        "direction": 0,
                        "status": [
                            "CHANNELD_NORMAL:Channel ready for use. Channel announced.",
                        ],
                    },
                    {
                        "peer_connected": False,
                        "peer_id": "no match",
                    },
                ],
            ),
            (
                100,
                "039277ad",
                [0],
                [
                    {
                        "peer_connected": True,
                        "peer_id": "039277ad",
                        "spendable_msat": Millisatoshi(101),
                        "maximum_htlc_out_msat": Millisatoshi(101),
                        "short_channel_id": "124x1x0",
                        "direction": 0,
                        "status": [
                            "CHANNELD_NORMAL:Channel ready for use. Channel announced.",
                        ],
                    },
                    {
                        "peer_connected": True,
                        "peer_id": "039277ad",
                        "spendable_msat": Millisatoshi(101),
                        "maximum_htlc_out_msat": Millisatoshi(101),
                        "status": [
                            "CHANNELD_NORMAL:Channel ready for use. Channel announced.",
                        ],
                    },
                ],
            ),
        ],
    )
    def test_get_direct_channels(
        self, amount: int, destination: str, excluded: list[int], channels: list[dict[str, Any]]
    ) -> None:
        assert PeerChannels(channels).get_direct_channels(destination, Millisatoshi(amount)) == [
            PeerChannels._get_channel_id(channels[i])  # noqa: SLF001
            for i in excluded
        ]

    @pytest.mark.parametrize(
        ("amount", "excluded", "channels"),
        [
            (
                100,
                [],
                [
                    {
                        "peer_connected": True,
                        "spendable_msat": Millisatoshi(101),
                        "maximum_htlc_out_msat": Millisatoshi(101),
                        "status": [
                            "CHANNELD_NORMAL:Channel ready for use. Channel announced.",
                        ],
                    }
                ],
            ),
            (
                100,
                [0],
                [
                    {
                        "peer_connected": False,
                        "short_channel_id": "124x1x0",
                        "direction": 0,
                    },
                    {
                        "peer_connected": True,
                        "spendable_msat": Millisatoshi(101),
                        "maximum_htlc_out_msat": Millisatoshi(101),
                        "status": [
                            "CHANNELD_NORMAL:Channel ready for use. Channel announced.",
                        ],
                    },
                ],
            ),
            (
                100,
                [0, 2],
                [
                    {
                        "peer_connected": False,
                        "short_channel_id": "124x1x0",
                        "direction": 0,
                    },
                    {
                        "peer_connected": True,
                        "spendable_msat": Millisatoshi(101),
                        "maximum_htlc_out_msat": Millisatoshi(101),
                        "status": [
                            "CHANNELD_NORMAL:Channel ready for use. Channel announced.",
                        ],
                    },
                    {
                        "peer_connected": False,
                        "short_channel_id": "117x1x0",
                        "direction": 1,
                    },
                ],
            ),
            (
                100,
                [0],
                [
                    {
                        "peer_connected": False,
                        "short_channel_id": "124x1x0",
                        "direction": 0,
                    },
                    {
                        "peer_connected": True,
                        "spendable_msat": Millisatoshi(101),
                        "maximum_htlc_out_msat": Millisatoshi(101),
                        "status": [
                            "CHANNELD_NORMAL:Channel ready for use. Channel announced.",
                        ],
                    },
                    {
                        "peer_connected": False,
                    },
                ],
            ),
        ],
    )
    def test_get_exclude_list(
        self, amount: int, excluded: list[int], channels: list[dict[str, Any]]
    ) -> None:
        assert PeerChannels(channels).get_exclude_list(Millisatoshi(amount)) == [
            PeerChannels._get_channel_id(channels[i])  # noqa: SLF001
            for i in excluded
        ]

    @pytest.mark.parametrize(
        ("expected", "amount", "channel"),
        [
            (False, 100, {"peer_connected": False}),
            (False, 100, {"peer_connected": True, "spendable_msat": Millisatoshi(99)}),
            (False, 100, {"peer_connected": True, "spendable_msat": Millisatoshi(100)}),
            (
                False,
                100,
                {
                    "peer_connected": True,
                    "spendable_msat": Millisatoshi(101),
                    "maximum_htlc_out_msat": Millisatoshi(99),
                },
            ),
            (
                False,
                100,
                {
                    "peer_connected": True,
                    "spendable_msat": Millisatoshi(101),
                    "maximum_htlc_out_msat": Millisatoshi(100),
                },
            ),
            (
                False,
                100,
                {
                    "peer_connected": True,
                    "spendable_msat": Millisatoshi(101),
                    "maximum_htlc_out_msat": Millisatoshi(101),
                    "status": [],
                },
            ),
            (
                False,
                100,
                {
                    "peer_connected": True,
                    "spendable_msat": Millisatoshi(101),
                    "maximum_htlc_out_msat": Millisatoshi(101),
                    "status": ["not ready"],
                },
            ),
            (
                True,
                100,
                {
                    "peer_connected": True,
                    "spendable_msat": Millisatoshi(101),
                    "maximum_htlc_out_msat": Millisatoshi(101),
                    "status": ["not ready", "CHANNELD_NORMAL:Channel ready for use."],
                },
            ),
            (
                True,
                100,
                {
                    "peer_connected": True,
                    "spendable_msat": Millisatoshi(101),
                    "maximum_htlc_out_msat": Millisatoshi(101),
                    "status": [
                        "not ready",
                        "CHANNELD_NORMAL:Channel ready for use. Channel announced.",
                    ],
                },
            ),
            (
                False,
                100,
                {
                    "peer_connected": True,
                    "spendable_msat": Millisatoshi(101),
                    "maximum_htlc_out_msat": Millisatoshi(101),
                    "status": [
                        "CHANNELD_NORMAL:Received ERROR channel redacted: invalid commitment",
                        "CHANNELD_NORMAL:Channel ready for use. Channel announced.",
                    ],
                },
            ),
        ],
    )
    def test_channel_is_suitable(
        self, expected: bool, amount: int, channel: dict[str, Any]
    ) -> None:
        assert PeerChannels._channel_is_suitable(channel, Millisatoshi(amount)) == expected  # noqa: SLF001

    @pytest.mark.parametrize(
        "channel",
        [
            {"short_channel_id": "124x1x0", "direction": 0},
            {"short_channel_id": "117x1x0", "direction": 1},
            {"short_channel_id": "103x1x0", "direction": 0},
        ],
    )
    def test_get_channel_id(self, channel: dict[str, Any]) -> None:
        assert (
            PeerChannels._get_channel_id(channel)  # noqa: SLF001
            == f"{channel['short_channel_id']}/{channel['direction']}"
        )

    @pytest.mark.parametrize(
        ("channel", "expected"),
        [
            ({"short_channel_id": "124x1x0", "direction": 0}, True),
            ({"short_channel_id": "124x1x0"}, False),
            ({"direction": 0}, False),
        ],
    )
    def test_has_channel_id(self, channel: dict[str, Any], expected: bool) -> None:
        assert (
            PeerChannels._has_channel_id(channel)  # noqa: SLF001
            == expected
        )


class TestChannelsHelper:
    # noinspection PyTypeChecker
    ni = NetworkInfo(RpcPlugin())
    # noinspection PyTypeChecker
    ch = ChannelsHelper(RpcPlugin(), ni)

    def test_get_peer_channels(self) -> None:
        assert self.ch.get_peer_channels() == PeerChannels(
            RpcPlugin().rpc.listpeerchannels()["channels"]
        )

    def test_get_route(self) -> None:
        invoice = lnd(LndNode.One, "addinvoice 1")["payment_request"]
        dec = cln_con(f"decode {invoice}")

        expected_routes = 3
        routes_found = 0

        excludes = ExcludesPayment(Excludes())

        for route in self.ch.get_route(dec, excludes, 2):
            assert route[-1]["delay"] == 0
            assert route[-1]["id"] == dec["payee"]
            assert route[-1]["amount_msat"] == dec["amount_msat"]

            for i, hop in enumerate(route.route):
                assert Route.channel_to_short_id(hop) not in excludes
                assert route.fees[i] == Fees.from_channel_info(
                    self.ni.get_channel_info_side(hop["channel"], hop["direction"])
                )

            excludes.add_local(Route.channel_to_short_id(route[0]))

            routes_found += 1
            if routes_found == expected_routes:
                break

        assert expected_routes == routes_found

    def test_get_route_hints(self) -> None:
        invoice = lnd(LndNode.One, "addinvoice 1 --private")["payment_request"]
        dec = cln_con(f"decode {invoice}")

        # Make sure there is a routing hint; else the test is pointless
        assert len(dec["routes"]) > 0

        route = next(self.ch.get_route(dec, ExcludesPayment(Excludes()), 2))
        assert route[-1]["id"] == dec["payee"]
        assert route[-1]["amount_msat"] == dec["amount_msat"]

    def test_get_route_error(self) -> None:
        invoice = lnd(LndNode.One, "addinvoice 1")["payment_request"]
        dec = cln_con(f"decode {invoice}")

        with pytest.raises(NoRouteError):
            next(self.ch.get_route(dec, ExcludesPayment(Excludes()), -1))
