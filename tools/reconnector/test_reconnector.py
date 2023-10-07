import json
import os
from typing import Any

import pytest
from reconnector_config import Config, OptionKeys

from reconnector import Reconnector


def cln_con(*args: str) -> dict[str, Any]:
    return json.load(
        os.popen(
            f"docker exec regtest lightning-cli {' '.join(args)}",
        )
    )


class RpcCaller:
    list_nodes_res: dict[str, Any]

    @staticmethod
    def getinfo() -> dict[str, Any]:
        return cln_con("getinfo")

    def listnodes(self, _: str) -> dict[str, Any]:
        return self.list_nodes_res


class RpcPlugin:
    rpc = RpcCaller()

    def log(self, msg: str, **_kwargs: dict[str, Any]) -> None:
        pass


pl = RpcPlugin()
# noinspection PyTypeChecker
cfg = Config(pl, {OptionKeys.CheckInterval: 120, OptionKeys.CustomUris: "[]"})


class TestReconnector:
    @pytest.fixture(scope="class", autouse=True)
    def rec(self) -> Reconnector:
        # noinspection PyTypeChecker
        rec = Reconnector(RpcPlugin())

        yield rec

        rec.stop()

    def test_init(self, rec: Reconnector) -> None:
        assert rec._timer is None  # noqa: SLF001
        assert rec._pubkey == ""  # noqa: SLF001
        assert rec._custom_uris == {}  # noqa: SLF001

        cfg.custom_uris = {"some": "data"}
        rec.init(cfg)

        assert rec._timer is not None  # noqa: SLF001
        assert rec._timer.interval == cfg.check_interval  # noqa: SLF001, SLF001

        assert rec._pubkey != ""  # noqa: SLF001
        assert rec._custom_uris == cfg.custom_uris  # noqa: SLF001

    def test_stop(self, rec: Reconnector) -> None:
        rec.init(cfg)
        assert rec._timer is not None  # noqa: SLF001

        rec.stop()
        assert rec._timer is None  # noqa: SLF001

    @pytest.mark.parametrize(
        ("node", "list_nodes", "expected"),
        [
            (
                "02d96eadea3d780104449aca5c93461ce67c1564e2e1d73225fa67dd3b997a6018",
                {
                    "nodes": [
                        {
                            "addresses": [
                                {
                                    "type": "ipv4",
                                    "address": "45.86.229.190",
                                    "port": 9736,
                                },
                                {
                                    "type": "ipv6",
                                    "address": "2a10:1fc0:3::270:a9dc",
                                    "port": 9736,
                                },
                                {
                                    "type": "torv3",
                                    "address": "oo5tkbbpgnqjopdjxepyfavx3yemtylgzul67s7zzzxfeeqpde6yr7yd.onion",
                                    "port": 9736,
                                },
                            ]
                        }
                    ]
                },
                [
                    "02d96eadea3d780104449aca5c93461ce67c1564e2e1d73225fa67dd3b997a6018@45.86.229.190:9736",
                    "02d96eadea3d780104449aca5c93461ce67c1564e2e1d73225fa67dd3b997a6018@2a10:1fc0:3::270:a9dc:9736",
                    "02d96eadea3d780104449aca5c93461ce67c1564e2e1d73225fa67dd3b997a6018@oo5tkbbpgnqjopdjxepyfavx3yemtylgzul67s7zzzxfeeqpde6yr7yd.onion:9736",
                ],
            ),
            (
                "02d96eadea3d780104449aca5c93461ce67c1564e2e1d73225fa67dd3b997a6018",
                {
                    "nodes": [
                        {
                            "addresses": [
                                {
                                    "type": "torv3",
                                    "address": "oo5tkbbpgnqjopdjxepyfavx3yemtylgzul67s7zzzxfeeqpde6yr7yd.onion",
                                    "port": 9736,
                                },
                                {
                                    "type": "ipv4",
                                    "address": "45.86.229.190",
                                    "port": 9736,
                                },
                                {
                                    "type": "ipv6",
                                    "address": "2a10:1fc0:3::270:a9dc",
                                    "port": 9736,
                                },
                            ]
                        }
                    ]
                },
                [
                    "02d96eadea3d780104449aca5c93461ce67c1564e2e1d73225fa67dd3b997a6018@45.86.229.190:9736",
                    "02d96eadea3d780104449aca5c93461ce67c1564e2e1d73225fa67dd3b997a6018@2a10:1fc0:3::270:a9dc:9736",
                    "02d96eadea3d780104449aca5c93461ce67c1564e2e1d73225fa67dd3b997a6018@oo5tkbbpgnqjopdjxepyfavx3yemtylgzul67s7zzzxfeeqpde6yr7yd.onion:9736",
                ],
            ),
            (
                "02d96eadea3d780104449aca5c93461ce67c1564e2e1d73225fa67dd3b997a6018",
                {
                    "nodes": [
                        {
                            "addresses": [
                                {
                                    "type": "ipv4",
                                    "address": "45.86.229.190",
                                    "port": 9736,
                                },
                                {
                                    "type": "ipv6",
                                    "address": "2a10:1fc0:3::270:a9dc",
                                    "port": 9736,
                                },
                                {
                                    "type": "torv2",
                                    "address": "some.onion",
                                    "port": 9736,
                                },
                            ]
                        }
                    ]
                },
                [
                    "02d96eadea3d780104449aca5c93461ce67c1564e2e1d73225fa67dd3b997a6018@45.86.229.190:9736",
                    "02d96eadea3d780104449aca5c93461ce67c1564e2e1d73225fa67dd3b997a6018@2a10:1fc0:3::270:a9dc:9736",
                ],
            ),
            (
                "02d96eadea3d780104449aca5c93461ce67c1564e2e1d73225fa67dd3b997a6018",
                {"nodes": []},
                [],
            ),
        ],
    )
    def test_get_node_uris(
        self,
        rec: Reconnector,
        node: str,
        list_nodes: dict[str, Any],
        expected: list[str],
    ) -> None:
        pl.rpc.list_nodes_res = list_nodes
        assert rec._get_node_uris(node) == expected  # noqa: SLF001

    def test_get_node_uris_custom(self, rec: Reconnector) -> None:
        node = "02d96eadea3d780104449aca5c93461ce67c1564e2e1d73225fa67dd3b997a6018"
        custom_uri = (
            "02d96eadea3d780104449aca5c93461ce67c1564e2e1d73225fa67dd3b997a6018@45.86.229.190:9736"
        )

        rec._custom_uris[node] = custom_uri  # noqa: SLF001
        uris = rec._get_node_uris(node)  # noqa: SLF001

        assert uris == [custom_uri]
