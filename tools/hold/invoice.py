import datetime
import json
from dataclasses import dataclass
from enum import Enum
from json import JSONEncoder
from typing import Any, TypeVar

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


class HoldInvoiceEncoder(JSONEncoder):
    def default(self, obj: object) -> str | int | None:
        if isinstance(obj, (datetime.date, datetime.datetime)):
            return int(obj.timestamp())

        if isinstance(obj, Enum):
            return obj.value

        return None


HoldInvoiceType = TypeVar("HoldInvoiceType", bound="HoldInvoice")


@dataclass
class HoldInvoice:
    state: InvoiceState
    bolt11: str
    payment_hash: str
    payment_preimage: str | None
    created_at: datetime.datetime

    def set_state(self, tracker: Tracker, new_state: InvoiceState) -> None:
        if self.state == new_state:
            return

        if new_state not in POSSIBLE_STATE_TRANSITIONS[self.state]:
            raise HoldInvoiceStateError(self.state, new_state)

        self.state = new_state
        tracker.send_update(self.payment_hash, self.bolt11, self.state)

    def to_json(self) -> str:
        return json.dumps(
            self.__dict__,
            cls=HoldInvoiceEncoder,
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            k: int(v.timestamp()) if isinstance(v, datetime.datetime) else v
            for k, v in self.__dict__.items()
        }

    @classmethod
    def from_json(cls: type[HoldInvoiceType], json_str: str) -> HoldInvoiceType:
        json_dict = json.loads(json_str)
        json_dict["created_at"] = datetime.datetime.fromtimestamp(
            json_dict["created_at"], tz=datetime.timezone.utc
        )
        return cls(**json_dict)
