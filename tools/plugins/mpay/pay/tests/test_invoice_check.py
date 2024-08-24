import random
import time

import pytest
from bolt11 import Bolt11, MilliSatoshi, decode, encode
from bolt11.models.tags import Tag, TagChar, Tags
from coincurve import PrivateKey

from plugins.mpay.consts import Network
from plugins.mpay.pay.invoice_check import (
    NETWORK_PREFIXES,
    InvoiceChecker,
    InvoiceExpiredError,
    InvoiceNetworkInvalidError,
    InvoiceNoAmountError,
    InvoiceNoSelfPaymentError,
)


class RpcCaller:
    @staticmethod
    def getinfo() -> dict[str, str]:
        return {
            "id": "03b40f44ad0ebd864916bc2fdd424acc648a6373ace27b9f8d337edac498383982",
            "network": "regtest",
        }


class RpcPlugin:
    rpc = RpcCaller()


class TestInvoiceCheck:
    checker = InvoiceChecker(RpcPlugin())

    def test_init(self) -> None:
        self.checker.init()
        assert self.checker._prefix == "bcrt"  # noqa: SLF001
        assert self.checker._node_id == RpcPlugin().rpc.getinfo()["id"]  # noqa: SLF001

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
                "lnbcrt1231230n1pjuwm72pp59sf47h44yjzl5x8w2v3v3gqctu6uad9zkwf9qnspxl6ajkeeq6eqdqqcqzzsxqyz5vqsp5wg079faqgp5pplt7nks643mqt0y6wwfsq5zetpm9dt4uuv5dj6yq9qyyssq6d9cdgr3v3ncq2yavcxyz4ku9yx399aqynw8s3dhm2tu00yy98n5urke94l59dn5pngpxysnzptyv9alrrq5rdr2pjj4dvpmt272j0cpszwkwq",
            ),
            (
                False,
                "lnbcrt1231231230p1pjuwma7sp5plj4ntddejnx8hc0l3xptagmvp32anz7hccxrzrr6xwsqrtyea3qpp5qjnz9rewdr5ly07ngw7kdf695jzrdt2cy2h043dlxt8yfdwnnk0qdq8v9ekgesxqyjw5qcqp2rzjq0kuk5cssreq495qpyf8q8v9dssd05ujxa3e7f5chk7pf0al6npevqqq0sqqqqgqqqqqqqlgqqqqqqgq2q9qxpqysgqz0w3la2mkkspuc2285x2wfcq479lg96z3fjy9exu05xzx4l5j8g9gww60237adryf5vpykxf2gxlqvtf00p98s5af02k8zac4440gzsq3cak6u",
            ),
        ],
    )
    def test_check_self_payment(self, invoice: str, ok: bool) -> None:
        if ok:
            self.checker._check_self_payment(decode(invoice))  # noqa: SLF001
        else:
            with pytest.raises(InvoiceNoSelfPaymentError):
                self.checker._check_self_payment(decode(invoice))  # noqa: SLF001

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
                    PrivateKey().secret.hex(),
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

    @pytest.mark.parametrize(
        ("invoice", "ok"),
        [
            (
                "lnbcrt1pj7mx0ppp5pqwp604eq0dtv67r76vcpq24543lh3e790sx9rjekayrz67y8teqdqqcqzzsxqyz5vqsp5e9jtsnvdwq30g0kh2ju7xtushpjueqenfrkqreftxszx28hv8v3q9qyyssqmsjsycqrjqyrr332f278emaly7mt6ghzmhhnexpkv4v3gpxec7jzeny9ffv6uka8xpa7j6xtsrf8xtly87js7u8v48sd0lhk75dcyegpuqvuwz",
                False,
            )
        ],
    )
    def test_check_amount(self, invoice: str, ok: bool) -> None:
        if ok:
            self.checker.check(invoice)
        else:
            with pytest.raises(InvoiceNoAmountError):
                self.checker.check(invoice)
