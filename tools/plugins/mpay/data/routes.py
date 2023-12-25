from __future__ import annotations

import functools
import time
from collections import defaultdict
from typing import TYPE_CHECKING, Any, Callable, TypeVar

from sqlalchemy.orm import Session

from plugins.mpay.data.reset import RemovedEntries, Reset
from plugins.mpay.data.route_stats import ROUTE_SEPERATOR, RouteStats, RouteStatsFetcher
from plugins.mpay.db.models import Attempt, Hop, Payment

if TYPE_CHECKING:
    from pyln.client import Plugin

    from plugins.mpay.db.db import Database
    from plugins.mpay.pay.excludes import ExcludesPayment
    from plugins.mpay.pay.route import Route
    from plugins.mpay.pay.sendpay import PaymentError


class RoutesFetchingError(Exception):
    def __init__(self) -> None:
        super().__init__("Routes are still fetching")


R = TypeVar("R")


def _check_fetching(func: Callable[..., R]) -> Callable[..., R]:
    @functools.wraps(func)
    def wrapper(self: Routes, *args: tuple, **kwargs: dict[str, Any]) -> R:
        if self._is_fetching:
            raise RoutesFetchingError

        return func(self, *args, **kwargs)

    return wrapper


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

    _is_fetching: bool

    def __init__(self, pl: Plugin, db: Database) -> None:
        self._pl = pl
        self._db = db
        self._reset = Reset(pl)
        self._fetcher = RouteStatsFetcher()

        self._routes = {}
        self._routes_for_node = defaultdict(list)

        self._is_fetching = True

    def fetch_from_db(self) -> None:
        self._is_fetching = True
        self._pl.log("Fetching routes from database")
        start_time = time.time()

        with Session(self._db.engine) as s:
            routes = [route for route in self._fetcher.get_routes(s) if len(route.route) > 1]
            self._pl.log(f"Found {len(routes)} routes")

        for route in routes:
            self._index_route(route)

        self._is_fetching = False
        self._pl.log(f"Finished indexing routes in {(time.time() - start_time):.2f}s")

    @_check_fetching
    def reset(self) -> RemovedEntries:
        self._routes.clear()
        self._routes_for_node.clear()

        with Session(self._db.engine) as s:
            return self._reset.reset_all(s)

    @_check_fetching
    def get_destinations(self) -> list[str]:
        return list(self._routes_for_node.keys())

    @_check_fetching
    def get_routes(
        self,
        destination: str,
        min_success: float = 0,
        min_success_ema: float = 0,
        excludes: ExcludesPayment | None = None,
    ) -> list[RouteStats]:
        routes = self._routes_for_node[destination]

        routes_dict: dict[str, RouteStats] = {}
        for route in routes:
            if route.nodes[-1] != destination:
                continue

            routes_dict[route.id] = route

        for route in routes:
            if route.nodes[-1] == destination:
                continue

            sliced_id = ROUTE_SEPERATOR.join(route.route[: route.destination_index(destination)])
            if sliced_id not in routes_dict:
                sliced_route = route.slice_for_destination(destination)
                routes_dict[sliced_id] = sliced_route
                self._index_route(sliced_route)

        return sorted(
            [
                route
                for route in routes_dict.values()
                if route.success_rate >= min_success
                and route.success_rate_ema >= min_success_ema
                and (excludes is None or all(hop not in excludes for hop in route.route))
            ],
            key=lambda x: x.success_rate,
            reverse=True,
        )

    def insert_successful_attempt(
        self, session: Session, payment: Payment, route: Route, duration: int
    ) -> None:
        payment.ok = True

        attempt = Attempt(
            payment_id=payment.id,
            ok=True,
            time=duration,
        )
        session.add(attempt)

        hops = [_hop_from_route(attempt, hop, True) for hop in route.route]

        for hop in hops:
            attempt.hops.append(hop)

        session.add_all(hops)
        session.commit()

        self._append_attempt(route, attempt, hops)

    def insert_failed_attempt(
        self, session: Session, payment: Payment, route: Route, error: PaymentError
    ) -> None:
        # If there is a permanent error at the last hop, we got the HTLC through successfully
        if error.is_permanent and error.erring_index == len(route):
            self.insert_successful_attempt(session, payment, route, error.time)
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

        self._append_attempt(route, attempt, hops)

    def _append_attempt(self, route: Route, attempt: Attempt, hops: list[Hop]) -> None:
        oks = [hop.ok for hop in hops]

        for i in range(2, len(route.route) + 1):
            hops = [f"{hop['channel']}/{hop['direction']}" for hop in route.route[:i]]
            route_id = ROUTE_SEPERATOR.join(hops)

            if route_id in self._routes:
                stats = self._routes[route_id]
            else:
                stats = RouteStats(hops, [hop["id"] for hop in route.route[:i]])
                self._index_route(stats)

            stats.add_attempt(attempt.id, oks[:i])

    def _index_route(self, route: RouteStats) -> None:
        self._routes[route.id] = route

        for node in route.nodes[1:]:
            self._routes_for_node[node].append(route)
