import json
import os
from collections.abc import Callable
from enum import Enum
from threading import Thread
from typing import Any

import pytest
from utils import parse_time

PLUGIN_PATH = "/root/hold.sh"

CliCaller = Callable[..., dict[str, Any]]


class RpcCaller:
    @staticmethod
    def getinfo() -> dict:
        return cln_con("getinfo")

    @staticmethod
    def listchannels(**kwargs: dict[str, str]) -> dict:
        args = "listchannels -k"
        for key, val in kwargs.items():
            args += f" {key}={val}"

        return cln_con(args)

    @staticmethod
    def getroute(**kwargs: dict[str, Any]) -> dict:
        args = "getroute -k"
        for key, val in kwargs.items():
            if key == "exclude":
                args += f" {key}={str(val).replace(' ', '')}"
            else:
                args += f" {key if key != 'node_id' else 'id'}={val}"

        return cln_con(args)


class RpcPlugin:
    rpc = RpcCaller()


class LndNode(Enum):
    One = 1
    Two = 2


def lnd_raw(node: LndNode, *args: str) -> str:
    node_cmd = "docker exec regtest lncli --network regtest --lnddir /root/.lnd-btc"

    if node == LndNode.Two:
        node_cmd += " --rpcserver localhost:10011"

    return os.popen(
        f"{node_cmd} {' '.join(args)}",
    ).read()


def lnd(node: LndNode, *args: str) -> dict[str, Any]:
    return json.loads(lnd_raw(node, *args))


def format_json(args: dict[str, Any] | list[Any]) -> str:
    return json.dumps(args).replace('"', '\\"').replace(" ", "")


def connect_peers(cln: CliCaller) -> None:
    cln_id = cln("getinfo")["id"]

    def lnd_connect(node: LndNode) -> None:
        if len(lnd(node, "listpeers")["peers"]) == 2:
            return

        lnd(node, "connect", f"{cln_id}@127.0.0.1:9737")

    for i in LndNode:
        lnd_connect(i)


def start_plugin(cln: CliCaller) -> None:
    cln("plugin", "start", PLUGIN_PATH)


def stop_plugin(cln: CliCaller) -> None:
    plugins = cln("plugin", "list")["plugins"]
    if not any(PLUGIN_PATH in plugin["name"] for plugin in plugins):
        return

    cln("plugin", "stop", PLUGIN_PATH)


class LndPay(Thread):
    res: dict[str, Any] = None

    def __init__(
        self,
        node: LndNode,
        invoice: str,
        max_shard_size: int | None = None,
        outgoing_chan_id: str | None = None,
        timeout: int | None = None,
    ) -> None:
        Thread.__init__(self)

        self.node = node
        self.timeout = timeout
        self.invoice = invoice
        self.max_shard_size = max_shard_size
        self.outgoing_chan_id = outgoing_chan_id

    def run(self) -> None:
        cmd = "payinvoice --force --json"

        if self.outgoing_chan_id is not None:
            cmd += f" --outgoing_chan_id {self.outgoing_chan_id}"

        if self.max_shard_size is not None:
            cmd += f" --max_shard_size_sat {self.max_shard_size}"

        if self.timeout is not None:
            cmd += f" --timeout {self.timeout}s"

        res = lnd_raw(self.node, f"{cmd} {self.invoice} 2> /dev/null")
        res = res[res.find("{") :]
        self.res = json.loads(res)


def cln_con(*args: str) -> dict[str, Any]:
    return json.load(
        os.popen(
            f"docker exec regtest lightning-cli {' '.join(args)}",
        )
    )


def get_channel_info(node: str, short_chan_id: str | int) -> dict[str, Any]:
    channel_infos = cln_con("listchannels", "-k", f"short_channel_id={short_chan_id}")[
        "channels"
    ]
    return channel_infos[0] if channel_infos[0]["source"] == node else channel_infos[1]


class TestUtils:
    @pytest.mark.parametrize(
        ("data", "result"),
        [
            ("1970-01-01T00:00:48.1904", 0),
            ("2023-09-04T00:37:36.349Z", 1693787856),
            ("2023-09-05T10:56:22.874Z", 1693911382),
        ],
    )
    def test_parse_time(self, data: str, result: int) -> None:
        assert parse_time(data) == result
