from plugins.mpay.data.route_stats import RouteStats
from plugins.mpay.db.models import Attempt, Hop, Payment
from plugins.mpay.protos.mpay_pb2 import GetRoutesResponse, ListPaymentsResponse


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
