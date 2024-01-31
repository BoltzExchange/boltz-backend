import time

from bolt11 import Bolt11, decode
from pyln.client import Plugin

from plugins.hold.encoder import get_network_prefix


class InvoiceNetworkInvalidError(Exception):
    pass


class InvoiceExpiredError(Exception):
    pass


class InvoiceChecker:
    _pl: Plugin
    _prefix: str

    def __init__(self, pl: Plugin) -> None:
        self._pl = pl

    def init(self) -> None:
        info = self._pl.rpc.getinfo()
        self._prefix = get_network_prefix(info["network"])

    def check(self, invoice: str) -> None:
        dec = decode(invoice)

        self._check_network(dec)
        self._check_expiry(dec)

    def _check_network(self, dec: Bolt11) -> None:
        if dec.currency != self._prefix:
            raise InvoiceNetworkInvalidError

    @staticmethod
    def _check_expiry(dec: Bolt11) -> None:
        if dec.date + dec.expiry <= int(time.time()):
            raise InvoiceExpiredError
