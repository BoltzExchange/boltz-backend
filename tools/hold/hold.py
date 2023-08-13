import hashlib

from datastore import DataErrorCodes, DataStore
from encoder import Encoder
from htlc_handler import HtlcHandler
from invoice import HoldInvoice, InvoiceState
from pyln.client import Plugin, RpcError
from settler import Settler
from tracker import Tracker


class InvoiceExistsError(Exception):
    pass


class NoSuchInvoiceError(Exception):
    pass


class Hold:
    def __init__(self, plugin: Plugin) -> None:
        self._plugin = plugin
        self.tracker = Tracker()
        self._settler = Settler(self.tracker)
        self._encoder = Encoder(plugin)

        self.ds = DataStore(plugin, self._settler)
        self.handler = HtlcHandler(plugin, self.ds, self._settler, self.tracker)

    def init(self) -> None:
        self.handler.init()
        self._encoder.init()

    def invoice(
        self,
        payment_hash: str,
        amount_msat: int,
        description: str,
        expiry: int,
        min_final_cltv_expiry: int,
    ) -> str:
        if (
            len(self._plugin.rpc.listinvoices(payment_hash=payment_hash)["invoices"])
            > 0
        ):
            raise InvoiceExistsError

        bolt11 = self._encoder.encode(
            payment_hash,
            amount_msat,
            description,
            expiry,
            min_final_cltv_expiry,
        )
        signed = self._plugin.rpc.call(
            "signinvoice",
            {
                "invstring": bolt11,
            },
        )["bolt11"]

        try:
            self.ds.save_invoice(
                HoldInvoice(InvoiceState.Unpaid, signed, payment_hash, None),
            )
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
