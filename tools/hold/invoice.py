import json
from dataclasses import dataclass
from datetime import date, datetime, timezone
from enum import Enum
from json import JSONEncoder
from typing import Any, Callable, TypeVar

import bolt11
from enums import (
    POSSIBLE_STATE_TRANSITIONS,
    HtlcFailureMessage,
    HtlcState,
    InvoiceState,
)
from tracker import Tracker
from utils import time_now

HtlcType = TypeVar("HtlcType", bound="Htlc")


@dataclass
class Htlc:
    state: HtlcState
    short_channel_id: str
    channel_id: int
    msat: int
    created_at: datetime

    def to_dict(self) -> dict[str, Any]:
        return {
            k: int(v.timestamp()) if isinstance(v, datetime) else v
            for k, v in self.__dict__.items()
        }

    @classmethod
    def from_json_dict(cls: type[HtlcType], json_dict: dict[str, Any]) -> HtlcType:
        json_dict["created_at"] = datetime.fromtimestamp(
            json_dict["created_at"], tz=timezone.utc
        )

        return cls(**json_dict)


HtlcsType = TypeVar("HtlcsType", bound="Htlcs")


class Htlcs:
    htlcs: list[Htlc]

    def __init__(self) -> None:
        self.htlcs = []

    def __len__(self) -> int:
        """Return the number of accepted HTLCs."""
        return len([h.msat for h in self.htlcs if h.state in HtlcState.Accepted])

    def add_htlc(self, htlc_dict: dict[str, str | int]) -> Htlc:
        htlc = Htlc(
            state=HtlcState.Accepted,
            short_channel_id=htlc_dict["short_channel_id"],
            channel_id=htlc_dict["id"],
            msat=htlc_dict["amount_msat"],
            created_at=time_now(),
        )
        self.htlcs.append(htlc)
        return htlc

    def find_htlc(self, short_channel_id: str, channel_id: int) -> Htlc | None:
        return next(
            (
                htlc
                for htlc in self.htlcs
                if htlc.short_channel_id == short_channel_id
                and htlc.channel_id == channel_id
            ),
            None,
        )

    def cancel_expired(
        self, expiry: int, fail_callback: Callable[[Htlc, HtlcFailureMessage], None]
    ) -> None:
        for htlc in self.htlcs:
            if not (time_now() - htlc.created_at).total_seconds() > expiry:
                continue

            htlc.state = HtlcState.Cancelled
            fail_callback(htlc, HtlcFailureMessage.MppTimeout)

    @classmethod
    def from_json_arr(cls: type[HtlcsType], json_arr: list[Any]) -> HtlcsType:
        htlcs = cls()
        htlcs.htlcs = [Htlc.from_json_dict(entry) for entry in json_arr]

        return htlcs


class HoldInvoiceStateError(ValueError):
    def __init__(self, old_state: InvoiceState, new_state: InvoiceState) -> None:
        msg = f"illegal hold invoice state transition ({old_state} -> {new_state})"
        super(ValueError, self).__init__(msg)

        self.error = {
            "code": 2103,
            "message": msg,
        }


class HoldInvoiceEncoder(JSONEncoder):
    def default(self, obj: object) -> str | int | list | None:
        if isinstance(obj, (date, datetime)):
            return int(obj.timestamp())

        if isinstance(obj, Enum):
            return obj.value

        if isinstance(obj, Htlcs):
            return [htlc.to_dict() for htlc in obj.htlcs]

        return None


HoldInvoiceType = TypeVar("HoldInvoiceType", bound="HoldInvoice")


@dataclass
class HoldInvoice:
    state: InvoiceState
    bolt11: str
    amount_msat: int
    payment_hash: str
    payment_preimage: str | None
    created_at: datetime
    htlcs: Htlcs

    def set_state(self, tracker: Tracker, new_state: InvoiceState) -> None:
        if self.state == new_state:
            return

        if new_state not in POSSIBLE_STATE_TRANSITIONS[self.state]:
            raise HoldInvoiceStateError(self.state, new_state)

        self.state = new_state
        tracker.send_update(self.payment_hash, self.bolt11, self.state)

    def is_fully_paid(self) -> bool:
        return self.amount_msat <= sum(
            h.msat
            for h in self.htlcs.htlcs
            if h.state in [HtlcState.Paid, HtlcState.Accepted]
        )

    def to_json(self) -> str:
        return json.dumps(
            self.__dict__,
            cls=HoldInvoiceEncoder,
        )

    def to_dict(self) -> dict[str, Any]:
        self_with_htlcs = {
            k: v if not isinstance(v, Htlcs) else [htlc.to_dict() for htlc in v.htlcs]
            for k, v in self.__dict__.items()
        }

        return {
            k: int(v.timestamp()) if isinstance(v, datetime) else v
            for k, v in self_with_htlcs.items()
        }

    @classmethod
    def from_json(cls: type[HoldInvoiceType], json_str: str) -> HoldInvoiceType:
        json_str = json_str.removeprefix("\\")

        if json_str.endswith("\\}"):
            json_str = json_str.removesuffix("\\}") + "}"

        json_dict = json.loads(json_str)
        json_dict["created_at"] = datetime.fromtimestamp(
            json_dict["created_at"], tz=timezone.utc
        )

        if "amount_msat" not in json_dict:
            json_dict["amount_msat"] = bolt11.decode(json_dict["bolt11"]).amount_msat

        json_dict["htlcs"] = (
            Htlcs.from_json_arr(json_dict["htlcs"]) if "htlcs" in json_dict else []
        )

        return cls(**json_dict)
