import json
from dataclasses import dataclass
from enum import Enum
from typing import TypeVar

from enums import POSSIBLE_STATE_TRANSITIONS, InvoiceState
from tracker import Tracker


class HoldInvoiceStateError(ValueError):
    def __init__(self, old_state: InvoiceState, new_state: InvoiceState) -> None:
        msg = f"illegal hold invoice state transition ({old_state} -> {new_state})"
        super(ValueError, self).__init__(msg)

        self.error = {
            "code": 2103,
            "message": msg,
        }


HoldInvoiceType = TypeVar("HoldInvoiceType", bound="HoldInvoice")


@dataclass
class HoldInvoice:
    state: InvoiceState
    bolt11: str
    payment_hash: str
    payment_preimage: str | None

    def set_state(self, tracker: Tracker, new_state: InvoiceState) -> None:
        if new_state not in POSSIBLE_STATE_TRANSITIONS[self.state]:
            raise HoldInvoiceStateError(self.state, new_state)

        self.state = new_state
        tracker.send_update(self.payment_hash, self.bolt11, self.state)

    def to_json(self) -> str:
        return json.dumps(
            self.__dict__,
            default=lambda x: x.value if isinstance(x, Enum) else x,
        )

    @classmethod
    def from_json(cls: type[HoldInvoiceType], json_str: str) -> HoldInvoiceType:
        json_dict = json.loads(json_str)
        return cls(**json_dict)
