import random

import pytest
from bolt11.models.routehint import Route, RouteHint

from plugins.hold.encoder import Defaults, Encoder, get_network_prefix, get_payment_secret
from plugins.hold.tests.utils import RpcPlugin, cln_con
from plugins.hold.utils import time_now

route_hint = RouteHint(
    routes=[
        Route(
            public_key="02e425026d928083eb432886c4c209abff4aea1e6bafca208671fdb0e42be4b63d",
            short_channel_id="117x1x0",
            base_fee=1000,
            ppm_fee=1,
            cltv_expiry_delta=80,
        )
    ]
)


class TestEncoder:
    # noinspection PyTypeChecker
    en = Encoder(RpcPlugin())

    @pytest.mark.parametrize(
        ("network", "prefix"),
        [
            ("bitcoin", "bc"),
            ("testnet", "tb"),
            ("signet", "tbs"),
            ("regtest", "bcrt"),
            ("unknown", "bc"),
            ("not found", "bc"),
        ],
    )
    def test_get_network_prefix(self, network: str, prefix: str) -> None:
        assert get_network_prefix(network) == prefix

    def test_get_payment_secret(self) -> None:
        assert get_payment_secret("val") == "val"
        assert len(get_payment_secret(None)) == 64

    def test_init(self) -> None:
        self.en.init()
        assert self.en._prefix == "bcrt"  # noqa: SLF001

        features = self.en._features  # noqa: SLF001
        assert features is not None

    def test_encode(self) -> None:
        payment_hash = random.randbytes(32).hex()
        amount = 10_000
        description = "memo"

        invoice = self.en.encode(payment_hash, amount, description)
        dec = cln_con("decode", invoice)

        assert dec["valid"]
        assert dec["payment_secret"] != ""
        assert dec["amount_msat"] == amount
        assert dec["expiry"] == Defaults.Expiry
        assert dec["description"] == description
        assert dec["payment_hash"] == payment_hash
        assert dec["created_at"] - int(time_now().timestamp()) < 2
        assert dec["min_final_cltv_expiry"] == Defaults.MinFinalCltvExpiry

    def test_encode_empty_description(self) -> None:
        invoice = self.en.encode(
            random.randbytes(32).hex(),
            10_000,
        )

        dec = cln_con("decode", invoice)
        assert dec["valid"]
        assert dec["description"] == ""

    def test_encode_description_hash(self) -> None:
        description_hash = "c84cfc6d31834f01b1c36af114883dd9eb700a4dfef4adbcff7b9af401d54ce7"
        invoice = self.en.encode(
            random.randbytes(32).hex(),
            10_000,
            description_hash=description_hash,
        )

        dec = cln_con("decode", invoice)
        assert dec["valid"]
        assert dec["description_hash"] == description_hash

    def test_encode_description_hash_invalid(self) -> None:
        description_hash = "c84cfc6d31834f01b1c36af114883dd9eb700a4dfef4adbcff7b9af401d54ce"

        with pytest.raises(ValueError, match="description_hash must be 64 bytes"):
            self.en.encode(
                random.randbytes(32).hex(),
                10_000,
                description_hash=description_hash,
            )

    @pytest.mark.parametrize("expiry", [1, 60, 1200, 3600, 3601, 7200, 86400])
    def test_encode_expiry(self, expiry: int) -> None:
        invoice = self.en.encode(random.randbytes(32).hex(), 10_000, expiry=expiry)
        dec = cln_con("decode", invoice)

        assert dec["expiry"] == expiry

    @pytest.mark.parametrize("cltv", [1, 2, 3, 80, 90, 144, 150])
    def test_encode_min_final_cltv_expiry(self, cltv: int) -> None:
        invoice = self.en.encode(
            random.randbytes(32).hex(),
            10_000,
            min_final_cltv_expiry=cltv,
        )
        dec = cln_con("decode", invoice)

        assert dec["valid"]
        assert dec["min_final_cltv_expiry"] == cltv

    def test_encode_payment_secret(self) -> None:
        payment_secret = random.randbytes(32).hex()

        invoice = self.en.encode(
            random.randbytes(32).hex(),
            10_000,
            "memo",
            payment_secret=payment_secret,
        )

        dec = cln_con("decode", invoice)

        assert dec["valid"]
        assert dec["payment_secret"] == payment_secret

    def test_encode_route_hints(self) -> None:
        invoice = self.en.encode(
            random.randbytes(32).hex(),
            10_000,
            "memo",
            route_hints=[route_hint],
        )

        dec = cln_con("decode", invoice)
        assert dec["valid"]

        routes = dec["routes"]
        assert len(routes) == 1

        route = routes[0]
        assert len(route) == 1

        hop = route[0]
        assert hop["pubkey"] == route_hint.routes[0].public_key
        assert hop["fee_base_msat"] == route_hint.routes[0].base_fee
        assert hop["short_channel_id"] == route_hint.routes[0].short_channel_id
        assert hop["fee_proportional_millionths"] == route_hint.routes[0].ppm_fee

    def test_encode_route_hints_multiple(self) -> None:
        invoice = self.en.encode(
            random.randbytes(32).hex(),
            10_000,
            "memo",
            route_hints=[route_hint, route_hint],
        )

        dec = cln_con("decode", invoice)
        assert dec["valid"]

        routes = dec["routes"]
        assert len(routes) == 2
        assert routes[0] == routes[1]
