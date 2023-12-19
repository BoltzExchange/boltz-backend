from pandas import DataFrame, Series
from plugins.mpay.db.models import Attempt, Hop
from sqlalchemy import String, func, select
from sqlalchemy.orm import Session

EMA_ALPHA = 0.4
HOP_SEPERATOR = "/"

ROUTE_SEPERATOR = "-"


class NotInRouteError(Exception):
    pass


class RouteStats:
    id: str
    route: list[str]

    nodes: list[str]

    success_rate: float
    success_rate_ema: float

    _attempts: DataFrame

    def __init__(self, route: list[str], nodes: list[str]) -> None:
        self.route = route
        self.id = ROUTE_SEPERATOR.join(self.route)

        self.nodes = nodes

        self._attempts = DataFrame(columns=["attempt_id", "ok"])

    def __str__(self) -> str:
        """Pretty print the route with statistics."""
        return f"{' -> '.join(self.route)} {self.pretty_statistics}"

    @property
    def pretty_statistics(self) -> str:
        return (
            f"(success_rate: {round(self.success_rate, 4)}, "
            f"success_rate_ema: {round(self.success_rate_ema, 4)})"
        )

    def slice_for_destination(self, destination: str) -> "RouteStats":
        destination_index = self.destination_index(destination)

        sliced = RouteStats(self.route[:destination_index], self.nodes[:destination_index])
        sliced._attempts = (  # noqa: SLF001
            self._attempts.groupby(["attempt_id"])
            .apply(lambda x: x[:destination_index])
            .reset_index(drop=True)
        )
        sliced.calculate_rates()

        return sliced

    def add_attempt(self, attempt_id: int, oks: list[bool], no_recalculate: bool = False) -> None:
        if len(oks) != len(self.route):
            msg = "length of oks does not match length of route"
            raise ValueError(msg)

        for ok in oks:
            self._attempts.loc[len(self._attempts)] = [attempt_id, ok]

        if not no_recalculate:
            self.calculate_rates()

    def calculate_rates(self) -> None:
        def to_group(attempt: DataFrame) -> Series:
            return Series(
                {
                    "ok": not attempt.query("ok == False").shape[0] > 0,
                }
            )

        groups = self._attempts.groupby(["attempt_id"]).apply(to_group)

        self.success_rate = (groups["ok"] == True).mean()  # noqa: E712
        self.success_rate_ema = groups["ok"].ewm(alpha=EMA_ALPHA).mean().iloc[-1]

    def destination_index(self, destination: str) -> int:
        try:
            return self.nodes.index(destination) + 1
        except ValueError:
            raise NotInRouteError from None


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
                )
                routes[route_id] = stats
            else:
                stats = routes[route_id]

            stats.add_attempt(attempt_id, route["ok"].values, True)

        for route in routes.values():
            route.calculate_rates()

        return list(routes.values())
