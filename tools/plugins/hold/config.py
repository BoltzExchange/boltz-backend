from typing import Any

from pyln.client import Plugin
from strenum import StrEnum

from plugins.hold.consts import GRPC_HOST_REGTEST, PLUGIN_NAME, Network


class OptionKeys(StrEnum):
    GrpcHost = f"{PLUGIN_NAME}-grpc-host"
    GrpcPort = f"{PLUGIN_NAME}-grpc-port"


class OptionDefaults(StrEnum):
    GrpcHost = "127.0.0.1"
    GrpcPort = "9292"


def register_options(pl: Plugin) -> None:
    pl.add_option(OptionKeys.GrpcHost, OptionDefaults.GrpcHost, "hold gRPC host")
    pl.add_option(OptionKeys.GrpcPort, OptionDefaults.GrpcPort, "hold gRPC port")


class Config:
    grpc_host: str
    grpc_port: int

    def __init__(self, pl: Plugin, configuration: dict[str, Any]) -> None:
        self.grpc_host = (
            configuration[OptionKeys.GrpcHost]
            if pl.rpc.getinfo()["network"] != Network.Regtest
            else GRPC_HOST_REGTEST
        )
        self.grpc_port = int(configuration[OptionKeys.GrpcPort])
