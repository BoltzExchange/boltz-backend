from enum import Enum


class Network(str, Enum):
    Mainnet = "bitcoin"
    Testnet = "testnet"
    Signet = "signet"
    Regtest = "regtest"


PLUGIN_NAME = "hold"

TIMEOUT_CANCEL = 60
TIMEOUT_CANCEL_REGTEST = 5

TIMEOUT_CHECK_INTERVAL = 10
