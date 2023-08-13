from invoice import HoldInvoice, InvoiceState
from protos.hold_pb2 import (
    Invoice,
    InvoiceAccepted,
    InvoiceCancelled,
    InvoicePaid,
    InvoiceUnpaid,
)

INVOICE_STATE_TO_GRPC = {
    InvoiceState.Paid: InvoicePaid,
    InvoiceState.Unpaid: InvoiceUnpaid,
    InvoiceState.Accepted: InvoiceAccepted,
    InvoiceState.Cancelled: InvoiceCancelled,
}


class Transformers:
    @staticmethod
    def invoice_to_grpc(invoice: HoldInvoice) -> Invoice:
        return Invoice(
            payment_hash=invoice.payment_hash,
            payment_preimage=invoice.payment_preimage,
            state=INVOICE_STATE_TO_GRPC[invoice.state],
            bolt11=invoice.bolt11,
        )
