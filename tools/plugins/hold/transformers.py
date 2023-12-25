from typing import Any

from bolt11.models.routehint import Route, RouteHint

from plugins.hold import router
from plugins.hold.enums import HtlcState, InvoiceState
from plugins.hold.invoice import HoldInvoice, Htlc
from plugins.hold.protos.hold_pb2 import (
    HTLC_ACCEPTED,
    HTLC_CANCELLED,
    HTLC_SETTLED,
    INVOICE_ACCEPTED,
    INVOICE_CANCELLED,
    INVOICE_PAID,
    INVOICE_UNPAID,
    GetRouteResponse,
    Hop,
    Invoice,
    PayStatusResponse,
    RoutingHint,
    RoutingHintsResponse,
)
from plugins.hold.protos.hold_pb2 import (
    Htlc as HtlcGrpc,
)
from plugins.hold.utils import parse_time

INVOICE_STATE_TO_GRPC = {
    InvoiceState.Paid: INVOICE_PAID,
    InvoiceState.Unpaid: INVOICE_UNPAID,
    InvoiceState.Accepted: INVOICE_ACCEPTED,
    InvoiceState.Cancelled: INVOICE_CANCELLED,
}

HTLC_STATE_TO_GRPC = {
    HtlcState.Paid: HTLC_SETTLED,
    HtlcState.Accepted: HTLC_ACCEPTED,
    HtlcState.Cancelled: HTLC_CANCELLED,
}

PAY_STATUS_STATE_TO_GRPC = {
    "pending": PayStatusResponse.PayStatus.Attempt.AttemptState.ATTEMPT_PENDING,
    "completed": PayStatusResponse.PayStatus.Attempt.AttemptState.ATTEMPT_COMPLETED,
}


class Transformers:
    @staticmethod
    def invoice_to_grpc(invoice: HoldInvoice) -> Invoice:
        return Invoice(
            payment_hash=invoice.payment_hash,
            payment_preimage=invoice.payment_preimage,
            state=INVOICE_STATE_TO_GRPC[invoice.state],
            bolt11=invoice.bolt11,
            amount_msat=invoice.amount_msat,
            created_at=int(invoice.created_at.timestamp()),
            htlcs=[Transformers.htlc_to_grpc(htlc) for htlc in invoice.htlcs.htlcs],
        )

    @staticmethod
    def htlc_to_grpc(htlc: Htlc) -> HtlcGrpc:
        return HtlcGrpc(
            state=HTLC_STATE_TO_GRPC[htlc.state],
            msat=htlc.msat,
            created_at=int(htlc.created_at.timestamp()),
            short_channel_id=htlc.short_channel_id,
            id=htlc.channel_id,
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
        return RouteHint(routes=[Transformers.hop_from_json(hop) for hop in hint["routes"]])

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
    def pay_status_response_to_grpc(res: dict[str, Any]) -> PayStatusResponse:
        return PayStatusResponse(
            status=[
                PayStatusResponse.PayStatus(
                    bolt11=status["bolt11"],
                    amount_msat=int(status["amount_msat"]),
                    destination=status["destination"],
                    attempts=[
                        Transformers.pay_status_attempt_to_grpc(attempt)
                        for attempt in status["attempts"]
                    ],
                )
                for status in res["pay"]
            ]
        )

    @staticmethod
    def pay_status_attempt_to_grpc(res: dict[str, Any]) -> PayStatusResponse.PayStatus.Attempt:
        def transform_failure_data(
            failure_data: dict[str, Any],
        ) -> PayStatusResponse.PayStatus.Attempt.Failure.Data:
            return PayStatusResponse.PayStatus.Attempt.Failure.Data(
                id=failure_data["id"],
                raw_message=failure_data["raw_message"],
                fail_code=failure_data["failcode"],
                fail_codename=failure_data["failcodename"],
                erring_index=failure_data["erring_index"],
                erring_node=failure_data["erring_node"],
            )

        def transform_failure(
            failure: dict[str, Any],
        ) -> PayStatusResponse.PayStatus.Attempt.Failure:
            return PayStatusResponse.PayStatus.Attempt.Failure(
                message=failure["message"],
                code=failure["code"],
                data=transform_failure_data(failure["data"]) if "data" in failure else None,
            )

        attempt = PayStatusResponse.PayStatus.Attempt(
            strategy=res["strategy"] if "strategy" in res else "",
            start_time=parse_time(res["start_time"]),
            age_in_seconds=res["age_in_seconds"],
            state=PAY_STATUS_STATE_TO_GRPC[res["state"]],
            success=PayStatusResponse.PayStatus.Attempt.Success(
                id=res["success"]["id"],
                payment_preimage=res["success"]["payment_preimage"],
            )
            if "success" in res
            else None,
            failure=transform_failure(res["failure"]) if "failure" in res else None,
        )

        if "end_time" in res:
            attempt.end_time = parse_time(res["end_time"])

        return attempt

    @staticmethod
    def route_to_grpc(route: list[router.Hop]) -> list[GetRouteResponse.Hop]:
        return [
            GetRouteResponse.Hop(
                id=hop.node_id,
                channel=hop.channel,
                direction=hop.direction,
                amount_msat=hop.amount_msat,
                delay=hop.delay,
                style=hop.style,
            )
            for hop in route
        ]

    @staticmethod
    def named_tuples_to_dict(val: object) -> object:
        if isinstance(val, list):
            return [Transformers.named_tuples_to_dict(entry) for entry in val]

        if isinstance(val, tuple) and hasattr(val, "_asdict"):
            # noinspection PyProtectedMember
            return Transformers.named_tuples_to_dict(val._asdict())

        if isinstance(val, dict):
            return {key: Transformers.named_tuples_to_dict(value) for key, value in val.items()}

        return val
