#!/usr/bin/env python3
import sys
from typing import Any

from config import Config, register_options
from consts import (
    PLUGIN_NAME,
    VERSION,
)
from encoder import Defaults
from errors import Errors
from invoice import HoldInvoiceStateError
from pyln.client import Plugin
from pyln.client.plugin import Request
from server import Server
from settler import HtlcFailureMessage, Settler
from transformers import Transformers

from hold import Hold, InvoiceExistsError, NoSuchInvoiceError

# TODO: restart handling

pl = Plugin()
hold = Hold(pl)
server = Server(pl, hold)

register_options(pl)


@pl.init()
def init(
    options: dict[str, Any],
    configuration: dict[str, Any],
    plugin: Plugin,
    **kwargs: dict[str, Any],
) -> None:
    cfg = Config(plugin, options)
    hold.init()

    if cfg.grpc_port != -1:
        server.start(cfg.grpc_host, cfg.grpc_port)
    else:
        plugin.log("Not starting gRPC server")

    pl.log(f"Plugin {PLUGIN_NAME} v{VERSION} initialized")


@pl.method(
    method_name="holdinvoice",
    category=PLUGIN_NAME,
)
def hold_invoice(
    plugin: Plugin,
    payment_hash: str,
    amount_msat: int,
    description: str = "",
    expiry: int = Defaults.Expiry,
    min_final_cltv_expiry: int = Defaults.MinFinalCltvExpiry,
    routing_hints: list[Any] | None = None,
) -> dict[str, Any]:
    """Create a new hold invoice."""
    try:
        return {
            "bolt11": hold.invoice(
                payment_hash,
                amount_msat,
                description,
                expiry,
                min_final_cltv_expiry,
                Transformers.routing_hints_from_json(routing_hints)
                if routing_hints is not None
                else None,
            ),
        }
    except InvoiceExistsError:
        return Errors.invoice_exists


@pl.method(
    method_name="listholdinvoices",
    category=PLUGIN_NAME,
)
def list_hold_invoices(plugin: Plugin, payment_hash: str = "") -> dict[str, Any]:
    """List one or more hold invoices."""
    invoices = []

    for i in hold.list_invoices(payment_hash):
        invoice = i.invoice.to_dict()
        invoice["htlcs"] = [htlc.to_dict() for htlc in i.htlcs]
        invoices.append(invoice)

    return {
        "holdinvoices": invoices,
    }


@pl.method(
    method_name="settleholdinvoice",
    category=PLUGIN_NAME,
)
def settle_hold_invoice(plugin: Plugin, payment_preimage: str) -> dict[str, Any]:
    """Settle a hold invoice."""
    try:
        hold.settle(payment_preimage)
    except NoSuchInvoiceError:
        return Errors.invoice_not_exists
    except HoldInvoiceStateError as e:
        return e.error

    return {}


@pl.method(
    method_name="cancelholdinvoice",
    category=PLUGIN_NAME,
)
def cancel_hold_invoice(plugin: Plugin, payment_hash: str) -> dict[str, Any]:
    """Cancel a hold invoice."""
    try:
        hold.cancel(payment_hash)
    except NoSuchInvoiceError:
        return Errors.invoice_not_exists
    except HoldInvoiceStateError as e:
        return e.error

    return {}


@pl.method(
    method_name="routinghints",
    category=PLUGIN_NAME,
)
def get_routing_hints(plugin: Plugin, node: str) -> dict[str, Any]:
    """Get routing hints for the unannounced channels of a node."""
    return {
        "hints": Transformers.named_tuples_to_dict(hold.get_private_channels(node)),
    }


@pl.method(
    method_name="dev-wipeholdinvoices",
    category=PLUGIN_NAME,
)
def wipe_hold_invoices(plugin: Plugin, payment_hash: str = "") -> dict[str, Any]:
    """Delete one or more hold invoices from the datastore."""
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

    invoice_htlcs = hold.ds.get_invoice(htlc["payment_hash"])

    # Ignore invoices that aren't hold invoices
    if invoice_htlcs is None:
        Settler.continue_callback(request)
        return

    invoice = invoice_htlcs.invoice

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

    if server.is_running():
        server.stop()

    hold.handler.stop()

    pl.log(f"Plugin {PLUGIN_NAME} stopped")
    sys.exit(0)


pl.run()
