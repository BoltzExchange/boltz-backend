from enum import Enum
from typing import Any

from pyln.client import Plugin

from plugins.hold.consts import GRPC_HOST_REGTEST, Network
from plugins.mpay.consts import PLUGIN_NAME


class OptionKeys(str, Enum):
    PostgresHost = f"{PLUGIN_NAME}-db-host"
    PostgresPort = f"{PLUGIN_NAME}-db-port"
    PostgresDatabase = f"{PLUGIN_NAME}-db-database"
    PostgresUser = f"{PLUGIN_NAME}-db-user"
    PostgresPassword = f"{PLUGIN_NAME}-db-password"

    GrpcHost = f"{PLUGIN_NAME}-grpc-host"
    GrpcPort = f"{PLUGIN_NAME}-grpc-port"

    DefaultMaxFee = f"{PLUGIN_NAME}-default-max-fee"


class OptionDefaults(str, Enum):
    PostgresHost = "127.0.0.1"
    PostgresPort = 5432
    PostgresDatabase = "mpay"
    PostgresUser = "boltz"
    PostgresPassword = "boltz"  # noqa: PIE796

    GrpcHost = "127.0.0.1"  # noqa: PIE796
    GrpcPort = "9293"

    DefaultMaxFee = 0.25


def register_options(pl: Plugin) -> None:
    pl.add_option(
        OptionKeys.PostgresHost,
        OptionDefaults.PostgresHost,
        f"{PLUGIN_NAME} PostgreSQL database host",
    )
    pl.add_option(
        OptionKeys.PostgresPort,
        OptionDefaults.PostgresPort,
        f"{PLUGIN_NAME} PostgreSQL database port",
    )
    pl.add_option(
        OptionKeys.PostgresDatabase,
        OptionDefaults.PostgresDatabase,
        f"{PLUGIN_NAME} PostgreSQL database name",
    )
    pl.add_option(
        OptionKeys.PostgresUser,
        OptionDefaults.PostgresUser,
        f"{PLUGIN_NAME} PostgreSQL database user",
    )
    pl.add_option(
        OptionKeys.PostgresPassword,
        OptionDefaults.PostgresPassword,
        f"{PLUGIN_NAME} PostgreSQL database password",
    )

    pl.add_option(OptionKeys.GrpcHost, OptionDefaults.GrpcHost, f"{PLUGIN_NAME} gRPC host")
    pl.add_option(OptionKeys.GrpcPort, OptionDefaults.GrpcPort, f"{PLUGIN_NAME} gRPC port")

    pl.add_option(
        OptionKeys.DefaultMaxFee,
        OptionDefaults.DefaultMaxFee,
        f"{PLUGIN_NAME} default max fee",
    )


class Config:
    postgres_host: str
    postgres_port: int
    postgres_db: str
    postgres_user: str
    postgres_password: str

    grpc_host: str
    grpc_port: int

    default_max_fee: float

    def __init__(self, pl: Plugin, configuration: dict[str, Any]) -> None:
        self.postgres_host = configuration[OptionKeys.PostgresHost]
        self.postgres_port = int(configuration[OptionKeys.PostgresPort])
        self.postgres_db = configuration[OptionKeys.PostgresDatabase]
        self.postgres_user = configuration[OptionKeys.PostgresUser]
        self.postgres_password = configuration[OptionKeys.PostgresPassword]

        self.grpc_host = (
            configuration[OptionKeys.GrpcHost]
            if pl.rpc.getinfo()["network"] != Network.Regtest
            else GRPC_HOST_REGTEST
        )
        self.grpc_port = int(configuration[OptionKeys.GrpcPort])

        self.default_max_fee = float(configuration[OptionKeys.DefaultMaxFee])
