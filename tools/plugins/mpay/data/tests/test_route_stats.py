# ruff: noqa: E501

from typing import ClassVar
from unittest.mock import MagicMock

import pytest
from sqlalchemy import text
from sqlalchemy.orm import Session

from plugins.mpay.data.route_stats import NotInRouteError, RouteStatsFetcher
from plugins.mpay.db.db import Database

SQLITE_MEMORY_PATH = "sqlite+pysqlite://"


def setup_db(db: Database) -> None:
    with Session(db.engine) as e:
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


class TestRouteStatsFetcher:
    pl = MagicMock()
    db = Database(pl)
    db.connect(SQLITE_MEMORY_PATH)

    destination = "03aab7e9327716ee946b8fbfae039b0db85356549e72c5cca113ea67893d0821e5"
    route_stats: ClassVar[tuple[list[str], float, float]] = [
        (["814196x3317x2/0", "783038x1808x1/0", "745530x1313x1/1"], 0, 0),
        (
            ["809469x300x4/0", "797131x955x7/0", "745530x1313x1/1"],
            0.75,
            0.5404411764705882,
        ),
        (["814829x1702x7/0", "815007x921x1/0", "745530x1313x1/1"], 1, 1),
    ]

    @pytest.fixture(scope="class", autouse=True)
    def _before_all(self) -> None:
        setup_db(self.db)

    def test_get_routes_empty_db(self) -> None:
        empty_db = Database(self.pl)
        empty_db.connect(SQLITE_MEMORY_PATH)

        with Session(empty_db.engine) as s:
            routes = RouteStatsFetcher.get_routes(s)

        empty_db.close()
        assert len(routes) == 0

    def test_get_routes(self) -> None:
        with Session(self.db.engine) as s:
            res = RouteStatsFetcher.get_routes(s)

        assert len(res) == 3

        for elem in zip(res, self.route_stats):
            route = elem[0]
            expected = elem[1]

            assert list(route.route) == expected[0]
            assert route.success_rate == expected[1]
            assert route.success_rate_ema == expected[2]

    def test_route_slice(self) -> None:
        with Session(self.db.engine) as s:
            route = RouteStatsFetcher.get_routes(s)[1]

        sliced = route.slice_for_destination(route.nodes[0])

        assert sliced.nodes == [route.nodes[0]]
        assert sliced.route == [route.route[0]]
        assert sliced.success_rate == 1.0
        assert sliced.success_rate_ema == 1.0

    def test_route_slice_not_in_route_error(self) -> None:
        with Session(self.db.engine) as s:
            route = RouteStatsFetcher.get_routes(s)[1]

        with pytest.raises(NotInRouteError):
            route.slice_for_destination("invalid_destination")

    def test_route_slice_add_attempt(self) -> None:
        with Session(self.db.engine) as s:
            route = RouteStatsFetcher.get_routes(s)[2]

        sliced = route.slice_for_destination(route.nodes[1])
        sliced.add_attempt(10, [True, True])

        assert sliced.success_rate == 1.0
        assert sliced.success_rate_ema == 1.0

    def test_route_slice_add_attempt_failed(self) -> None:
        with Session(self.db.engine) as s:
            route = RouteStatsFetcher.get_routes(s)[2]

        sliced = route.slice_for_destination(route.nodes[1])
        sliced.add_attempt(10, [False, False])

        assert sliced.success_rate == 0.6666666666666666
        assert sliced.success_rate_ema == 0.8163265306122449

    @pytest.mark.parametrize("count", [1, 2, 10])
    def test_route_slice_add_attempt_ok_len_mismatch(self, count: int) -> None:
        with Session(self.db.engine) as s:
            route = RouteStatsFetcher.get_routes(s)[2]

        with pytest.raises(ValueError, match="length of oks does not match length of route"):
            route.add_attempt(10, [True for _ in range(count)])

    def test_route_str(self) -> None:
        with Session(self.db.engine) as s:
            route = RouteStatsFetcher.get_routes(s)[2]

        assert (
            str(route)
            == "814829x1702x7/0 -> 815007x921x1/0 -> 745530x1313x1/1 (success_rate: 1.0, success_rate_ema: 1.0)"
        )
