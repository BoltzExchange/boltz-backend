from bolt11.models.routehint import Route, RouteHint
from pyln.client import Plugin


class RouteHints:
    _id: str

    def __init__(self, plugin: Plugin) -> None:
        self._plugin = plugin

    def init(self) -> None:
        self._id = self._plugin.rpc.getinfo()["id"]

    def get_private_channels(self, node: str) -> list[RouteHint]:
        chans = self._plugin.rpc.listchannels(destination=self._id)["channels"]
        return [
            RouteHint(
                [
                    Route(
                        public_key=chan["source"],
                        short_channel_id=chan["short_channel_id"],
                        base_fee=chan["base_fee_millisatoshi"],
                        ppm_fee=chan["fee_per_millionth"],
                        cltv_expiry_delta=chan["delay"],
                    )
                ]
            )
            for chan in filter(
                lambda chan: not chan["public"] and chan["source"] == node, chans
            )
        ]
