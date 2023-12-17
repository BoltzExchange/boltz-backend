from dataclasses import dataclass
from typing import Hashable

from pandas import DataFrame, Series
from pandas.core.groupby import DataFrameGroupBy
from sqlalchemy import String, func, select
from sqlalchemy.orm import Session

from plugins.mpay.db.models import Attempt, Hop

EMA_ALPHA = 0.4
HOP_SEPERATOR = "/"

_ROUTE_SEPERATOR = "-"


@dataclass
class RouteStats:
    route: list[str]
    nodes: list[str]
    _attempts: DataFrame

    @staticmethod
    def from_dataframe(route_tuple: tuple[Hashable, DataFrame]) -> "RouteStats":
        route = route_tuple[1]
        return RouteStats(
            route.iloc[0]["route"].split(_ROUTE_SEPERATOR),
            route.iloc[0]["nodes"].split(_ROUTE_SEPERATOR),
            route["ok"].reset_index().drop(columns=["id"]),
        )

    @property
    def success_rate(self) -> float:
        return (self._attempts["ok"] == True).mean()  # noqa: E712

    @property
    def success_rate_ema(self) -> float:
        return self._attempts["ok"].ewm(alpha=EMA_ALPHA).mean().iloc[-1]

    @property
    def pretty_statistics(self) -> str:
        return (
            f"(success_rate: {round(self.success_rate, 4)}, "
            f"success_rate_ema: {round(self.success_rate_ema, 4)})"
        )

    def add_attempt(self, success: bool) -> None:
        self._attempts.loc[len(self._attempts)] = [success]

    def __str__(self) -> str:
        """Pretty print the route with statistics."""
        return f"{' -> '.join(self.route)} {self.pretty_statistics}"


class RouteStatsFetcher:
    def get_routes(
        self,
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

        route_stats = self._hops_to_route_stats(hops)
        return [RouteStats.from_dataframe(route) for route in route_stats]

    @staticmethod
    def _hops_to_route_stats(hops: DataFrame) -> DataFrameGroupBy:
        def hop_to_route(group: DataFrame) -> Series:
            return Series(
                {
                    "route": _ROUTE_SEPERATOR.join(group["channel"].values),
                    "nodes": _ROUTE_SEPERATOR.join(group["node"].values),
                    "ok": not group.query("ok == False").shape[0] > 0,
                    "created_at": group.iloc[0, group.columns.get_loc("created_at")],
                }
            )

        return hops.groupby(["id"]).apply(hop_to_route).groupby(["route"])
