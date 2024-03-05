from bolt11.models.routehint import Route, RouteHint
from pyln.client import Plugin, RpcError


class RouteHints:
    _id: str

    def __init__(self, plugin: Plugin) -> None:
        self._plugin = plugin

    def get_private_channels(self, node: str) -> list[RouteHint]:
        try:
            chans = self._plugin.rpc.listpeerchannels(peer_id=node)["channels"]
        except RpcError:
            return []

        return [
            RouteHint(
                [
                    Route(
                        public_key=node,
                        short_channel_id=chan["short_channel_id"],
                        base_fee=int(chan["updates"]["remote"]["fee_base_msat"]),
                        ppm_fee=chan["updates"]["remote"]["fee_proportional_millionths"],
                        cltv_expiry_delta=chan["updates"]["remote"]["cltv_expiry_delta"],
                    )
                ]
            )
            for chan in chans
            if chan["private"]
        ]
