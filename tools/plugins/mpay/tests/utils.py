import json
import os
from enum import Enum
from typing import Any, Callable

PLUGIN_PATH_MPAY = "/root/mpay.sh"

CliCaller = Callable[..., dict[str, Any]]


class LndNode(Enum):
    One = 1
    Two = 2


class RpcCaller:
    @staticmethod
    def getinfo() -> dict:
        return cln_con("getinfo")

    @staticmethod
    def listpeerchannels(peer_id: str | None = None) -> dict:
        return cln_con(f"listpeerchannels {peer_id if peer_id is not None else ''}")

    @staticmethod
    def listchannels(**kwargs: dict[str, str]) -> dict:
        args = "listchannels -k"
        for key, val in kwargs.items():
            args += f" {key}={val}"

        return cln_con(args)

    @staticmethod
    def listnodes(pubkey: str | None = None) -> dict:
        args = "listnodes"

        if pubkey is not None:
            args += f" {pubkey}"

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


def start_plugin(cln: CliCaller, path: str) -> None:
    cln("plugin", "start", path)


def stop_plugin(cln: CliCaller, path: str) -> None:
    plugins = cln("plugin", "list")["plugins"]
    if not any(path in plugin["name"] for plugin in plugins):
        return

    cln("plugin", "stop", path)


def cln_con(*args: str) -> dict[str, Any]:
    return json.load(
        os.popen(
            f"docker exec regtest lightning-cli {' '.join(args)}",
        )
    )


def lnd_raw(node: LndNode, *args: str) -> str:
    node_cmd = "docker exec regtest lncli --network regtest --lnddir /root/.lnd-btc"

    if node == LndNode.Two:
        node_cmd += " --rpcserver localhost:10011"

    return os.popen(
        f"{node_cmd} {' '.join(args)}",
    ).read()


def lnd(node: LndNode, *args: str) -> dict[str, Any]:
    return json.loads(lnd_raw(node, *args))


def connect_peers(cln: CliCaller) -> None:
    cln_id = cln("getinfo")["id"]

    def lnd_connect(node: LndNode) -> None:
        if len(lnd(node, "listpeers")["peers"]) == 2:
            return

        lnd(node, "connect", f"{cln_id}@127.0.0.1:9737")

    for i in LndNode:
        lnd_connect(i)
