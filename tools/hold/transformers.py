from typing import Any

from bolt11.models.routehint import Route, RouteHint
from datastore import HoldInvoiceHtlcs
from invoice import InvoiceState
from protos.hold_pb2 import (
    INVOICE_ACCEPTED,
    INVOICE_CANCELLED,
    INVOICE_PAID,
    INVOICE_UNPAID,
    Hop,
    HtlcState,
    Invoice,
    RoutingHint,
    RoutingHintsResponse,
)
from protos.hold_pb2 import (
    Htlc as HtlcGrpc,
)
from settler import Htlc

INVOICE_STATE_TO_GRPC = {
    InvoiceState.Paid: INVOICE_PAID,
    InvoiceState.Unpaid: INVOICE_UNPAID,
    InvoiceState.Accepted: INVOICE_ACCEPTED,
    InvoiceState.Cancelled: INVOICE_CANCELLED,
}


class Transformers:
    @staticmethod
    def invoice_to_grpc(invoice: HoldInvoiceHtlcs) -> Invoice:
        return Invoice(
            payment_hash=invoice.invoice.payment_hash,
            payment_preimage=invoice.invoice.payment_preimage,
            state=INVOICE_STATE_TO_GRPC[invoice.invoice.state],
            bolt11=invoice.invoice.bolt11,
            htlcs=[Transformers.htlc_to_grpc(htlc) for htlc in invoice.htlcs],
        )

    @staticmethod
    def htlc_to_grpc(htlc: Htlc) -> HtlcGrpc:
        return HtlcGrpc(
            state=HtlcState.HTLC_ACCEPTED,
            msat=htlc.msat,
            creation_time=int(htlc.creation_time.timestamp()),
        )

    @staticmethod
    def routing_hints_to_grpc(hints: list[RouteHint]) -> RoutingHintsResponse:
        return RoutingHintsResponse(
            hints=[Transformers.routing_hint_to_grpc(hint) for hint in hints]
        )

    @staticmethod
    def routing_hint_to_grpc(hint: RouteHint) -> RoutingHint:
        return RoutingHint(hops=[Transformers.hop_to_grpc(hop) for hop in hint.routes])

    @staticmethod
    def hop_to_grpc(hop: Route) -> Hop:
        return Hop(
            public_key=hop.public_key,
            short_channel_id=hop.short_channel_id,
            base_fee=hop.base_fee,
            ppm_fee=hop.ppm_fee,
            cltv_expiry_delta=hop.cltv_expiry_delta,
        )

    @staticmethod
    def routing_hints_from_grpc(hints: list[RoutingHint]) -> list[RouteHint]:
        return [Transformers.routing_hint_from_grpc(hint) for hint in hints]

    @staticmethod
    def routing_hint_from_grpc(hint: RoutingHint) -> RouteHint:
        return RouteHint(routes=[Transformers.hop_from_grpc(hop) for hop in hint.hops])

    @staticmethod
    def hop_from_grpc(hop: Hop) -> Route:
        return Route(
            public_key=hop.public_key,
            short_channel_id=hop.short_channel_id,
            base_fee=hop.base_fee,
            ppm_fee=hop.ppm_fee,
            cltv_expiry_delta=hop.cltv_expiry_delta,
        )

    @staticmethod
    def routing_hints_from_json(hints: list[Any]) -> list[RouteHint]:
        return [Transformers.routing_hint_from_json(hint) for hint in hints]

    @staticmethod
    def routing_hint_from_json(hint: dict[str, Any]) -> RouteHint:
        return RouteHint(
            routes=[Transformers.hop_from_json(hop) for hop in hint["routes"]]
        )

    @staticmethod
    def hop_from_json(hop: dict[str, str | int]) -> Route:
        return Route(
            public_key=hop["public_key"],
            short_channel_id=hop["short_channel_id"],
            base_fee=hop["base_fee"],
            ppm_fee=hop["ppm_fee"],
            cltv_expiry_delta=hop["cltv_expiry_delta"],
        )

    @staticmethod
    def named_tuples_to_dict(val: object) -> object:
        if isinstance(val, list):
            return [Transformers.named_tuples_to_dict(entry) for entry in val]

        if isinstance(val, tuple) and hasattr(val, "_asdict"):
            # noinspection PyProtectedMember
            return Transformers.named_tuples_to_dict(val._asdict())

        if isinstance(val, dict):
            return {
                key: Transformers.named_tuples_to_dict(value)
                for key, value in val.items()
            }

        return val
