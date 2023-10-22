import threading
from typing import Any, Callable
from urllib.request import Request

from consts import (
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
    _lock = threading.Lock()

    _interval_thread: threading.Thread
    _stop_timeout_interval: threading.Event

    _plugin: Plugin
    _ds: DataStore
    _settler: Settler

    def __init__(
        self, plugin: Plugin, ds: DataStore, settler: Settler, tracker: Tracker
    ) -> None:
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
        onion: dict[str, Any],
        htlc_dict: dict[str, str | int],
        request: Request,
    ) -> None:
        # TODO: also settle known HTLCs
        # TODO: overpayment protection

        dec = self._plugin.rpc.decodepay(invoice.bolt11)

        # TODO: restart handling accept already accepted invoices
        htlc = invoice.htlcs.add_htlc(htlc_dict)

        def fail_and_save() -> None:
            Settler.fail_callback(request, HtlcFailureMessage.IncorrectPaymentDetails)

            htlc.state = HtlcState.Cancelled
            self._ds.save_invoice(invoice, mode="must-replace")

        if htlc_dict["cltv_expiry_relative"] < dec["min_final_cltv_expiry"]:
            self._plugin.log(
                f"Rejected hold invoice {invoice.payment_hash}: CLTV too little "
                f"({htlc_dict['cltv_expiry_relative']} < "
                f"{dec['min_final_cltv_expiry']})",
                level="warn",
            )
            # TODO: use incorrect_cltv_expiry or expiry_too_soon error?

            fail_and_save()
            return

        if (
            "payment_secret" not in onion
            or onion["payment_secret"] != dec["payment_secret"]
        ):
            self._plugin.log(
                f"Rejected hold invoice {invoice.payment_hash}: "
                f"incorrect payment secret",
                level="warn",
            )

            fail_and_save()
            return

        with self._lock:
            if invoice.state != InvoiceState.Unpaid:
                fail_and_save()
                return

            self._settler.add_htlc(invoice.payment_hash, request, htlc)

            if not invoice.is_fully_paid():
                self._ds.save_invoice(invoice, mode="must-replace")
                return

            invoice.set_state(self._tracker, InvoiceState.Accepted)
            self._ds.save_invoice(invoice, mode="must-replace")
            self._plugin.log(
                f"Accepted hold invoice {invoice.payment_hash} "
                f"with {len(invoice.htlcs)} HTLCs",
            )

    def _start_timeout_interval(self) -> None:
        self._stop_timeout_interval = threading.Event()

        def loop() -> None:
            while not self._stop_timeout_interval.wait(TIMEOUT_CHECK_INTERVAL):
                self._timeout_handler()

        self._interval_thread = threading.Thread(target=loop)
        self._interval_thread.start()

    def _timeout_handler(self) -> None:
        with self._lock:
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

        return callback
