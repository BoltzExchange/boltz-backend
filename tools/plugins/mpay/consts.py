from strenum import StrEnum


class Network(StrEnum):
    Mainnet = "bitcoin"
    Testnet = "testnet"
    Signet = "signet"
    Regtest = "regtest"


PLUGIN_NAME = "mpay"
VERSION = "0.1.3"

GRPC_HOST_REGTEST = "0.0.0.0"  # noqa: S104
