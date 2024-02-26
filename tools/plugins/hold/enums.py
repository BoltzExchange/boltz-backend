from strenum import StrEnum


class HtlcFailureMessage(StrEnum):
    MppTimeout = "0017"
    IncorrectPaymentDetails = "400F"


class HtlcState(StrEnum):
    Paid = "paid"
    Accepted = "accepted"
    Cancelled = "cancelled"


class InvoiceState(StrEnum):
    Paid = "paid"
    Unpaid = "unpaid"
    Accepted = "accepted"
    Cancelled = "cancelled"


POSSIBLE_STATE_TRANSITIONS = {
    InvoiceState.Paid: [],
    InvoiceState.Cancelled: [],
    InvoiceState.Accepted: [
        InvoiceState.Cancelled,
        InvoiceState.Paid,
        InvoiceState.Accepted,
    ],
    InvoiceState.Unpaid: [InvoiceState.Accepted, InvoiceState.Cancelled],
}


def invoice_state_final(state: InvoiceState) -> bool:
    return len(POSSIBLE_STATE_TRANSITIONS[state]) == 0
