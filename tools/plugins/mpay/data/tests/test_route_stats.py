from unittest.mock import MagicMock

from plugins.mpay.data.route_stats import RouteStatsFetcher
from plugins.mpay.db.db import Database


class TestRouter:
    pl = MagicMock()
    db = Database(pl)
    db.connect(
        "127.0.0.1",
        5432,
        "mpay_testnet",
        "boltz",
        "boltz",
    )
    fetcher = RouteStatsFetcher(pl, db)

    def test_get_destinations(self) -> None:
        print()
        print(self.fetcher.get_destinations())

    def test_get_route(self) -> None:
        print()
        print(
            self.fetcher.get_routes(
                "020ec0c6a0c4fe5d8a79928ead294c36234a76f6e0dca896c35413612a3fd8dbf8",
            )
        )
