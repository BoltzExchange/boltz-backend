import pytest

from plugins.hold.tests.utils import LndNode, RpcPlugin, cln_con, lnd
from plugins.mpay.data.network_info import ChannelInfo, NetworkInfo


class TestNetworkInfo:
    # noinspection PyTypeChecker
    ni = NetworkInfo(RpcPlugin())

    @pytest.mark.parametrize("node", [LndNode.One, LndNode.Two])
    def test_get_node_alias(self, node: LndNode) -> None:
        info = lnd(node, "getinfo")
        pubkey = info["identity_pubkey"]

        assert self.ni.get_node_alias(pubkey) == info["alias"]
        assert self.ni._alias_cache[pubkey] == info["alias"]  # noqa: SLF001

        # Cached value
        assert self.ni.get_node_alias(pubkey) == info["alias"]

    def test_get_node_alias_not_found(self) -> None:
        pubkey = "02d96eadea3d780104449aca5c93461ce67c1564e2e1d73225fa67dd3b997a6018"
        assert self.ni.get_node_alias(pubkey) == pubkey[:20]

    def test_get_channel_info(self) -> None:
        channel_id = cln_con("listchannels")["channels"][0]["short_channel_id"]
        assert self.ni._get_channel_info(channel_id, 0) == ChannelInfo.from_listchannels(  # noqa: SLF001
            cln_con(f"listchannels {channel_id}")["channels"][0]
        )

    @pytest.mark.parametrize("side", [0, 1])
    def test_get_channel_info_side(self, side: int) -> None:
        channel_id = cln_con("listchannels")["channels"][0]["short_channel_id"]
        assert self.ni.get_channel_info_side(channel_id, side) == ChannelInfo.from_listchannels(
            cln_con(f"listchannels {channel_id}")["channels"][side]
        )

    @pytest.mark.parametrize("side", [0, 1])
    def test_get_channel_info_side_peer_channel(self, side: int) -> None:
        peer_channels = cln_con("listpeerchannels")["channels"]
        channel = next(chan for chan in peer_channels if chan["private"])

        assert self.ni.get_channel_info_side(
            channel["short_channel_id"], side
        ) == ChannelInfo.from_peerchannels(
            channel["updates"]["local" if side == channel["direction"] else "remote"]
        )

    def test_get_channel_info_not_found(self) -> None:
        channel_id = "811759x3111x1"

        with pytest.raises(ValueError, match=f"no channel with id {channel_id}"):
            self.ni.get_channel_info_side(channel_id, 1)
