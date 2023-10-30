import threading
from typing import Any, Callable
from urllib.request import Request

from consts import (
    OVERPAYMENT_FACTOR,
    TIMEOUT_CANCEL,
    TIMEOUT_CANCEL_REGTEST,
    TIMEOUT_CHECK_INTERVAL,
    Network,
)
from datastore import DataStore
from enums import HtlcState
from invoice import HoldInvoice, Htlc, InvoiceState
from pyln.client import Plugin
from settler import HtlcFailureMessage, Settler
from tracker import Tracker


class HtlcHandler:
    lock = threading.Lock()

    _interval_thread: threading.Thread
    _stop_timeout_interval: threading.Event

    _plugin: Plugin
    _ds: DataStore
    _settler: Settler

    def __init__(self, plugin: Plugin, ds: DataStore, settler: Settler, tracker: Tracker) -> None:
        self._plugin = plugin
        self._ds = ds
        self._settler = settler
        self._tracker = tracker
        self._timeout = TIMEOUT_CANCEL

        self._start_timeout_interval()

    def init(self) -> None:
        if self._plugin.rpc.getinfo()["network"] == Network.Regtest:
            self._timeout = TIMEOUT_CANCEL_REGTEST
            self._plugin.log(
                f"Using regtest MPP timeout of {self._timeout} seconds",
                level="warn",
            )

    def stop(self) -> None:
        self._stop_timeout_interval.set()
        self._interval_thread.join()

    def handle_htlc(
        self,
        invoice: HoldInvoice,
        htlc_dict: dict[str, str | int],
        onion: dict[str, Any],
        request: Request,
    ) -> None:
        # TODO: test restart handling accept/settle already accepted/settled invoices

        dec = self._plugin.rpc.decodepay(invoice.bolt11)

        htlc = Htlc.from_dict(htlc_dict)

        if invoice.htlcs.is_known(htlc):
            self.handle_known_htlc(
                invoice,
                invoice.htlcs.find_htlc(htlc.short_channel_id, htlc.channel_id),
                request,
            )
            return

        invoice.htlcs.add_htlc(htlc)

        if htlc_dict["cltv_expiry_relative"] < dec["min_final_cltv_expiry"]:
            self._log_htlc_rejected(
                invoice,
                htlc,
                f"CLTV too little ({htlc_dict['cltv_expiry_relative']} < "
                f"{dec['min_final_cltv_expiry']})",
            )
            # TODO: use incorrect_cltv_expiry or expiry_too_soon error?
            self._fail_and_save_htlc(request, invoice, htlc)
            return

        if "payment_secret" not in onion or onion["payment_secret"] != dec["payment_secret"]:
            self._log_htlc_rejected(
                invoice,
                htlc,
                "incorrect payment secret",
            )
            self._fail_and_save_htlc(request, invoice, htlc)
            return

        if invoice.state != InvoiceState.Unpaid:
            self._log_htlc_rejected(invoice, htlc, f"invoice is in state {invoice.state}")
            self._fail_and_save_htlc(request, invoice, htlc)
            return

        if invoice.amount_msat * OVERPAYMENT_FACTOR < invoice.sum_paid():
            self._log_htlc_rejected(
                invoice,
                htlc,
                f"overpayment protection; "
                f"{invoice.sum_paid()} > {invoice.amount_msat * OVERPAYMENT_FACTOR}",
            )
            self._fail_and_save_htlc(request, invoice, htlc)
            return

        self._settler.add_htlc(invoice.payment_hash, request, htlc)

        if not invoice.is_fully_paid():
            self._ds.save_invoice(invoice, mode="must-replace")
            return

        invoice.set_state(self._tracker, InvoiceState.Accepted)
        self._ds.save_invoice(invoice, mode="must-replace")
        self._plugin.log(
            f"Accepted hold invoice {invoice.payment_hash} " f"with {len(invoice.htlcs)} HTLCs",
        )

    def handle_known_htlc(self, invoice: HoldInvoice, htlc: Htlc, request: Request) -> None:
        if htlc.state == HtlcState.Accepted:
            # Pass the request to the settler to handle in the future
            self._settler.add_htlc(invoice.payment_hash, request, htlc)

        elif htlc.state == HtlcState.Paid:
            Settler.settle_callback(request, invoice.payment_preimage)

        elif htlc.state == HtlcState.Cancelled:
            Settler.fail_callback(request, HtlcFailureMessage.IncorrectPaymentDetails)

    def _start_timeout_interval(self) -> None:
        self._stop_timeout_interval = threading.Event()

        def loop() -> None:
            while not self._stop_timeout_interval.wait(TIMEOUT_CHECK_INTERVAL):
                self._timeout_handler()

        self._interval_thread = threading.Thread(target=loop)
        self._interval_thread.start()

    def _timeout_handler(self) -> None:
        with self.lock:
            for payment_hash in self._settler.pending_payment_hashes():
                invoice = self._ds.get_invoice(payment_hash)

                if invoice is not None and not invoice.is_fully_paid():
                    invoice.htlcs.cancel_expired(
                        self._timeout, self._fail_expired_callback(invoice)
                    )
                    self._ds.save_invoice(invoice, mode="must-replace")

    def _fail_expired_callback(
        self, invoice: HoldInvoice
    ) -> Callable[[Htlc, HtlcFailureMessage], None]:
        def callback(htlc: Htlc, message: HtlcFailureMessage) -> None:
            request = self._settler.find_htlc_request(invoice.payment_hash, htlc)
            if request is not None:
                Settler.fail_callback(request, message)
                self._settler.remove_htlc(invoice.payment_hash, htlc)

        return callback

    def _fail_and_save_htlc(
        self,
        request: Request,
        invoice: HoldInvoice,
        htlc: Htlc,
        message: HtlcFailureMessage = HtlcFailureMessage.IncorrectPaymentDetails,
    ) -> None:
        Settler.fail_callback(request, message)

        htlc.state = HtlcState.Cancelled
        self._ds.save_invoice(invoice, mode="must-replace")

    def _log_htlc_rejected(self, invoice: HoldInvoice, htlc: Htlc, msg: str) -> None:
        self._plugin.log(
            f"Rejected HTLC {htlc.identifier} for hold invoice {invoice.payment_hash}: {msg}",
            level="warn",
        )
