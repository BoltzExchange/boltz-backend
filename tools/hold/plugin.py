#!/usr/bin/env python3
import hashlib
from typing import Any

from consts import PLUGIN_NAME
from datastore import DataErrorCodes, DataStore
from encoder import Defaults, Encoder
from errors import Errors
from htlc_handler import HtlcHandler
from invoice import HoldInvoice, HoldInvoiceStateError, InvoiceState
from pyln.client import Plugin, RpcError
from pyln.client.plugin import Request
from settler import HtlcFailureMessage, Settler

# TODO: restart handling
# TODO: docstrings
# TODO: gRPC with subs


pl = Plugin()

settler = Settler()
ds = DataStore(pl, settler)
handler = HtlcHandler(pl, ds, settler)
encoder = Encoder(pl)


@pl.init()
def init(
        options: dict[str, Any],
        configuration: dict[str, Any],
        plugin: Plugin,
        **kwargs: dict[str, Any],
) -> None:
    handler.init()
    encoder.init()
    plugin.log(f"Plugin {PLUGIN_NAME} initialized")


@pl.method("holdinvoice")
def hold_invoice(
        plugin: Plugin,
        payment_hash: str,
        amount_msat: int,
        # TODO: remove default when library can handle empty strings
        memo: str = "Hold invoice",
        expiry: int = Defaults.Expiry,
        min_final_cltv_expiry: int = Defaults.MinFinalCltvExpiry,
) -> dict[str, Any]:
    if len(plugin.rpc.listinvoices(payment_hash=payment_hash)["invoices"]) > 0:
        return Errors.invoice_exists

    bolt11 = encoder.encode(
        payment_hash,
        amount_msat,
        memo,
        expiry,
        min_final_cltv_expiry,
    )
    signed = plugin.rpc.call("signinvoice", {
        "invstring": bolt11,
    })["bolt11"]

    try:
        ds.save_invoice(
            HoldInvoice(InvoiceState.Unpaid, signed, payment_hash, None),
        )
        plugin.log(f"Added hold invoice {payment_hash} for {amount_msat}")
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
    payment_hash = hashlib.sha256(bytes.fromhex(payment_preimage)).hexdigest()
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
    if htlc["cltv_expiry_relative"] < dec["min_final_cltv_expiry"]:
        plugin.log(
            f"Rejected hold invoice {invoice.payment_hash}: CLTV too little "
            f"({htlc['cltv_expiry_relative']} < {dec['min_final_cltv_expiry']})",
            level="warn",
        )
        Settler.fail_callback(request, HtlcFailureMessage.IncorrectPaymentDetails)
        return

    if ("payment_secret" not in onion or
            onion["payment_secret"] != dec["payment_secret"]):
        plugin.log(
            f"Rejected hold invoice {invoice.payment_hash}: incorrect payment secret",
            level="warn",
        )
        Settler.fail_callback(request, HtlcFailureMessage.IncorrectPaymentDetails)
        return

    handler.handle_htlc(invoice, dec, int(htlc["amount_msat"]), request)


pl.run()
