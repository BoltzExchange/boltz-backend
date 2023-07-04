#!/usr/bin/env /tools/.venv/bin/python3
import json
from collections import defaultdict
from dataclasses import dataclass
from enum import Enum
from hashlib import sha256
from typing import Any, ClassVar, TypeVar

from pyln.client import Plugin, RpcError
from pyln.client.plugin import Request

# TODO: fix shebang line
# TODO: restart handling
# TODO: MPP

PLUGIN_NAME = "hold"


class DataErrorCodes(int, Enum):
    KeyDoesNotExist = 1200
    KeyExists = 1202


class HtlcFailureMessage(str, Enum):
    IncorrectPaymentDetails = "400F"


class InvoiceState(str, Enum):
    Paid = "paid"
    Unpaid = "unpaid"
    Accepted = "accepted"
    Cancelled = "cancelled"


class HoldInvoiceStateError(ValueError):
    def __init__(self, old_state: InvoiceState, new_state: InvoiceState) -> None:
        msg = f"illegal hold invoice state transition ({old_state} -> {new_state})"
        super(ValueError, self).__init__(msg)

        self.error = {
            "code": 2103,
            "message": msg,
        }


class Errors:
    invoice_exists: ClassVar[dict[str, Any]] = {
        "code": 2101,
        "message": "hold invoice with that payment hash exists already",
    }
    invoice_not_exists: ClassVar[dict[str, Any]] = {
        "code": 2102,
        "message": "hold invoice with that payment hash does not exist",
    }


POSSIBLE_STATE_TRANSITIONS = {
    InvoiceState.Paid: [],
    InvoiceState.Cancelled: [],
    InvoiceState.Accepted: [InvoiceState.Cancelled, InvoiceState.Paid],
    InvoiceState.Unpaid: [InvoiceState.Accepted, InvoiceState.Cancelled],
}

HoldInvoiceType = TypeVar("HoldInvoiceType", bound="HoldInvoice")


@dataclass
class HoldInvoice:
    state: InvoiceState
    bolt11: str
    payment_hash: str
    payment_preimage: str | None

    def set_state(self, new_state: InvoiceState) -> None:
        if new_state not in POSSIBLE_STATE_TRANSITIONS[self.state]:
            raise HoldInvoiceStateError(self.state, new_state)

        self.state = new_state

    def to_json(self) -> str:
        return json.dumps(
            self.__dict__,
            default=lambda x: x.value if isinstance(x, Enum) else x,
        )

    @classmethod
    def from_json(cls: type[HoldInvoiceType], json_str: str) -> HoldInvoiceType:
        json_dict = json.loads(json_str)
        return cls(**json_dict)


class Settler:
    _plugin: Plugin
    _requests: ClassVar[dict[str, list[Request]]] = defaultdict(list)

    def __init__(self, plugin: Plugin) -> None:
        self._plugin = plugin

    def handle_htlc(self, req: Request, invoice: HoldInvoice) -> None:
        if invoice.state == InvoiceState.Paid:
            self._settle_callback(req, invoice.payment_preimage)
            return

        if invoice.state == InvoiceState.Cancelled:
            self.fail_callback(req, HtlcFailureMessage.IncorrectPaymentDetails)
            return

        invoice.set_state(InvoiceState.Accepted)
        self._requests[invoice.payment_hash].append(req)
        ds.save_invoice(invoice, mode="must-replace")
        self._plugin.log(f"Accepted hold invoice {invoice.payment_hash}")

    def settle(self, invoice: HoldInvoice) -> None:
        invoice.set_state(InvoiceState.Paid)
        for req in self._pop_requests(invoice.payment_hash):
            self._settle_callback(req, invoice.payment_preimage)

    def cancel(self, invoice: HoldInvoice) -> None:
        invoice.set_state(InvoiceState.Cancelled)
        for req in self._pop_requests(invoice.payment_hash):
            self.fail_callback(req, HtlcFailureMessage.IncorrectPaymentDetails)

    def _pop_requests(self, payment_hash: str) -> list[Request]:
        return self._requests.pop(payment_hash, [])

    @staticmethod
    def fail_callback(req: Request, message: HtlcFailureMessage) -> None:
        req.set_result({
            "result": "fail",
            "failure_message": message,
        })

    @staticmethod
    def continue_callback(req: Request) -> None:
        req.set_result({
            "result": "continue",
        })

    @staticmethod
    def _settle_callback(req: Request, preimage: str) -> None:
        req.set_result({
            "result": "resolve",
            "payment_key": preimage,
        })


class DataStore:
    _plugin: Plugin
    _invoices_key = "invoices"

    def __init__(self, plugin: Plugin) -> None:
        self._plugin = plugin

    def save_invoice(self, invoice: HoldInvoice, mode: str = "must-create") -> None:
        self._plugin.rpc.datastore(
            key=[PLUGIN_NAME, DataStore._invoices_key, invoice.payment_hash],
            string=invoice.to_json(),
            mode=mode,
        )

    def list_invoices(self, payment_hash: str | None) -> list[HoldInvoice]:
        key = [PLUGIN_NAME, DataStore._invoices_key]
        if payment_hash is not None:
            key.append(payment_hash)

        return self._parse_invoices(self._plugin.rpc.listdatastore(
            key=key,
        ))

    def get_invoice(self, payment_hash: str) -> HoldInvoice | None:
        invoices = self.list_invoices(payment_hash)
        if len(invoices) == 0:
            return None

        return invoices[0]

    def delete_invoice(self, payment_hash: str) -> bool:
        try:
            self._plugin.rpc.deldatastore(
                [PLUGIN_NAME, DataStore._invoices_key, payment_hash],
            )
        except RpcError as e:
            if e.error["code"] == DataErrorCodes.KeyDoesNotExist:
                return False

            raise

        return True

    def settle_invoice(self, invoice: HoldInvoice, preimage: str) -> None:
        # TODO: save in the normal invoice table of CLN
        invoice.payment_preimage = preimage
        settler.settle(invoice)
        self.save_invoice(invoice, mode="must-replace")

    def cancel_invoice(self, invoice: HoldInvoice) -> None:
        settler.cancel(invoice)
        self.save_invoice(invoice, mode="must-replace")

    def delete_invoices(self) -> int:
        key = [PLUGIN_NAME, DataStore._invoices_key]
        invoices = self._plugin.rpc.listdatastore(key=key)["datastore"]
        for invoice in invoices:
            self._plugin.rpc.deldatastore(invoice["key"])

        return len(invoices)

    @staticmethod
    def _parse_invoices(data: dict[str, Any]) -> list[HoldInvoice]:
        invoices = []

        for invoice in data["datastore"]:
            invoices.append(HoldInvoice.from_json(invoice["string"]))

        return invoices


pl = Plugin()

ds = DataStore(pl)
settler = Settler(pl)


@pl.init()
def init(
        options: dict[str, Any],
        configuration: dict[str, Any],
        plugin: Plugin,
        **kwargs: dict[str, Any],
) -> None:
    plugin.log(f"Plugin {PLUGIN_NAME} initialized")


@pl.method("holdinvoice")
def hold_invoice(plugin: Plugin, bolt11: str) -> dict[str, Any]:
    dec = plugin.rpc.decodepay(bolt11)
    payment_hash = dec["payment_hash"]

    if len(plugin.rpc.listinvoices(payment_hash=payment_hash)["invoices"]) > 0:
        return Errors.invoice_exists

    signed = plugin.rpc.call("signinvoice", {
        "invstring": bolt11,
    })["bolt11"]

    try:
        ds.save_invoice(
            HoldInvoice(InvoiceState.Unpaid, signed, payment_hash, None),
        )
        plugin.log(f"Added hold invoice {payment_hash} for {dec['amount_msat']}")
    except RpcError as e:
        if e.error["code"] == DataErrorCodes.KeyExists:
            return Errors.invoice_exists

        raise

    return {
        "bolt11": signed,
    }


@pl.method("listholdinvoices")
def list_hold_invoices(plugin: Plugin, payment_hash: str = "") -> dict[str, Any]:
    invoices = ds.list_invoices(None if payment_hash == "" else payment_hash)
    return {
        "holdinvoices": [i.__dict__ for i in invoices],
    }


@pl.method("settleholdinvoice")
def settle_hold_invoice(plugin: Plugin, payment_preimage: str) -> dict[str, Any]:
    payment_hash = sha256(bytes.fromhex(payment_preimage)).hexdigest()
    invoice = ds.get_invoice(payment_hash)
    if invoice is None:
        return Errors.invoice_not_exists

    try:
        ds.settle_invoice(invoice, payment_preimage)
        plugin.log(f"Settled hold invoice {payment_hash}")
    except HoldInvoiceStateError as e:
        return e.error

    return {}


@pl.method("cancelholdinvoice")
def cancel_hold_invoice(plugin: Plugin, payment_hash: str) -> dict[str, Any]:
    invoice = ds.get_invoice(payment_hash)
    if invoice is None:
        return Errors.invoice_not_exists

    try:
        ds.cancel_invoice(invoice)
        plugin.log(f"Cancelled hold invoice {payment_hash}")
    except HoldInvoiceStateError as e:
        return e.error

    return {}


@pl.method("dev-wipeholdinvoices")
def wipe_hold_invoices(plugin: Plugin, payment_hash: str = "") -> dict[str, Any]:
    if payment_hash == "":
        plugin.log("Deleting all hold invoices", level="warn")
        deleted_count = ds.delete_invoices()
    else:
        if not ds.delete_invoice(payment_hash):
            return Errors.invoice_not_exists

        deleted_count = 1
        plugin.log(f"Deleted hold invoice {payment_hash}", level="warn")

    return {
        "deleted_count": deleted_count,
    }


@pl.async_hook("htlc_accepted")
def on_htlc_accepted(
        onion: dict[str, Any],
        htlc: dict[str, Any],
        request: Request,
        plugin: Plugin,
        **kwargs: dict[str, Any],
) -> None:
    # Ignore forwards
    if "forward_to" in kwargs:
        Settler.continue_callback(request)
        return

    invoice = ds.get_invoice(htlc["payment_hash"])

    # Ignore invoices that aren't hold invoices
    if invoice is None:
        Settler.continue_callback(request)
        return

    dec = plugin.rpc.decodepay(invoice.bolt11)
    invoice_msat = int(dec["amount_msat"])
    htlc_msat = int(htlc["amount_msat"])

    if htlc_msat != invoice_msat:
        plugin.log(
            f"Rejected hold invoice {invoice.payment_hash}: amount mismatch "
            f"({htlc_msat} != {invoice_msat})",
            level="warn",
        )
        Settler.fail_callback(request, HtlcFailureMessage.IncorrectPaymentDetails)
        return

    if htlc["cltv_expiry_relative"] < dec["min_final_cltv_expiry"]:
        plugin.log(
            f"Rejected hold invoice {invoice.payment_hash}: CLTV too little "
            f"({htlc['cltv_expiry_relative']} < {dec['min_final_cltv_expiry']})",
            level="warn",
        )
        Settler.fail_callback(request, HtlcFailureMessage.IncorrectPaymentDetails)
        return

    settler.handle_htlc(request, invoice)


pl.run()
