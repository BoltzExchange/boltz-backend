#!/usr/bin/env python3
import sys
from typing import Any

from consts import GRPC_HOST, GRPC_HOST_REGTEST, GRPC_PORT, PLUGIN_NAME, Network
from encoder import Defaults
from errors import Errors
from invoice import HoldInvoiceStateError
from pyln.client import Plugin
from pyln.client.plugin import Request
from server import Server
from settler import HtlcFailureMessage, Settler

from hold import Hold, InvoiceExistsError, NoSuchInvoiceError

# TODO: restart handling
# TODO: docstrings
# TODO: command to get private channels for <node id>

pl = Plugin()
hold = Hold(pl)
server = Server(pl, hold)


@pl.init()
def init(
    options: dict[str, Any],
    configuration: dict[str, Any],
    plugin: Plugin,
    **kwargs: dict[str, Any],
) -> None:
    hold.init()

    # TODO: cli params to configure
    grpc_host = (
        GRPC_HOST
        if pl.rpc.getinfo()["network"] != Network.Regtest
        else GRPC_HOST_REGTEST
    )
    server.start(grpc_host, GRPC_PORT)

    pl.log(f"Plugin {PLUGIN_NAME} initialized")


@pl.method("holdinvoice")
def hold_invoice(
    plugin: Plugin,
    payment_hash: str,
    amount_msat: int,
    description: str = "",
    expiry: int = Defaults.Expiry,
    min_final_cltv_expiry: int = Defaults.MinFinalCltvExpiry,
) -> dict[str, Any]:
    try:
        return {
            "bolt11": hold.invoice(
                payment_hash, amount_msat, description, expiry, min_final_cltv_expiry
            ),
        }
    except InvoiceExistsError:
        return Errors.invoice_exists


@pl.method("listholdinvoices")
def list_hold_invoices(plugin: Plugin, payment_hash: str = "") -> dict[str, Any]:
    return {
        "holdinvoices": [i.__dict__ for i in hold.list_invoices(payment_hash)],
    }


@pl.method("settleholdinvoice")
def settle_hold_invoice(plugin: Plugin, payment_preimage: str) -> dict[str, Any]:
    try:
        hold.settle(payment_preimage)
    except NoSuchInvoiceError:
        return Errors.invoice_not_exists
    except HoldInvoiceStateError as e:
        return e.error

    return {}


@pl.method("cancelholdinvoice")
def cancel_hold_invoice(plugin: Plugin, payment_hash: str) -> dict[str, Any]:
    try:
        hold.cancel(payment_hash)
    except NoSuchInvoiceError:
        return Errors.invoice_not_exists
    except HoldInvoiceStateError as e:
        return e.error

    return {}


@pl.method("dev-wipeholdinvoices")
def wipe_hold_invoices(plugin: Plugin, payment_hash: str = "") -> dict[str, Any]:
    try:
        return {
            "deleted_count": hold.wipe(payment_hash),
        }
    except NoSuchInvoiceError:
        return Errors.invoice_not_exists


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

    invoice = hold.ds.get_invoice(htlc["payment_hash"])

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
        # TODO: use incorrect_cltv_expiry or expiry_too_soon error?
        Settler.fail_callback(request, HtlcFailureMessage.IncorrectPaymentDetails)
        return

    if (
        "payment_secret" not in onion
        or onion["payment_secret"] != dec["payment_secret"]
    ):
        plugin.log(
            f"Rejected hold invoice {invoice.payment_hash}: incorrect payment secret",
            level="warn",
        )
        Settler.fail_callback(request, HtlcFailureMessage.IncorrectPaymentDetails)
        return

    hold.handler.handle_htlc(invoice, dec, int(htlc["amount_msat"]), request)


@pl.subscribe("shutdown")
def shutdown(**kwargs: dict[str, Any]) -> None:
    pl.log(f"Plugin {PLUGIN_NAME} stopping")

    server.stop()
    hold.handler.stop()

    pl.log(f"Plugin {PLUGIN_NAME} stopped")
    sys.exit(0)


pl.run()
