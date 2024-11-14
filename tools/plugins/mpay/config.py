from typing import Any

from pyln.client import Plugin, __version__
from strenum import StrEnum

from plugins.mpay.consts import GRPC_HOST_REGTEST, PLUGIN_NAME, Network


class OptionKeys(StrEnum):
    Db = f"{PLUGIN_NAME}-db"

    GrpcHost = f"{PLUGIN_NAME}-grpc-host"
    GrpcPort = f"{PLUGIN_NAME}-grpc-port"

    DefaultMaxFee = f"{PLUGIN_NAME}-default-max-fee"
    OverridePay = f"{PLUGIN_NAME}-override-pay"


class OptionDefaults(StrEnum):
    GrpcHost = "127.0.0.1"
    GrpcPort = "9293"

    DefaultMaxFee = "0.25"
    DefaultOverridePay = "false"


def register_options(pl: Plugin) -> None:
    pl.add_option(
        OptionKeys.Db,
        "",
        f"""{PLUGIN_NAME} database connection string;
        SQLite: sqlite+pysqlite:///path
        PostgreSQL: postgresql+psycopg://username:password@host:port/database""",
    )

    pl.add_option(OptionKeys.GrpcHost, OptionDefaults.GrpcHost, f"{PLUGIN_NAME} gRPC host")
    pl.add_option(OptionKeys.GrpcPort, OptionDefaults.GrpcPort, f"{PLUGIN_NAME} gRPC port")

    pl.add_option(
        OptionKeys.DefaultMaxFee,
        OptionDefaults.DefaultMaxFee,
        f"{PLUGIN_NAME} default max fee",
    )

    override_description = f"{PLUGIN_NAME} override pay command to use mpay instead"

    # pyln.client added full dynamic option support in 24.05
    ver = __version__.split(".")
    if int(ver[0].replace("v", "")) > 24 or (ver[0] == "24" and int(ver[1]) >= 5):
        pl.add_option(
            OptionKeys.OverridePay,
            OptionDefaults.DefaultOverridePay,
            override_description,
            "bool",
            dynamic=True,
        )
    else:
        pl.add_option(
            OptionKeys.OverridePay,
            OptionDefaults.DefaultOverridePay,
            override_description,
            "bool",
        )


class Config:
    db: str

    grpc_host: str
    grpc_port: int

    default_max_fee: float
    override_pay: bool

    def __init__(self, pl: Plugin, configuration: dict[str, Any]) -> None:
        self.db = configuration[OptionKeys.Db]
        if self.db == "":
            self.db = f"sqlite+pysqlite:///{pl.lightning_dir}/{PLUGIN_NAME}/mpay.sqlite3"
            pl.log(f"No database configured; using default {self.db}")

        self.grpc_host = (
            configuration[OptionKeys.GrpcHost]
            if pl.rpc.getinfo()["network"] != Network.Regtest
            else GRPC_HOST_REGTEST
        )
        self.grpc_port = int(configuration[OptionKeys.GrpcPort])

        self.default_max_fee = float(configuration[OptionKeys.DefaultMaxFee])

        self.override_pay = configuration[OptionKeys.OverridePay]
