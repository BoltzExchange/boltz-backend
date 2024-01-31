import random
import time

import pytest
from bolt11 import Bolt11, MilliSatoshi, decode, encode
from bolt11.models.tags import Tag, TagChar, Tags
from secp256k1 import PrivateKey

from plugins.hold.consts import Network
from plugins.hold.encoder import NETWORK_PREFIXES
from plugins.mpay.pay.invoice_check import (
    InvoiceChecker,
    InvoiceExpiredError,
    InvoiceNetworkInvalidError,
)


class RpcCaller:
    @staticmethod
    def getinfo() -> dict[str, str]:
        return {"network": "regtest"}


class RpcPlugin:
    rpc = RpcCaller()


class TestInvoiceCheck:
    checker = InvoiceChecker(RpcPlugin())

    def test_init(self) -> None:
        self.checker.init()
        assert self.checker._prefix == "bcrt"  # noqa: SLF001

    @pytest.mark.parametrize(
        ("ok", "invoice"),
        [
            (
                True,
                "lnbcrt1230p1pjm498msp56yhrrjcj0r24vfhjnjds6gtel8z8aagfjtvq9dneh3hx03wt2k7spp5spkk9zl0kvvpf2mfcwu7n9d2ely9pz063464kp7csh8w6fyhlfaqdq8w3jhxaqxqyjw5qcqp29qxpqysgqclu6rq4xk4q8jflzrhscqwe9pvgxcv2sg2pav2wmavuxvymcljln75xf43s0p8xcjfvywdwgl3yzquek8a7jtqsjmrewcq4pvn2spsqqdzn3d8",
            ),
            (
                False,
                "lntb1230p1pjm49d3sp57963uvpdnlp9x5ey3yxjyjduvqr330py78a86ea23h5cv98cmupspp50yp625zwtdpsu4q4wht56wh2j0er4ur66r2tyhgguza7hrdg3t0sdq8w3jhxaqxqyjw5qcqp2rzjq0k89d86yejwp3gu05crkc0g3v7qwp6y7rrwyxcgv579hq68e4ykzf6vwvqqqkgqqqqqqqvdqqqqqqgqqc9qxpqysgqwn03hhmss6e6n24lpjcxp4258nwm5cdm4ea8hnsewzwx30plxshz4tv52kz05kmy7ptkz3mqpvs659mxtrzj0knsjagkgumaxyvsckspsa64cq",
            ),
            (
                False,
                "lnbc210n1pjm49wxsp5tnvvl6rnd2d4hamy6cx3kzxv7l655yh0cx7cqmfrza9ur049fe2spp54t3m29upv45fpdq6f6gjqtulgl28p0xwkhd7dlhw3a9w5m3n0qxqdq8d4cxz7gxqyjw5qcqpjrzjq207gdgypj9kvhmnru4seqws8y3cau0r5xcauzh6c268vds6ymt82rzmfuqqxacqqqqqqqt0qqqqphqqyg9qxpqysgqhwy0s9nkzg2g05xgvy9grxnunclyq93jg50whux3ppg6dd2n8u6xrvfjkg0ame39urz970pyejyquwdw762jdr32newsn4z5w4a5yrgqjww45f",
            ),
        ],
    )
    def test_check_network(self, invoice: str, ok: bool) -> None:
        if ok:
            self.checker._check_network(decode(invoice))  # noqa: SLF001
        else:
            with pytest.raises(InvoiceNetworkInvalidError):
                self.checker._check_network(decode(invoice))  # noqa: SLF001

    @pytest.mark.parametrize(
        ("ok", "invoice"),
        [
            (
                True,
                encode(
                    Bolt11(
                        NETWORK_PREFIXES[Network.Regtest],
                        int(time.time()),
                        Tags(
                            [
                                Tag(TagChar.payment_hash, random.randbytes(32).hex()),
                                Tag(TagChar.payment_secret, random.randbytes(32).hex()),
                                Tag(TagChar.description, ""),
                                Tag(TagChar.expire_time, 3600),
                            ]
                        ),
                        MilliSatoshi(10_000),
                    ),
                    PrivateKey().serialize(),
                ),
            ),
            (
                False,
                "lnbcrt210n1pjm4939pp54jsfpkn9rc2dxwcvdlmgtsu7p7x45hu2acapzu2mv4hwgjpy8tasdqqcqzzsxqppsp5dg4k0kl5e2k0l5dntpwgcvj2h5xqzfs6407u30sy3zt3vj9jrrqs9qyyssqutprtqucuy5eu7a75mxavzwf4v9hmmlhtr0f28aj8c8cwzt3a7a927gpwyxnsug6xkf2xpsxqk49q0ngcwv8k84wxd3md86kv5mrmvgqxs0v6a",
            ),
        ],
    )
    def test_check_expiry(self, invoice: str, ok: bool) -> None:
        if ok:
            self.checker.check(invoice)
        else:
            with pytest.raises(InvoiceExpiredError):
                self.checker.check(invoice)
