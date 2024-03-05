from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any

from cachetools import TTLCache
from pyln.client import Plugin


@dataclass
class ChannelInfo:
    fee_per_millionth: int
    base_fee_millisatoshi: int

    @staticmethod
    def from_listchannels(channel: dict[str, Any]) -> "ChannelInfo":
        return ChannelInfo(channel["fee_per_millionth"], channel["base_fee_millisatoshi"])

    @staticmethod
    def from_peerchannels(channel: dict[str, Any]) -> "ChannelInfo":
        return ChannelInfo(channel["fee_proportional_millionths"], channel["fee_base_msat"])


class NetworkInfo:
    _pl: Plugin
    _alias_cache: TTLCache

    def __init__(self, pl: Plugin) -> None:
        self._pl = pl
        self._alias_cache = TTLCache(maxsize=10_000, ttl=timedelta(hours=6), timer=datetime.now)

    def get_node_alias(self, pubkey: str) -> str:
        if pubkey in self._alias_cache:
            return self._alias_cache[pubkey]

        nodes = self._pl.rpc.listnodes(pubkey)["nodes"]
        alias = nodes[0]["alias"] if len(nodes) == 1 and "alias" in nodes[0] else pubkey[:20]

        self._alias_cache[pubkey] = alias
        return alias

    def get_channel_info_side(self, short_channel_id: str, side: int) -> ChannelInfo:
        channel = self._get_channel_info(short_channel_id, side)
        if channel is not None:
            return channel

        # 24.02 removed private channels from listchannels
        channel = self._get_peer_channel_info(short_channel_id, side)
        if channel is not None:
            return channel

        msg = f"no channel with id {short_channel_id}"
        raise ValueError(msg)

    def _get_channel_info(self, short_channel_id: str, side: int) -> ChannelInfo | None:
        channel = self._pl.rpc.listchannels(short_channel_id=short_channel_id)["channels"]
        if len(channel) == 0:
            return None

        return ChannelInfo.from_listchannels(
            channel[0] if channel[0]["direction"] == side else channel[1]
        )

    def _get_peer_channel_info(self, short_channel_id: str, side: int) -> ChannelInfo | None:
        channels = self._pl.rpc.listpeerchannels()["channels"]

        channel = None

        for chan in channels:
            if chan["short_channel_id"] == short_channel_id:
                channel = chan
                break

        if channel is None:
            return None

        return ChannelInfo.from_peerchannels(
            channel["updates"]["local" if side == channel["direction"] else "remote"]
        )
