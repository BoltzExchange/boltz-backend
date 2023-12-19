from dataclasses import dataclass

from pandas import DataFrame, Series
from sqlalchemy import String, func, select
from sqlalchemy.orm import Session

from plugins.mpay.db.models import Attempt, Hop

EMA_ALPHA = 0.4
HOP_SEPERATOR = "/"

ROUTE_SEPERATOR = "-"


class NotInRouteError(Exception):
    pass


@dataclass
class RouteStats:
    route: list[str]
    nodes: list[str]
    _attempts: DataFrame

    def __str__(self) -> str:
        """Pretty print the route with statistics."""
        return f"{' -> '.join(self.route)} {self.pretty_statistics}"

    @property
    def id(self) -> str:
        return ROUTE_SEPERATOR.join(self.route)

    @property
    def success_rate(self) -> float:
        return (self._attempt_groups()["ok"] == True).mean()  # noqa: E712

    @property
    def success_rate_ema(self) -> float:
        return self._attempt_groups()["ok"].ewm(alpha=EMA_ALPHA).mean().iloc[-1]

    @property
    def pretty_statistics(self) -> str:
        return (
            f"(success_rate: {round(self.success_rate, 4)}, "
            f"success_rate_ema: {round(self.success_rate_ema, 4)})"
        )

    def slice_for_destination(self, destination: str) -> "RouteStats":
        try:
            destination_index = self.nodes.index(destination) + 1
        except ValueError:
            raise NotInRouteError from None

        attempts = (
            self._attempts.groupby(["attempt_id"])
            .apply(lambda x: x[:destination_index])
            .reset_index(drop=True)
        )

        return RouteStats(self.route[:destination_index], self.nodes[:destination_index], attempts)

    def add_attempt(self, attempt_id: int, oks: list[bool]) -> None:
        if len(oks) != len(self.route):
            msg = "length of oks does not match length of route"
            raise ValueError(msg)

        for ok in oks:
            self._attempts.loc[len(self._attempts)] = [attempt_id, ok]

    def _attempt_groups(self) -> DataFrame:
        def to_group(attempt: DataFrame) -> Series:
            return Series(
                {
                    "ok": not attempt.query("ok == False").shape[0] > 0,
                }
            )

        return self._attempts.groupby(["attempt_id"]).apply(to_group)


class RouteStatsFetcher:
    @staticmethod
    def get_routes(
        s: Session,
    ) -> list[RouteStats]:
        res = s.execute(
            select(
                Attempt.id,
                Hop.node,
                (Hop.channel + HOP_SEPERATOR + func.Cast(Hop.direction, String)).label("channel"),
                Hop.ok,
                Attempt.created_at,
            )
            .join(Attempt.hops)
            .order_by(Attempt.id, Hop.id)
        )
        hops = DataFrame(res.fetchall(), columns=list(res.keys()))

        if hops.empty:
            return []

        attempts = hops.groupby(["id"])

        routes: dict[str, RouteStats] = {}

        for attempt in attempts:
            attempt_id = attempt[0][0]
            route = attempt[1]
            route_id = ROUTE_SEPERATOR.join(route["channel"].values)

            if route_id not in routes:
                stats = RouteStats(
                    route["channel"].to_list(),
                    route["node"].to_list(),
                    DataFrame(columns=["attempt_id", "ok"]),
                )
                routes[route_id] = stats
            else:
                stats = routes[route_id]

            stats.add_attempt(attempt_id, route["ok"].values)

        return list(routes.values())
