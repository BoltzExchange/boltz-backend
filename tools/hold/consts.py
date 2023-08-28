from enum import Enum


class Network(str, Enum):
    Mainnet = "bitcoin"
    Testnet = "testnet"
    Signet = "signet"
    Regtest = "regtest"


PLUGIN_NAME = "hold"
VERSION = "0.0.2"

TIMEOUT_CANCEL = 60
TIMEOUT_CANCEL_REGTEST = 5

TIMEOUT_CHECK_INTERVAL = 10

GRPC_HOST_REGTEST = "0.0.0.0"  # noqa: S104
