from typing import Any

from sqlalchemy.orm import Session

from plugins.mpay.db.models import Attempt, Hop, Payment
from plugins.mpay.pay.route import Route
from plugins.mpay.pay.sendpay import PaymentError


def _hop_from_route(attempt: Attempt, hop: dict[str, Any], ok: bool) -> Hop:
    return Hop(
        attempt_id=attempt.id,
        node=hop["id"],
        channel=hop["channel"],
        direction=hop["direction"],
        ok=ok,
    )


def insert_successful_attempt(session: Session, payment: Payment, route: Route, time: int) -> None:
    payment.ok = True

    attempt = Attempt(
        payment_id=payment.id,
        ok=True,
        time=time,
    )
    session.add(attempt)

    hops = [_hop_from_route(attempt, hop, True) for hop in route.route]

    for hop in hops:
        attempt.hops.append(hop)

    session.add_all(hops)
    session.commit()


def insert_failed_attempt(
    session: Session, payment: Payment, route: Route, error: PaymentError
) -> None:
    # If there is a permanent error at the last hop, we got the HTLC through successfully
    if error.is_permanent and error.erring_index == len(route):
        insert_successful_attempt(session, payment, route, error.time)
        return

    payment.ok = False

    attempt = Attempt(
        payment_id=payment.id,
        ok=False,
        time=error.time,
    )
    session.add(attempt)

    hops = [
        _hop_from_route(attempt, hop, index < error.erring_index)
        for index, hop in enumerate(route.route)
    ]

    for hop in hops:
        attempt.hops.append(hop)

    session.add_all(hops)
    session.commit()
