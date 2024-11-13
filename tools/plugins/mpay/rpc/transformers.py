from typing import Any

from plugins.mpay.data.route_stats import RouteStats
from plugins.mpay.db.models import Attempt, Hop, Payment
from plugins.mpay.protos.mpay_pb2 import GetRoutesResponse, ListPaymentsResponse, PayStatusResponse
from plugins.mpay.utils import parse_time

PAY_STATUS_STATE_TO_GRPC = {
    "pending": PayStatusResponse.PayStatus.Attempt.AttemptState.ATTEMPT_PENDING,
    "completed": PayStatusResponse.PayStatus.Attempt.AttemptState.ATTEMPT_COMPLETED,
}


def routes_to_grpc(routes: list[RouteStats]) -> GetRoutesResponse.Routes:
    return GetRoutesResponse.Routes(routes=[route_to_grpc(route) for route in routes])


def route_to_grpc(route: RouteStats) -> GetRoutesResponse.Routes.Route:
    return GetRoutesResponse.Routes.Route(
        route=route.route,
        success_rate=route.success_rate,
        success_rate_ema=route.success_rate_ema,
    )


def payment_to_grpc(payment: Payment) -> ListPaymentsResponse.Payment:
    return ListPaymentsResponse.Payment(
        id=payment.id,
        destination=payment.destination,
        payment_hash=payment.payment_hash,
        amount=payment.amount,
        ok=payment.ok,
        attempts=[attempt_to_grpc(attempt) for attempt in payment.attempts],
        created_at=int(payment.created_at.timestamp()),
    )


def attempt_to_grpc(attempt: Attempt) -> ListPaymentsResponse.Payment.Attempt:
    return ListPaymentsResponse.Payment.Attempt(
        id=attempt.id,
        ok=attempt.ok,
        time=attempt.time,
        hops=[hop_to_grpc(hop) for hop in attempt.hops],
        created_at=int(attempt.created_at.timestamp()),
    )


def hop_to_grpc(hop: Hop) -> ListPaymentsResponse.Payment.Attempt.Hop:
    return ListPaymentsResponse.Payment.Attempt.Hop(
        id=hop.id,
        node=hop.node,
        channel=hop.channel,
        direction=hop.direction,
        ok=hop.ok,
    )


def pay_status_response_to_grpc(res: dict[str, Any]) -> PayStatusResponse:
    return PayStatusResponse(
        status=[
            PayStatusResponse.PayStatus(
                bolt11=status.get("bolt11", None),
                bolt12=status.get("bolt12", None),
                amount_msat=int(status["amount_msat"]),
                destination=status["destination"],
                attempts=[_pay_status_attempt_to_grpc(attempt) for attempt in status["attempts"]],
            )
            for status in res["pay"]
        ]
    )


def _pay_status_attempt_to_grpc(
    res: dict[str, Any],
) -> PayStatusResponse.PayStatus.Attempt:
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
        strategy=res.get("strategy", ""),
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
