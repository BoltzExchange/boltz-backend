import pytest

from plugins.hold.router import Hop, NoRouteError, Router
from plugins.hold.tests.utils import LndNode, RpcPlugin, lnd


class TestRouter:
    # noinspection PyTypeChecker
    r = Router(RpcPlugin())

    def test_get_route(self) -> None:
        other_pubkey = lnd(LndNode.One, "getinfo")["identity_pubkey"]
        route = self.r.get_route(other_pubkey, 1000, 0, None, None, None)
        assert len(route) == 1

    def test_get_route_final_cltv(self) -> None:
        other_pubkey = lnd(LndNode.One, "getinfo")["identity_pubkey"]
        route = self.r.get_route(other_pubkey, 1000, 0, None, 90, None)
        assert len(route) == 1
        assert route[0].delay == 90

    def test_get_route_too_little_max_cltv(self) -> None:
        other_pubkey = lnd(LndNode.One, "getinfo")["identity_pubkey"]

        with pytest.raises(NoRouteError):
            self.r.get_route(other_pubkey, 1000, 0, 1, None, None)

    def test_get_route_no_channels(self) -> None:
        with pytest.raises(NoRouteError):
            self.r.get_route(
                "03aaf57c1641e070b0b84d203d223083319eeeddbb43170adf8da0f010bcecff5b,",
                1000,
                0,
                None,
                None,
                None,
            )

    @pytest.mark.parametrize(
        ("delays", "result"),
        [
            ([1], 0),
            ([81, 1], 0),
            ([101, 100], 0),
            ([120, 81, 1], 1),
            ([80, 60, 40, 20, 0], 3),
            ([241, 209, 169, 129, 89, 9], 4),
        ],
    )
    def test_parse_time(self, delays: list[int], result: int) -> None:
        hops = [
            Hop(
                node_id=f"{delay}",
                channel="",
                direction=0,
                amount_msat=0,
                delay=delay,
                style="",
            )
            for delay in delays
        ]

        assert Router._most_expensive_channel(hops) == hops[result]  # noqa: SLF001
