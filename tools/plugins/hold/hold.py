import hashlib

from bolt11.types import RouteHint
from pyln.client import Plugin, RpcError

from plugins.hold.datastore import DataErrorCodes, DataStore
from plugins.hold.encoder import Encoder
from plugins.hold.htlc_handler import HtlcHandler
from plugins.hold.invoice import HoldInvoice, Htlcs, InvoiceState
from plugins.hold.route_hints import RouteHints
from plugins.hold.router import Router
from plugins.hold.settler import Settler
from plugins.hold.tracker import Tracker
from plugins.hold.utils import time_now


class InvoiceExistsError(Exception):
    pass


class NoSuchInvoiceError(Exception):
    pass


class InvalidPaymentHashLengthError(Exception):
    pass


class Hold:
    def __init__(self, plugin: Plugin) -> None:
        self._plugin = plugin
        self.tracker = Tracker()
        self._settler = Settler(self.tracker)
        self._encoder = Encoder(plugin)
        self._route_hints = RouteHints(plugin)

        self.router = Router(plugin)
        self.ds = DataStore(plugin, self._settler)
        self.handler = HtlcHandler(plugin, self.ds, self._settler, self.tracker)

    def init(self) -> None:
        self.handler.init()
        self._encoder.init()

    def invoice(
        self,
        payment_hash: str,
        amount_msat: int,
        description: str | None,
        description_hash: str | None,
        expiry: int | None,
        min_final_cltv_expiry: int | None,
        route_hints: list[RouteHint] | None = None,
    ) -> str:
        if len(payment_hash) != 64:
            raise InvalidPaymentHashLengthError

        if len(self._plugin.rpc.listinvoices(payment_hash=payment_hash)["invoices"]) > 0:
            raise InvoiceExistsError

        bolt11 = self._encoder.encode(
            payment_hash,
            amount_msat,
            description,
            description_hash,
            expiry,
            min_final_cltv_expiry,
            route_hints=route_hints,
        )
        signed = self._plugin.rpc.call(
            "signinvoice",
            {
                "invstring": bolt11,
            },
        )["bolt11"]

        try:
            hi = HoldInvoice(
                state=InvoiceState.Unpaid,
                bolt11=signed,
                amount_msat=amount_msat,
                payment_hash=payment_hash,
                payment_preimage=None,
                htlcs=Htlcs(),
                created_at=time_now(),
            )
            self.ds.save_invoice(hi)
            self.tracker.send_update(hi.payment_hash, hi.bolt11, hi.state)
            self._plugin.log(f"Added hold invoice {payment_hash} for {amount_msat}")
        except RpcError as e:
            # noinspection PyTypeChecker
            if e.error["code"] == DataErrorCodes.KeyExists:
                raise InvoiceExistsError from None

            raise

        return signed

    def settle(self, payment_preimage: str) -> None:
        payment_hash = hashlib.sha256(bytes.fromhex(payment_preimage)).hexdigest()
        invoice = self.ds.get_invoice(payment_hash)
        if invoice is None:
            raise NoSuchInvoiceError

        self.ds.settle_invoice(invoice, payment_preimage)
        self._plugin.log(f"Settled hold invoice {payment_hash}")

    def cancel(self, payment_hash: str) -> None:
        invoice = self.ds.get_invoice(payment_hash)
        if invoice is None:
            raise NoSuchInvoiceError

        self.ds.cancel_invoice(invoice)
        self._plugin.log(f"Cancelled hold invoice {payment_hash}")

    def list_invoices(self, payment_hash: str | None) -> list[HoldInvoice]:
        return self.ds.list_invoices(None if payment_hash == "" else payment_hash)

    def wipe(self, payment_hash: str | None) -> int:
        if payment_hash is None or payment_hash == "":
            self._plugin.log("Deleting all hold invoices", level="warn")
            return self.ds.delete_invoices()

        if self.ds.delete_invoice(payment_hash):
            self._plugin.log(f"Deleted hold invoice {payment_hash}", level="warn")
            return 1

        raise NoSuchInvoiceError

    def get_private_channels(self, node: str) -> list[RouteHint]:
        return self._route_hints.get_private_channels(node)
