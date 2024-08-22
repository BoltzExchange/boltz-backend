import time

from bolt11 import Bolt11, decode
from pyln.client import Plugin

from plugins.mpay.consts import Network


class InvoiceNoSelfPaymentError(Exception):
    pass


class InvoiceNetworkInvalidError(Exception):
    pass


class InvoiceExpiredError(Exception):
    pass


class InvoiceNoAmountError(Exception):
    pass


NETWORK_PREFIXES = {
    Network.Mainnet: "bc",
    Network.Testnet: "tb",
    Network.Signet: "tbs",
    Network.Regtest: "bcrt",
}


def get_network_prefix(network: str) -> str:
    # noinspection PyTypeChecker
    return (
        NETWORK_PREFIXES[network]
        if network in NETWORK_PREFIXES
        else NETWORK_PREFIXES[Network.Mainnet]
    )


class InvoiceChecker:
    _pl: Plugin
    _node_id: str
    _prefix: str

    def __init__(self, pl: Plugin) -> None:
        self._pl = pl

    def init(self) -> None:
        info = self._pl.rpc.getinfo()
        self._node_id = info["id"]
        self._prefix = get_network_prefix(info["network"])

    def check(self, invoice: str) -> None:
        dec = decode(invoice)

        for check in [
            self._check_amount,
            self._check_network,
            self._check_self_payment,
            self._check_expiry,
        ]:
            check(dec)

    def _check_network(self, dec: Bolt11) -> None:
        if dec.currency != self._prefix:
            raise InvoiceNetworkInvalidError

    def _check_self_payment(self, dec: Bolt11) -> None:
        if dec.payee == self._node_id:
            raise InvoiceNoSelfPaymentError

    @staticmethod
    def _check_expiry(dec: Bolt11) -> None:
        if dec.date + dec.expiry <= int(time.time()):
            raise InvoiceExpiredError

    @staticmethod
    def _check_amount(dec: Bolt11) -> None:
        if dec.amount_msat is None:
            raise InvoiceNoAmountError
