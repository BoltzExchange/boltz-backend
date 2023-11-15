from plugins.hold.route_hints import RouteHints
from plugins.hold.tests.utils import LndNode, RpcPlugin, cln_con, get_channel_info, lnd


class TestRouteHints:
    # noinspection PyTypeChecker
    rh = RouteHints(RpcPlugin())

    def test_init(self) -> None:
        self.rh.init()

        assert self.rh._plugin is not None  # noqa: SLF001
        assert self.rh._id == cln_con("getinfo")["id"]  # noqa: SLF001

    def test_get_private_channels(self) -> None:
        other_pubkey = lnd(LndNode.One, "getinfo")["identity_pubkey"]

        hints = self.rh.get_private_channels(other_pubkey)
        assert len(hints) == 1

        hint = hints[0]
        assert len(hint.routes) == 1

        route = hint.routes[0]
        assert route.public_key == other_pubkey

        channel_info = get_channel_info(other_pubkey, route.short_channel_id)

        assert route.cltv_expiry_delta == channel_info["delay"]
        assert route.ppm_fee == channel_info["fee_per_millionth"]
        assert route.base_fee == channel_info["base_fee_millisatoshi"]
        assert route.short_channel_id == channel_info["short_channel_id"]

    def test_get_private_channels_none_found(self) -> None:
        assert self.rh.get_private_channels("not found") == []
