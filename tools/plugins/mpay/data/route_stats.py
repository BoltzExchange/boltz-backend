from dataclasses import dataclass
from typing import Hashable

import pandas as pd
from sqlalchemy import String, distinct, func, select
from sqlalchemy.orm import Session

from plugins.mpay.db.db import Database
from plugins.mpay.db.models import Attempt, Hop, Payment

EMA_ALPHA = 0.4
HOP_SEPERATOR = "/"

_ROUTE_SEPERATOR = "-"


@dataclass
class RouteStats:
    route: list[str]
    success_rate: float
    success_rate_ema: float

    @staticmethod
    def from_dataframe(route: str, success_rate: float, success_rate_ema: float) -> "RouteStats":
        return RouteStats(route.split(_ROUTE_SEPERATOR), success_rate, success_rate_ema)

    @property
    def pretty_statistics(self) -> str:
        return (
            f"(success_rate: {round(self.success_rate, 4)}, "
            f"success_rate_ema: {round(self.success_rate_ema, 4)})"
        )

    def __str__(self) -> str:
        """Pretty print the route with statistics."""
        return f"{' -> '.join(self.route)} {self.pretty_statistics}"


class RouteStatsFetcher:
    _db: Database

    def __init__(self, db: Database) -> None:
        self._db = db

    @staticmethod
    def get_destinations(s: Session) -> list[str]:
        return [row[0] for row in s.execute(select(distinct(Hop.node)))]

    def get_routes(
        self,
        s: Session,
        destination: str | None,
        min_success_rate: float = 0,
        min_success_rate_ema: float = 0,
    ) -> list[RouteStats]:
        attempts = [
            row[0] for row in s.execute(select(Hop.attempt_id).where(Hop.node == destination))
        ]
        if len(attempts) == 0:
            return []

        res = s.execute(
            select(
                Attempt.id,
                Hop.node,
                (Hop.channel + HOP_SEPERATOR + func.Cast(Hop.direction, String)).label("channel"),
                Hop.ok,
                Attempt.created_at,
            )
            .join(Payment.attempts)
            .join(Attempt.hops)
            .where(Attempt.id.in_(attempts))
            .order_by(Attempt.id, Hop.id)
        )
        hops = pd.DataFrame(res.fetchall(), columns=list(res.keys()))

        if hops.empty:
            return []

        hops = self._exclude_post_destination(destination, hops)

        route_stats = self._hops_to_route_stats(hops)
        route_stats = route_stats[
            (route_stats["success_rate"] >= min_success_rate)
            & (route_stats["success_rate_ema"] >= min_success_rate_ema)
        ]

        return [RouteStats.from_dataframe(*row) for row in route_stats.to_numpy()]

    @staticmethod
    def _exclude_post_destination(destination: str, hops: pd.DataFrame) -> pd.DataFrame:
        def exclude_post(arg: tuple[Hashable, pd.DataFrame]) -> pd.DataFrame:
            group = arg[1]

            if group["node"].iloc[-1] == destination:
                return group

            group = group.reset_index()
            return group[: group.loc[destination == group["node"]].index[0] + 1]

        return pd.concat([exclude_post(group) for group in hops.groupby(["id"])])

    @staticmethod
    def _hops_to_route_stats(hops: pd.DataFrame) -> pd.DataFrame:
        def hop_to_route(group: pd.DataFrame) -> pd.Series:
            return pd.Series(
                {
                    "route": _ROUTE_SEPERATOR.join(group["channel"].values),
                    "ok": not group.query("ok == False").shape[0] > 0,
                    "created_at": group.iloc[0, group.columns.get_loc("created_at")],
                }
            )

        def route_to_route_stats(group: pd.DataFrame) -> pd.Series:
            return pd.Series(
                {
                    "success_rate": (group["ok"] == True).mean(),  # noqa: E712
                    "success_rate_ema": group["ok"].ewm(alpha=EMA_ALPHA).mean().iloc[-1],
                }
            )

        return (
            hops.groupby(["id"])
            .apply(hop_to_route)
            .groupby(["route"])
            .apply(route_to_route_stats)
            .sort_values(by="success_rate", ascending=False)
            .reset_index()
        )
