from threading import Timer

from pyln.client import Plugin, RpcError
from reconnector_config import Config


class Reconnector:
    _pl: Plugin
    _pubkey: str

    _timer: Timer | None
    _custom_uris: dict[str, str]

    def __init__(self, pl: Plugin) -> None:
        self._pl = pl
        self._pubkey = ""
        self._timer = None
        self._custom_uris = {}

    def init(self, cfg: Config) -> None:
        self._custom_uris = cfg.custom_uris
        self._pubkey = self._pl.rpc.getinfo()["id"]

        # Cancel in case there is a running timer
        self.stop()

        self._pl.log(f"Checking for falsy inactive channels every {cfg.check_interval} seconds")
        self._timer = Timer(cfg.check_interval, self._check_inactive_channels)
        self._timer.start()

    def stop(self) -> None:
        if self._timer is not None:
            self._timer.cancel()
            self._timer = None

    def _check_inactive_channels(self) -> None:
        channels = self._pl.rpc.listpeerchannels()["channels"]

        for channel in channels:
            if (
                not channel["peer_connected"]
                or channel["status"][0] != "CHANNELD_NORMAL:Reconnected, and reestablished."
            ):
                continue

            channel_info = self._pl.rpc.listchannels(channel["short_channel_id"])["channels"]
            if len(channel_info) != 2:
                continue

            our_policy = (
                channel_info[0] if channel_info[0]["source"] == self._pubkey else channel_info[1]
            )

            if not our_policy["public"]:
                continue

            if not our_policy["active"]:
                self._pl.log(
                    f"Found falsely disabled channel with peer {channel['peer_id']}; reconnecting"
                )
                self._reconnect_channel(channel["peer_id"])

    def _reconnect_channel(self, peer_id: str) -> None:
        uris = self._get_node_uris(peer_id)

        # todo: still disconnect and hope they connect to us?
        if len(uris) == 0:
            self._pl.log(f"Could not find public URI of peer {peer_id}; not reconnecting")
            return

        self._pl.rpc.disconnect(peer_id, True)
        for uri in uris:
            try:
                self._pl.rpc.connect(uri)
                self._pl.log(f"Reconnected to {peer_id}")
                break

            except RpcError as e:
                self._pl.log(f"Could not connect to {uri}: {e!s}")

    def _get_node_uris(self, peer_id: str) -> list[str]:
        if peer_id in self._custom_uris:
            return [self._custom_uris[peer_id]]

        nodes = self._pl.rpc.listnodes(peer_id)["nodes"]
        if len(nodes) == 0:
            return []

        addresses = nodes[0]["addresses"]

        # Filter torv2
        addresses = list(filter(lambda address: address["type"] != "torv2", addresses))

        # Prefer clearnet to Tor connections
        addresses.sort(key=lambda address: 1 if "tor" in address["type"] else 0)

        return [f"{peer_id}@{address['address']}:{address['port']}" for address in addresses]
