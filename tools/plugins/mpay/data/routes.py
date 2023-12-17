from collections import defaultdict
from typing import Any

import pandas as pd
from pyln.client import Plugin
from sqlalchemy.orm import Session

from plugins.mpay.data.reset import RemovedEntries, Reset
from plugins.mpay.data.route_stats import RouteStats, RouteStatsFetcher
from plugins.mpay.db.db import Database
from plugins.mpay.db.models import Attempt, Hop, Payment
from plugins.mpay.pay.excludes import ExcludesPayment
from plugins.mpay.pay.route import Route
from plugins.mpay.pay.sendpay import PaymentError

_ROUTE_SEPERATOR = "-"


def _hop_from_route(attempt: Attempt, hop: dict[str, Any], ok: bool) -> Hop:
    return Hop(
        attempt_id=attempt.id,
        node=hop["id"],
        channel=hop["channel"],
        direction=hop["direction"],
        ok=ok,
    )


class Routes:
    _pl: Plugin
    _db: Database
    _reset: Reset
    _fetcher: RouteStatsFetcher

    _routes: dict[str, RouteStats]
    _routes_for_node: defaultdict[str, list[RouteStats]]

    def __init__(self, pl: Plugin, db: Database) -> None:
        self._pl = pl
        self._db = db
        self._reset = Reset(pl)
        self._fetcher = RouteStatsFetcher()

        self._routes = {}
        self._routes_for_node = defaultdict(list)

    def fetch_from_db(self) -> None:
        self._pl.log("Fetching routes from database")
        with Session(self._db.engine) as s:
            routes = self._fetcher.get_routes(s)
            self._pl.log(f"Found {len(routes)} routes")

        for route in routes:
            self._index_route(route)

    def reset(self) -> RemovedEntries:
        self._routes.clear()
        self._routes_for_node.clear()

        with Session(self._db.engine) as s:
            return self._reset.reset_all(s)

    def get_destinations(self) -> list[str]:
        return list(self._routes_for_node.keys())

    def get_routes(
        self,
        destination: str,
        min_success: float = 0,
        min_success_ema: float = 0,
        excludes: ExcludesPayment | None = None,
    ) -> list[RouteStats]:
        routes = self._routes_for_node[destination]

        return sorted(
            [
                route
                for route in routes
                if route.success_rate >= min_success
                and route.success_rate_ema >= min_success_ema
                and (excludes is None or all(hop not in excludes for hop in route.route))
            ],
            key=lambda x: x.success_rate,
            reverse=True,
        )

    def insert_successful_attempt(
        self, session: Session, payment: Payment, route: Route, time: int
    ) -> None:
        payment.ok = True
        self._append_attempt(route, payment.ok)

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
        self, session: Session, payment: Payment, route: Route, error: PaymentError
    ) -> None:
        # If there is a permanent error at the last hop, we got the HTLC through successfully
        if error.is_permanent and error.erring_index == len(route):
            self.insert_successful_attempt(session, payment, route, error.time)
            return

        payment.ok = False
        self._append_attempt(route, payment.ok)

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

    def _append_attempt(self, route: Route, success: bool) -> None:
        hops = [f"{hop['channel']}/{hop['direction']}" for hop in route.route]
        route_id = _ROUTE_SEPERATOR.join(hops)

        if route_id in self._routes:
            stats = self._routes[route_id]
            stats.add_attempt(success)

        else:
            stats = RouteStats(
                hops, [hop["id"] for hop in route.route], pd.DataFrame({"ok": [success]})
            )
            self._index_route(stats)

    def _index_route(self, route: RouteStats) -> None:
        self._routes[_ROUTE_SEPERATOR.join(route.route)] = route

        # TODO: partial routes
        self._routes_for_node[route.nodes[-1]].append(route)
