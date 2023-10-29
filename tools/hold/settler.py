from dataclasses import dataclass

from enums import HtlcFailureMessage, HtlcState
from invoice import HoldInvoice, Htlc, InvoiceState
from pyln.client.plugin import Request
from tracker import Tracker


@dataclass
class HtlcRequest:
    short_channel_id: str
    channel_id: int
    request: Request


class Settler:
    _tracker: Tracker
    _htlcs: dict[str, list[HtlcRequest]]

    def __init__(self, tracker: Tracker) -> None:
        self._htlcs = {}
        self._tracker = tracker

    def add_htlc(self, payment_hash: str, request: Request, htlc: Htlc) -> None:
        if payment_hash not in self._htlcs:
            self._htlcs[payment_hash] = []

        self._htlcs[payment_hash].append(
            HtlcRequest(
                short_channel_id=htlc.short_channel_id,
                channel_id=htlc.channel_id,
                request=request,
            )
        )

    def settle(self, invoice: HoldInvoice) -> None:
        for htlc in self._pop_requests(invoice.payment_hash):
            self.settle_callback(htlc.request, invoice.payment_preimage)
            Settler._update_htlc_state(invoice, htlc, HtlcState.Paid)

        invoice.set_state(self._tracker, InvoiceState.Paid)

    def cancel(self, invoice: HoldInvoice) -> None:
        for htlc in self._pop_requests(invoice.payment_hash):
            self.fail_callback(htlc.request, HtlcFailureMessage.IncorrectPaymentDetails)
            Settler._update_htlc_state(invoice, htlc, HtlcState.Cancelled)

        invoice.set_state(self._tracker, InvoiceState.Cancelled)

    def pending_payment_hashes(self) -> list[str]:
        return list(self._htlcs.keys())

    def find_htlc_request(self, payment_hash: str, htlc: Htlc) -> Request | None:
        if payment_hash not in self._htlcs:
            return None

        return next(
            (
                htlc_req.request
                for htlc_req in self._htlcs[payment_hash]
                if htlc_req.short_channel_id == htlc.short_channel_id
                and htlc_req.channel_id == htlc.channel_id
            ),
            None,
        )

    def remove_htlc(self, payment_hash: str, to_remove: Htlc) -> None:
        if payment_hash not in self._htlcs:
            return

        self._htlcs[payment_hash] = [
            htlc
            for htlc in self._htlcs[payment_hash]
            if htlc.short_channel_id != to_remove.short_channel_id
            or htlc.channel_id != to_remove.channel_id
        ]

    def _pop_requests(self, payment_hash: str) -> list[HtlcRequest]:
        return self._htlcs.pop(payment_hash, [])

    @staticmethod
    def _update_htlc_state(invoice: HoldInvoice, htlc: HtlcRequest, new_state: HtlcState) -> None:
        invoice.htlcs.find_htlc(htlc.short_channel_id, htlc.channel_id).state = new_state

    @staticmethod
    def fail_callback(req: Request, message: HtlcFailureMessage) -> None:
        req.set_result(
            {
                "result": "fail",
                "failure_message": message,
            }
        )

    @staticmethod
    def continue_callback(req: Request) -> None:
        req.set_result(
            {
                "result": "continue",
            }
        )

    @staticmethod
    def settle_callback(req: Request, preimage: str) -> None:
        req.set_result(
            {
                "result": "resolve",
                "payment_key": preimage,
            }
        )
