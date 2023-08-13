import threading
from typing import Any
from urllib.request import Request

from consts import (
    TIMEOUT_CANCEL,
    TIMEOUT_CANCEL_REGTEST,
    TIMEOUT_CHECK_INTERVAL,
    Network,
)
from datastore import DataStore
from invoice import HoldInvoice, InvoiceState
from pyln.client import Plugin
from settler import HtlcFailureMessage, Htlcs, Settler
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
        dec_invoice: dict[str, Any],
        htlc_msat: int,
        req: Request,
    ) -> None:
        with self._lock:
            if invoice.state == InvoiceState.Paid:
                Settler.settle_callback(req, invoice.payment_preimage)
                return

            if invoice.state == InvoiceState.Cancelled:
                Settler.fail_callback(req, HtlcFailureMessage.IncorrectPaymentDetails)
                return

            if invoice.payment_hash not in self._settler.htlcs:
                invoice_msat = int(dec_invoice["amount_msat"])
                self._settler.htlcs[invoice.payment_hash] = Htlcs(invoice_msat)

            htlcs = self._settler.htlcs[invoice.payment_hash]
            htlcs.add_htlc(htlc_msat, req)

            if not htlcs.is_fully_paid():
                return

            invoice.set_state(self._tracker, InvoiceState.Accepted)
            self._ds.save_invoice(invoice, mode="must-replace")
            self._plugin.log(
                f"Accepted hold invoice {invoice.payment_hash} "
                f"with {len(htlcs.htlcs)} HTLCs",
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
            for htlcs in self._settler.htlcs.values():
                if not htlcs.is_fully_paid():
                    htlcs.cancel_expired(self._timeout)
