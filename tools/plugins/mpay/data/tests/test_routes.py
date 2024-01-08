import time
from typing import Callable
from unittest.mock import MagicMock

import pytest
from sqlalchemy import select
from sqlalchemy.orm import Session

from plugins.mpay.data.routes import Routes, RoutesFetchingError
from plugins.mpay.data.tests.test_route_stats import SQLITE_MEMORY_PATH, setup_db
from plugins.mpay.db.db import Database
from plugins.mpay.db.models import Attempt, Hop, Payment
from plugins.mpay.pay.excludes import Excludes, ExcludesPayment
from plugins.mpay.pay.route import Fees, Route
from plugins.mpay.pay.sendpay import PERMANENT_ERRORS, PaymentError


class TestRoutes:
    pl = MagicMock()
    db = Database(pl)
    db.connect(SQLITE_MEMORY_PATH)

    @pytest.fixture(scope="class", autouse=True)
    def _before_all(self) -> None:
        setup_db(self.db)

    @pytest.fixture(scope="class", autouse=True)
    def routes(self) -> Routes:
        return Routes(self.pl, self.db)

    @pytest.mark.parametrize(
        "method", [Routes(pl, db).reset, Routes(pl, db).get_destinations, Routes(pl, db).get_routes]
    )
    def test_throw_when_not_initialized(self, method: Callable) -> None:
        with pytest.raises(RoutesFetchingError):
            method()

    def test_fetch_from_db(self, routes: Routes) -> None:
        assert routes._is_fetching  # noqa: SLF001
        routes.fetch_from_db()
        assert not routes._is_fetching  # noqa: SLF001

        assert len(routes._routes) > 0  # noqa: SLF001
        assert len(routes._routes_for_node) > 0  # noqa: SLF001

    def test_get_destinations(self, routes: Routes) -> None:
        routes.fetch_from_db()
        assert (
            routes.get_destinations().sort()
            == [
                "03aab7e9327716ee946b8fbfae039b0db85356549e72c5cca113ea67893d0821e5",
                "0294774ee02a9faa5a5870061f7f4833686184ad14a0b163c49442516c9edac1db",
            ].sort()
        )

    def test_get_routes(self, routes: Routes) -> None:
        routes.fetch_from_db()

        destination = "03aab7e9327716ee946b8fbfae039b0db85356549e72c5cca113ea67893d0821e5"
        fetched = routes.get_routes(
            destination=destination,
        )

        assert len(fetched) == 3
        assert all(route.nodes[-1] == destination for route in fetched)

    def test_get_routes_min_success(self, routes: Routes) -> None:
        routes.fetch_from_db()

        destination = "03aab7e9327716ee946b8fbfae039b0db85356549e72c5cca113ea67893d0821e5"
        min_success = 0.5

        fetched = routes.get_routes(
            destination=destination,
            min_success=min_success,
        )

        assert len(fetched) == 2
        assert all(route.success_rate >= min_success for route in fetched)

    def test_get_routes_min_success_ema(self, routes: Routes) -> None:
        routes.fetch_from_db()

        destination = "03aab7e9327716ee946b8fbfae039b0db85356549e72c5cca113ea67893d0821e5"
        min_success_ema = 0.6

        fetched = routes.get_routes(
            destination=destination,
            min_success_ema=min_success_ema,
        )

        assert len(fetched) == 1
        assert all(route.success_rate_ema >= min_success_ema for route in fetched)

    def test_get_routes_excludes(self, routes: Routes) -> None:
        routes.fetch_from_db()

        destination = "03aab7e9327716ee946b8fbfae039b0db85356549e72c5cca113ea67893d0821e5"
        excludes = ExcludesPayment(Excludes())
        excludes.add_local("809469x300x4/0")
        excludes.add_local("783038x1808x1/0")

        fetched = routes.get_routes(destination=destination, excludes=excludes)

        assert len(fetched) == 1
        assert all(hop not in excludes for hop in fetched[0].route)

    def test_insert_successful_attempt(self, routes: Routes) -> None:
        payment = Payment(
            destination="Carol",
            payment_hash="4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b",
            amount=1,
        )
        route = Route(
            [
                {"id": "Alice", "channel": "a", "direction": 1},
                {"id": "Bob", "channel": "b", "direction": 0},
                {"id": "Carol", "channel": "c", "direction": 1},
            ],
            [Fees(0, 0), Fees(0, 0), Fees(0, 0)],
        )
        duration = 10

        session = Session(self.db.engine)
        session.add(payment)
        session.commit()

        routes.insert_successful_attempt(session, payment, route, duration)

        fetched_payments = session.execute(
            select(Payment).where(Payment.payment_hash == payment.payment_hash)
        ).fetchall()
        assert len(fetched_payments) == 1
        assert fetched_payments[0][0].ok

        fetched_attempts = session.execute(
            select(Attempt).where(Attempt.payment_id == payment.id)
        ).fetchall()
        assert len(fetched_attempts) == 1

        fetched_attempt = fetched_attempts[0][0]
        assert fetched_attempt.payment_id == payment.id
        assert fetched_attempt.ok
        assert fetched_attempt.time == duration

        fetched_hops = session.execute(
            select(Hop).where(Hop.attempt_id == fetched_attempt.id)
        ).fetchall()
        assert len(fetched_hops) == 3

        for hop in zip([hop[0] for hop in fetched_hops], route.route):
            assert hop[0].node == hop[1]["id"]
            assert hop[0].channel == hop[1]["channel"]
            assert hop[0].direction == hop[1]["direction"]
            assert hop[0].ok

        session.close()

        assert len(routes.get_routes(payment.destination)) == 1
        assert routes.get_routes(payment.destination)[0].success_rate == 1.0

        assert len(routes.get_routes(route.route[0]["id"])) == 0
        assert len(routes.get_routes(route.route[1]["id"])) == 1

    def test_insert_failed_payment(self, routes: Routes) -> None:
        payment = Payment(
            destination="Carol",
            payment_hash="0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098",
            amount=1,
        )
        route = Route(
            [
                {"id": "Alice", "channel": "a", "direction": 1},
                {"id": "Bob", "channel": "b", "direction": 0},
                {"id": "Carol", "channel": "c", "direction": 1},
            ],
            [Fees(0, 0), Fees(0, 0), Fees(0, 0)],
        )
        duration = 11
        error = PaymentError(
            {
                "data": {
                    "failcodename": "UNKNOWN_ERROR",
                    "erring_node": route[1]["id"],
                    "erring_index": 1,
                    "erring_channel": route[1]["channel"],
                    "erring_direction": route[1]["direction"],
                    "created_at": int(time.time() - duration),
                }
            }
        )

        session = Session(self.db.engine)
        session.add(payment)
        session.commit()

        routes.insert_failed_attempt(session, payment, route, error)

        fetched_payments = session.execute(
            select(Payment).where(Payment.payment_hash == payment.payment_hash)
        ).fetchall()
        assert len(fetched_payments) == 1
        assert not fetched_payments[0][0].ok

        fetched_attempts = session.execute(
            select(Attempt).where(Attempt.payment_id == payment.id)
        ).fetchall()
        assert len(fetched_attempts) == 1

        fetched_attempt = fetched_attempts[0][0]
        assert fetched_attempt.payment_id == payment.id
        assert not fetched_attempt.ok
        assert fetched_attempt.time == duration

        fetched_hops = session.execute(
            select(Hop).where(Hop.attempt_id == fetched_attempt.id)
        ).fetchall()
        assert len(fetched_hops) == 3

        for i, hop in enumerate(zip([hop[0] for hop in fetched_hops], route.route)):
            assert hop[0].node == hop[1]["id"]
            assert hop[0].channel == hop[1]["channel"]
            assert hop[0].direction == hop[1]["direction"]
            assert hop[0].ok if i < 1 else not hop[0].ok

        session.close()

        assert len(routes.get_routes(payment.destination)) == 1
        assert routes.get_routes(payment.destination)[0].success_rate == 0.5

    def test_insert_failed_payment_last_hop_permanent(self, routes: Routes) -> None:
        payment = Payment(
            destination="Carol",
            payment_hash="0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098",
            amount=1,
        )
        route = Route(
            [
                {"id": "Alice", "channel": "a", "direction": 1},
                {"id": "Bob", "channel": "b", "direction": 0},
                {"id": "Carol", "channel": "c", "direction": 1},
            ],
            [Fees(0, 0), Fees(0, 0), Fees(0, 0)],
        )
        error = PaymentError(
            {
                "data": {
                    "failcodename": PERMANENT_ERRORS[0],
                    "erring_node": route[1]["id"],
                    "erring_index": 3,
                    "erring_channel": route[1]["channel"],
                    "erring_direction": route[1]["direction"],
                    "created_at": int(time.time()),
                }
            }
        )

        session = Session(self.db.engine)
        session.add(payment)
        session.commit()

        routes.insert_failed_attempt(session, payment, route, error)

        assert len(routes.get_routes(payment.destination)) == 1
        assert routes.get_routes(payment.destination)[0].success_rate == 0.6666666666666666

    def test_reset(self, routes: Routes) -> None:
        routes.fetch_from_db()
        routes.reset()

        assert len(routes._routes) == 0  # noqa: SLF001
        assert len(routes._routes_for_node) == 0  # noqa: SLF001
