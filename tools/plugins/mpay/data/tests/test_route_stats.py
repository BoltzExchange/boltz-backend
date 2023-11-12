# ruff: noqa: E501

from typing import ClassVar
from unittest.mock import MagicMock

import pytest
from sqlalchemy import text
from sqlalchemy.orm import Session

from plugins.mpay.data.route_stats import RouteStats, RouteStatsFetcher
from plugins.mpay.db.db import Database


class TestRouteStatsFetcher:
    pl = MagicMock()
    db = Database(pl)
    db.connect("sqlite+pysqlite://")

    stats = RouteStatsFetcher(db)

    destination = "03aab7e9327716ee946b8fbfae039b0db85356549e72c5cca113ea67893d0821e5"
    route_stats: ClassVar[list[RouteStats]] = [
        RouteStats(["814829x1702x7/0", "815007x921x1/0"], 1, 1),
        RouteStats(["809469x300x4/0", "797131x955x7/0"], 0.75, 0.5404411764705882),
        RouteStats(["814196x3317x2/0", "783038x1808x1/0"], 0, 0),
    ]

    @pytest.fixture(scope="class", autouse=True)
    def _before_all(self) -> None:
        with Session(self.db.engine) as e:
            for statement in [
                "INSERT INTO payments (id, destination, payment_hash, amount, ok) VALUES (61, '0294774ee02a9faa5a5870061f7f4833686184ad14a0b163c49442516c9edac1db', 'e2961acb1e203a452d456106124b574b5b8011a5350e883d494e297344015098', 1000000000, true);",
                "INSERT INTO payments (id, destination, payment_hash, amount, ok) VALUES (62, '0294774ee02a9faa5a5870061f7f4833686184ad14a0b163c49442516c9edac1db', 'bc4ac4addc32d095d1f54f834459e3e2f88cfec2f3c5dc092fd9bd4945fa80b8', 1000000000, true);",
                "INSERT INTO payments (id, destination, payment_hash, amount, ok) VALUES (63, '0294774ee02a9faa5a5870061f7f4833686184ad14a0b163c49442516c9edac1db', '37a7e19e7ceff635f8172a7615583c2b6863ccd9a574dae868c38343cde8389a', 1000000000, false);",
                "INSERT INTO payments (id, destination, payment_hash, amount, ok) VALUES (58, '0294774ee02a9faa5a5870061f7f4833686184ad14a0b163c49442516c9edac1db', 'e4396922dfb81776ff58ad3363677ab397a6985c7bc0de95494ea0211bceaa8d', 1000000000, true);",
                "INSERT INTO payments (id, destination, payment_hash, amount, ok) VALUES (59, '0294774ee02a9faa5a5870061f7f4833686184ad14a0b163c49442516c9edac1db', '52c8729f6e25161e66be75a4abbb0ecf4cd901bd7f4fb3b464f78dc8aa9b2c6e', 1000000000, true);",
                "INSERT INTO payments (id, destination, payment_hash, amount, ok) VALUES (60, '0294774ee02a9faa5a5870061f7f4833686184ad14a0b163c49442516c9edac1db', '1a64b1c042448041aa12e57f459fdfa7cc28f35f6a5a02fb3f54b81f4127ee99', 1000000000, true);",
                "INSERT INTO attempts (id, payment_id, ok, time) VALUES (181, 58, false, 3);",
                "INSERT INTO attempts (id, payment_id, ok, time) VALUES (182, 58, true, 5);",
                "INSERT INTO attempts (id, payment_id, ok, time) VALUES (183, 59, true, 3);",
                "INSERT INTO attempts (id, payment_id, ok, time) VALUES (184, 60, true, 2);",
                "INSERT INTO attempts (id, payment_id, ok, time) VALUES (185, 61, false, 2);",
                "INSERT INTO attempts (id, payment_id, ok, time) VALUES (186, 61, true, 2);",
                "INSERT INTO attempts (id, payment_id, ok, time) VALUES (187, 62, true, 2);",
                "INSERT INTO hops (id, attempt_id, node, channel, direction, ok) VALUES (544, 181, '033b63e4a9931dc151037acbce12f4f8968c86f5655cf102bbfa85a26bd4adc6d9', '814196x3317x2', 0, true);",
                "INSERT INTO hops (id, attempt_id, node, channel, direction, ok) VALUES (545, 181, '03aab7e9327716ee946b8fbfae039b0db85356549e72c5cca113ea67893d0821e5', '783038x1808x1', 0, false);",
                "INSERT INTO hops (id, attempt_id, node, channel, direction, ok) VALUES (546, 181, '0294774ee02a9faa5a5870061f7f4833686184ad14a0b163c49442516c9edac1db', '745530x1313x1', 1, false);",
                "INSERT INTO hops (id, attempt_id, node, channel, direction, ok) VALUES (547, 182, '0380ef0209ff1b46c38a37cd40f613d1dae3eba481a909459d6c1434a0e56e5d8c', '809469x300x4', 0, true);",
                "INSERT INTO hops (id, attempt_id, node, channel, direction, ok) VALUES (548, 182, '03aab7e9327716ee946b8fbfae039b0db85356549e72c5cca113ea67893d0821e5', '797131x955x7', 0, true);",
                "INSERT INTO hops (id, attempt_id, node, channel, direction, ok) VALUES (549, 182, '0294774ee02a9faa5a5870061f7f4833686184ad14a0b163c49442516c9edac1db', '745530x1313x1', 1, true);",
                "INSERT INTO hops (id, attempt_id, node, channel, direction, ok) VALUES (550, 183, '0380ef0209ff1b46c38a37cd40f613d1dae3eba481a909459d6c1434a0e56e5d8c', '809469x300x4', 0, true);",
                "INSERT INTO hops (id, attempt_id, node, channel, direction, ok) VALUES (551, 183, '03aab7e9327716ee946b8fbfae039b0db85356549e72c5cca113ea67893d0821e5', '797131x955x7', 0, true);",
                "INSERT INTO hops (id, attempt_id, node, channel, direction, ok) VALUES (552, 183, '0294774ee02a9faa5a5870061f7f4833686184ad14a0b163c49442516c9edac1db', '745530x1313x1', 1, true);",
                "INSERT INTO hops (id, attempt_id, node, channel, direction, ok) VALUES (553, 184, '0380ef0209ff1b46c38a37cd40f613d1dae3eba481a909459d6c1434a0e56e5d8c', '809469x300x4', 0, true);",
                "INSERT INTO hops (id, attempt_id, node, channel, direction, ok) VALUES (554, 184, '03aab7e9327716ee946b8fbfae039b0db85356549e72c5cca113ea67893d0821e5', '797131x955x7', 0, true);",
                "INSERT INTO hops (id, attempt_id, node, channel, direction, ok) VALUES (555, 184, '0294774ee02a9faa5a5870061f7f4833686184ad14a0b163c49442516c9edac1db', '745530x1313x1', 1, true);",
                "INSERT INTO hops (id, attempt_id, node, channel, direction, ok) VALUES (556, 185, '0380ef0209ff1b46c38a37cd40f613d1dae3eba481a909459d6c1434a0e56e5d8c', '809469x300x4', 0, true);",
                "INSERT INTO hops (id, attempt_id, node, channel, direction, ok) VALUES (557, 185, '03aab7e9327716ee946b8fbfae039b0db85356549e72c5cca113ea67893d0821e5', '797131x955x7', 0, false);",
                "INSERT INTO hops (id, attempt_id, node, channel, direction, ok) VALUES (558, 185, '0294774ee02a9faa5a5870061f7f4833686184ad14a0b163c49442516c9edac1db', '745530x1313x1', 1, false);",
                "INSERT INTO hops (id, attempt_id, node, channel, direction, ok) VALUES (559, 186, '03a93b87bf9f052b8e862d51ebbac4ce5e97b5f4137563cd5128548d7f5978dda9', '814829x1702x7', 0, true);",
                "INSERT INTO hops (id, attempt_id, node, channel, direction, ok) VALUES (560, 186, '03aab7e9327716ee946b8fbfae039b0db85356549e72c5cca113ea67893d0821e5', '815007x921x1', 0, true);",
                "INSERT INTO hops (id, attempt_id, node, channel, direction, ok) VALUES (561, 186, '0294774ee02a9faa5a5870061f7f4833686184ad14a0b163c49442516c9edac1db', '745530x1313x1', 1, true);",
                "INSERT INTO hops (id, attempt_id, node, channel, direction, ok) VALUES (562, 187, '03a93b87bf9f052b8e862d51ebbac4ce5e97b5f4137563cd5128548d7f5978dda9', '814829x1702x7', 0, true);",
                "INSERT INTO hops (id, attempt_id, node, channel, direction, ok) VALUES (563, 187, '03aab7e9327716ee946b8fbfae039b0db85356549e72c5cca113ea67893d0821e5', '815007x921x1', 0, true);",
                "INSERT INTO hops (id, attempt_id, node, channel, direction, ok) VALUES (564, 187, '0294774ee02a9faa5a5870061f7f4833686184ad14a0b163c49442516c9edac1db', '745530x1313x1', 1, true);",
            ]:
                e.execute(text(statement))
            e.commit()

    def test_get_destinations(self) -> None:
        dests = self.stats.get_destinations()

        assert len(dests) == 5
        for cmp in [
            "033b63e4a9931dc151037acbce12f4f8968c86f5655cf102bbfa85a26bd4adc6d9",
            "03aab7e9327716ee946b8fbfae039b0db85356549e72c5cca113ea67893d0821e5",
            "0294774ee02a9faa5a5870061f7f4833686184ad14a0b163c49442516c9edac1db",
            "0380ef0209ff1b46c38a37cd40f613d1dae3eba481a909459d6c1434a0e56e5d8c",
            "03a93b87bf9f052b8e862d51ebbac4ce5e97b5f4137563cd5128548d7f5978dda9",
        ]:
            assert cmp in dests

    def test_get_routes(self) -> None:
        res = self.stats.get_routes(self.destination)
        assert len(res) == 3
        assert res == self.route_stats

    def test_get_routes_min_success(self) -> None:
        res = self.stats.get_routes(self.destination, 0.75)
        assert len(res) == 2
        assert res == self.route_stats[:2]

    def test_get_routes_min_success_ema(self) -> None:
        res = self.stats.get_routes(
            self.destination,
            0,
            self.route_stats[1].success_rate_ema,
        )
        assert len(res) == 2
        assert res == self.route_stats[:2]
