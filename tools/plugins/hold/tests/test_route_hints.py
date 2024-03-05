from plugins.hold.route_hints import RouteHints
from plugins.hold.tests.utils import LndNode, RpcPlugin, cln_con, lnd


class TestRouteHints:
    # noinspection PyTypeChecker
    rh = RouteHints(RpcPlugin())

    def test_get_private_channels(self) -> None:
        other_pubkey = lnd(LndNode.One, "getinfo")["identity_pubkey"]

        hints = self.rh.get_private_channels(other_pubkey)
        assert len(hints) == 1

        hint = hints[0]
        assert len(hint.routes) == 1

        route = hint.routes[0]
        assert route.public_key == other_pubkey

        channel_info = next(
            chan
            for chan in cln_con(f"listpeerchannels {other_pubkey}")["channels"]
            if chan["private"]
        )
        updates = channel_info["updates"]["remote"]

        assert route.base_fee == updates["fee_base_msat"]
        assert route.cltv_expiry_delta == updates["cltv_expiry_delta"]
        assert route.ppm_fee == updates["fee_proportional_millionths"]
        assert route.short_channel_id == channel_info["short_channel_id"]

    def test_get_private_channels_none_found(self) -> None:
        assert (
            self.rh.get_private_channels(
                "0394c0450766d4029e980dd2934fbc4ca665222e3149c2a4a7b8a6251544a12033"
            )
            == []
        )
