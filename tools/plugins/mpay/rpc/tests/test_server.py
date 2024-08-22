import hashlib
from pathlib import Path

import bolt11
import grpc
import pytest

# noinspection PyProtectedMember
from grpc._channel import _InactiveRpcError

from plugins.mpay.config import OptionDefaults
from plugins.mpay.consts import VERSION
from plugins.mpay.pay.sendpay import STATUS_COMPLETE
from plugins.mpay.protos.mpay_pb2 import (
    GetInfoRequest,
    GetInfoResponse,
    GetRoutesRequest,
    GetRoutesResponse,
    ListPaymentsRequest,
    ListPaymentsResponse,
    PaginationParams,
    PayRequest,
    PayResponse,
    ResetPathMemoryRequest,
    ResetPathMemoryResponse,
)
from plugins.mpay.protos.mpay_pb2_grpc import MpayStub
from plugins.mpay.tests.utils import (
    PLUGIN_PATH_MPAY,
    LndNode,
    cln_con,
    connect_peers,
    lnd,
    start_plugin,
    stop_plugin,
)


class TestGrpc:
    @pytest.fixture(scope="class", autouse=True)
    def cl(self) -> MpayStub:
        stop_plugin(cln_con, PLUGIN_PATH_MPAY)
        start_plugin(cln_con, PLUGIN_PATH_MPAY)

        connect_peers(cln_con)

        cert_path = Path("../docker/regtest/data/cln/mpay")
        creds = grpc.ssl_channel_credentials(
            root_certificates=cert_path.joinpath("ca.pem").read_bytes(),
            private_key=cert_path.joinpath("client-key.pem").read_bytes(),
            certificate_chain=cert_path.joinpath("client.pem").read_bytes(),
        )
        channel = grpc.secure_channel(
            f"127.0.0.1:{OptionDefaults.GrpcPort}",
            creds,
            options=(("grpc.ssl_target_name_override", "mpay"),),
        )
        client = MpayStub(channel)
        client.ResetPathMemory(ResetPathMemoryRequest())

        yield client

        channel.close()

        stop_plugin(cln_con, PLUGIN_PATH_MPAY)

    def test_get_info(self, cl: MpayStub) -> None:
        res: GetInfoResponse = cl.GetInfo(GetInfoRequest())
        assert res.version == VERSION

    @pytest.mark.parametrize("node", [LndNode.One, LndNode.Two])
    def test_pay(self, cl: MpayStub, node: LndNode) -> None:
        invoice = lnd(node, "addinvoice 1")["payment_request"]
        self.invoice = invoice

        res: PayResponse = cl.Pay(PayRequest(bolt11=invoice))

        dec = bolt11.decode(invoice)

        assert res.destination == dec.payee
        assert res.payment_hash == dec.payment_hash
        assert hashlib.sha256(bytes.fromhex(res.payment_preimage)).hexdigest() == dec.payment_hash
        assert res.amount_msat == 1_000
        assert res.amount_sent_msat == 1_000
        assert res.parts == 1
        assert res.status == STATUS_COMPLETE
        assert res.time < 10
        assert res.fee_msat == 0

    def test_pay_twice(self, cl: MpayStub) -> None:
        invoice = lnd(LndNode.One, "listinvoices")["invoices"][-1]
        res: PayResponse = cl.Pay(PayRequest(bolt11=invoice["payment_request"]))

        assert res.time == 0
        assert res.payment_hash == invoice["r_hash"]
        assert res.payment_preimage == invoice["r_preimage"]

    @pytest.mark.parametrize(("min_success", "min_success_ema"), [(2, 0), (0, 2)])
    def test_get_routes_min_success(
        self, cl: MpayStub, min_success: int, min_success_ema: int
    ) -> None:
        res: GetRoutesResponse = cl.GetRoutes(
            GetRoutesRequest(
                min_success=min_success,
                min_success_ema=min_success_ema,
            )
        )
        assert len(res.routes) == 0

    def test_list_payments(self, cl: MpayStub) -> None:
        res: ListPaymentsResponse = cl.ListPayments(ListPaymentsRequest())
        assert len(res.payments) == 2

        for i, payment in enumerate(res.payments):
            assert payment.id >= 0
            assert (
                payment.destination
                == lnd((LndNode.One if i == 0 else LndNode.Two), "getinfo")["identity_pubkey"]
            )
            assert len(payment.payment_hash) == 64
            assert payment.amount == 1000
            assert payment.ok
            assert len(payment.attempts) > 0

        res: ListPaymentsResponse = cl.ListPayments(
            ListPaymentsRequest(
                pagination=PaginationParams(offset=0, limit=1),
            )
        )
        assert len(res.payments) == 1
        assert res.payments[0].id == 1

        res: ListPaymentsResponse = cl.ListPayments(
            ListPaymentsRequest(
                pagination=PaginationParams(offset=1, limit=1),
            )
        )
        assert len(res.payments) == 1
        assert res.payments[0].id == 2

    def test_list_payments_payment_hash(self, cl: MpayStub) -> None:
        payment_hash = cln_con("listpays")["pays"][-1]["payment_hash"]
        res: ListPaymentsResponse = cl.ListPayments(ListPaymentsRequest(payment_hash=payment_hash))

        assert len(res.payments) == 1
        assert res.payments[0].payment_hash == payment_hash

    def test_list_payments_bolt11(self, cl: MpayStub) -> None:
        pay = cln_con("listpays")["pays"][-1]
        res: ListPaymentsResponse = cl.ListPayments(ListPaymentsRequest(bolt11=pay["bolt11"]))

        assert len(res.payments) == 1
        assert res.payments[0].payment_hash == pay["payment_hash"]

    def test_list_payments_bolt11_invalid(self, cl: MpayStub) -> None:
        with pytest.raises(_InactiveRpcError):
            cl.ListPayments(ListPaymentsRequest(bolt11="invalid bolt11"))

    def test_reset_path_memory_exclude_permanent_memory(self, cl: MpayStub) -> None:
        res: ResetPathMemoryResponse = cl.ResetPathMemory(
            ResetPathMemoryRequest(exclude_permanent_memory=True)
        )

        assert res.payments == 0
        assert res.attempts == 0
        assert res.hops == 0

        pays: ListPaymentsResponse = cl.ListPayments(ListPaymentsRequest())
        assert len(pays.payments) > 0

    def test_reset_path_memory(self, cl: MpayStub) -> None:
        res: ResetPathMemoryResponse = cl.ResetPathMemory(ResetPathMemoryRequest())

        assert res.payments > 0
        assert res.attempts > 0
        assert res.hops > 0

        pays: ListPaymentsResponse = cl.ListPayments(ListPaymentsRequest())
        assert len(pays.payments) == 0

        routes: GetRoutesResponse = cl.GetRoutes(GetRoutesRequest())
        assert len(routes.routes) == 0
