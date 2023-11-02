from datetime import datetime, timedelta
from typing import Any

from cachetools import TTLCache
from pyln.client import Plugin


class NetworkInfo:
    _pl: Plugin
    _alias_cache: TTLCache

    # TODO: invalidate cache on certain errors (fee or cltv wrong)
    _channel_cache: TTLCache

    def __init__(self, pl: Plugin) -> None:
        self._pl = pl
        self._alias_cache = TTLCache(maxsize=10_000, ttl=timedelta(hours=6), timer=datetime.now)
        self._channel_cache = TTLCache(
            maxsize=25_000, ttl=timedelta(minutes=10), timer=datetime.now
        )

    def get_node_alias(self, pubkey: str) -> str:
        if pubkey in self._alias_cache:
            return self._alias_cache[pubkey]

        nodes = self._pl.rpc.listnodes(pubkey)["nodes"]
        alias = nodes[0]["alias"] if len(nodes) == 1 and "alias" in nodes[0] else pubkey[:20]

        self._alias_cache[pubkey] = alias
        return alias

    def get_channel_info_side(self, short_channel_id: str, side: int) -> dict[str, Any]:
        channel = self.get_channel_info(short_channel_id)
        return channel[0] if channel[0]["direction"] == side else channel[1]

    def get_channel_info(self, short_channel_id: str) -> list[dict[str, Any]]:
        if short_channel_id in self._channel_cache:
            return self._channel_cache[short_channel_id]

        channel = self._pl.rpc.listchannels(short_channel_id)["channels"]
        if len(channel) == 0:
            msg = f"no channel with id {short_channel_id}"
            raise ValueError(msg)

        self._channel_cache[short_channel_id] = channel
        return channel
