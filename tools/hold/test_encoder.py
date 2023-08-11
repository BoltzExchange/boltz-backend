import random

import pytest
from cli_utils import cln_con
from encoder import Defaults, Encoder, get_network_prefix, get_payment_secret
from utils import time_now


class RpcCaller:
    @staticmethod
    def getinfo() -> dict:
        return cln_con("getinfo")


class RpcPlugin:
    rpc = RpcCaller()


class TestEncoder:
    en = Encoder(RpcPlugin())

    @pytest.mark.parametrize(("network", "prefix"), [
        ("bitcoin", "bc"),
        ("testnet", "tb"),
        ("signet", "tbs"),
        ("regtest", "bcrt"),
        ("unknown", "bc"),
        ("not found", "bc"),
    ])
    def test_get_network_prefix(self, network: str, prefix: str) -> None:
        assert get_network_prefix(network) == prefix

    def test_get_payment_secret(self) -> None:
        assert get_payment_secret("val") == "val"
        assert len(get_payment_secret(None)) == 64

    def test_init(self) -> None:
        self.en.init()
        assert self.en._prefix == "bcrt"  # noqa: SLF001
        assert self.en._features is not None  # noqa: SLF001

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

    @pytest.mark.parametrize("expiry", [1, 60, 1200, 3600, 3601, 7200, 86400])
    def test_encode_expiry(self, expiry: int) -> None:
        invoice = self.en.encode(random.randbytes(32).hex(), 10_000, "memo", expiry)
        dec = cln_con("decode", invoice)

        assert dec["expiry"] == expiry

    @pytest.mark.parametrize("cltv", [1, 2, 3, 80, 90, 144, 150])
    def test_encode_min_final_cltv_expiry(self, cltv: int) -> None:
        invoice = self.en.encode(
            random.randbytes(32).hex(),
            10_000,
            "memo",
            min_final_cltv_expiry=cltv,
        )
        dec = cln_con("decode", invoice)

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

        assert dec["payment_secret"] == payment_secret
