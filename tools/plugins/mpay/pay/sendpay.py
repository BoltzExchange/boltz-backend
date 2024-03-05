import time
from dataclasses import dataclass
from typing import Any

from pyln.client import Millisatoshi, Plugin, RpcError

from plugins.mpay.pay.route import Route

PERMANENT_ERRORS = ["WIRE_INCORRECT_OR_UNKNOWN_PAYMENT_DETAILS"]

STATUS_COMPLETE = "complete"


@dataclass
class PaymentResult:
    destination: str

    payment_hash: str
    payment_preimage: str

    amount_msat: Millisatoshi
    amount_sent_msat: Millisatoshi

    parts: int
    status: str
    fee_msat: Millisatoshi

    time: int
    created_at: int

    def to_dict(self) -> dict[str, Any]:
        return {k: int(v) if isinstance(v, Millisatoshi) else v for k, v in self.__dict__.items()}


class PaymentError(ValueError):
    fail_code_name: str
    is_permanent: bool

    erring_node: str
    erring_index: int
    erring_channel: str
    erring_direction: int

    time: int

    def __init__(self, error: dict[str, Any]) -> None:
        data = error["data"]

        self.fail_code_name = data["failcodename"]
        self.is_permanent = self.fail_code_name in PERMANENT_ERRORS

        self.erring_node = data["erring_node"]
        self.erring_index = data["erring_index"]
        self.erring_channel = data["erring_channel"]
        self.erring_direction = data["erring_direction"]

        self.time = int(time.time()) - data["created_at"]

        super(ValueError, self).__init__(
            f"{'Permanent' if self.is_permanent else 'Temporary'} error {self.fail_code_name} "
            f"at node {self.erring_index} ({self.erring_node}) "
            f"in channel {self.erring_channel}/{self.erring_direction}"
        )


class PaymentHelper:
    _pl: Plugin

    def __init__(self, pl: Plugin) -> None:
        self._pl = pl

    def send(self, route: Route, bolt11: str, decoded: dict[str, Any]) -> PaymentResult:
        pay = self._pl.rpc.sendpay(
            bolt11=bolt11,
            route=route.route,
            payment_hash=decoded["payment_hash"],
            payment_secret=decoded["payment_secret"],
        )

        try:
            wait = self._pl.rpc.waitsendpay(pay["payment_hash"])

            created_at = wait["created_at"]
            amount_sent = wait["amount_sent_msat"]
            amount = wait["amount_msat"]

            return PaymentResult(
                destination=route.route[-1]["id"],
                payment_hash=pay["payment_hash"],
                payment_preimage=wait["payment_preimage"],
                status=STATUS_COMPLETE,
                amount_msat=Millisatoshi(amount),
                amount_sent_msat=Millisatoshi(amount_sent),
                fee_msat=Millisatoshi(amount_sent - amount),
                parts=1,
                created_at=created_at,
                time=wait["completed_at"] - created_at,
            )
        except RpcError as e:
            raise PaymentError(e.error) from None
