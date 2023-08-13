import concurrent.futures
import random
import time
from hashlib import sha256

import grpc
import pytest
from consts import GRPC_PORT
from encoder import Defaults

# noinspection PyProtectedMember
from grpc._channel import _InactiveRpcError
from protos.hold_pb2 import (
    CancelRequest,
    InvoiceAccepted,
    InvoiceCancelled,
    InvoicePaid,
    InvoiceRequest,
    InvoiceState,
    InvoiceUnpaid,
    ListRequest,
    SettleRequest,
    TrackRequest,
)
from protos.hold_pb2_grpc import HoldStub
from test_utils import (
    LndNode,
    LndPay,
    cln_con,
    connect_peers,
    start_plugin,
    stop_plugin,
)


def add_hold_invoice(cl: HoldStub) -> tuple[str, str, str]:
    payment_preimage = random.randbytes(32)
    payment_hash = sha256(payment_preimage).hexdigest()

    invoice = cl.Invoice(
        InvoiceRequest(payment_hash=payment_hash, amount_msat=100000),
    ).bolt11

    return payment_preimage.hex(), payment_hash, invoice


class TestGrpc:
    @pytest.fixture(scope="class", autouse=True)
    def cl(self) -> HoldStub:
        stop_plugin(cln_con)
        start_plugin(cln_con)
        cln_con("dev-wipeholdinvoices")

        connect_peers(cln_con)

        channel = grpc.insecure_channel(f"127.0.0.1:{GRPC_PORT}")
        client = HoldStub(channel)

        yield client

        channel.close()

        cln_con("dev-wipeholdinvoices")
        stop_plugin(cln_con)

    def test_invoice(self, cl: HoldStub) -> None:
        amount = 10_000
        payment_hash = random.randbytes(32).hex()

        res = cl.Invoice(InvoiceRequest(payment_hash=payment_hash, amount_msat=amount))
        assert res.bolt11 != ""

        dec = cln_con("decode", res.bolt11)
        assert dec["valid"]
        assert dec["amount_msat"] == amount
        assert dec["payment_hash"] == payment_hash

    def test_invoice_defaults(self, cl: HoldStub) -> None:
        amount = 10_000
        payment_hash = random.randbytes(32).hex()

        res = cl.Invoice(InvoiceRequest(payment_hash=payment_hash, amount_msat=amount))
        assert res.bolt11 != ""

        dec = cln_con("decode", res.bolt11)
        assert dec["valid"]
        assert dec["description"] == ""
        assert dec["amount_msat"] == amount
        assert dec["expiry"] == Defaults.Expiry
        assert dec["payment_hash"] == payment_hash
        assert dec["min_final_cltv_expiry"] == Defaults.MinFinalCltvExpiry

    @pytest.mark.parametrize("description", ["some", "text", "Send to BTC address"])
    def test_add_description(self, cl: HoldStub, description: str) -> None:
        invoice = cl.Invoice(
            InvoiceRequest(
                payment_hash=random.randbytes(32).hex(),
                amount_msat=10_000,
                description=description,
            )
        ).bolt11

        dec = cln_con("decode", invoice)
        assert dec["valid"]
        assert dec["description"] == description

    @pytest.mark.parametrize("expiry", [1, 2, 3, 3600, 24000, 86400])
    def test_add_expiry(self, cl: HoldStub, expiry: int) -> None:
        invoice = cl.Invoice(
            InvoiceRequest(
                payment_hash=random.randbytes(32).hex(),
                amount_msat=10_000,
                expiry=expiry,
            )
        ).bolt11

        dec = cln_con("decode", invoice)
        assert dec["valid"]
        assert dec["expiry"] == expiry

    @pytest.mark.parametrize("min_final_cltv_expiry", [1, 2, 3, 80, 144, 150, 200])
    def test_add_min_final_cltv_expiry(
        self,
        cl: HoldStub,
        min_final_cltv_expiry: int,
    ) -> None:
        invoice = cl.Invoice(
            InvoiceRequest(
                payment_hash=random.randbytes(32).hex(),
                amount_msat=10_000,
                min_final_cltv_expiry=min_final_cltv_expiry,
            )
        ).bolt11

        dec = cln_con("decode", invoice)
        assert dec["valid"]
        assert dec["min_final_cltv_expiry"] == min_final_cltv_expiry

    def test_list(self, cl: HoldStub) -> None:
        invoices = cl.List(ListRequest()).invoices
        assert len(invoices) > 1

    def test_list_single(self, cl: HoldStub) -> None:
        invoices = cl.List(ListRequest()).invoices

        query = invoices[0].payment_hash
        invoice = cl.List(ListRequest(payment_hash=query)).invoices
        assert len(invoice) == 1

        assert invoice[0].payment_hash == query

    def test_list_not_found(self, cl: HoldStub) -> None:
        payment_hash = random.randbytes(32).hex()
        invoices = cl.List(ListRequest(payment_hash=payment_hash)).invoices

        assert len(invoices) == 0

    def test_settle_accepted(self, cl: HoldStub) -> None:
        payment_preimage, payment_hash, invoice = add_hold_invoice(cl)

        pay = LndPay(LndNode.One, invoice)
        pay.start()

        time.sleep(1)

        assert (
            cl.List(ListRequest(payment_hash=payment_hash)).invoices[0].state
            == InvoiceAccepted
        )

        cl.Settle(SettleRequest(payment_preimage=payment_preimage))
        pay.join()

        assert pay.res["status"] == "SUCCEEDED"

        assert (
            cl.List(ListRequest(payment_hash=payment_hash)).invoices[0].state
            == InvoicePaid
        )

    def test_settle_unpaid(self, cl: HoldStub) -> None:
        payment_preimage, _, _ = add_hold_invoice(cl)

        with pytest.raises(_InactiveRpcError) as err:
            cl.Settle(SettleRequest(payment_preimage=payment_preimage))

        assert err.value.code() == grpc.StatusCode.INTERNAL
        assert (
            err.value.details()
            == "illegal hold invoice state transition (unpaid -> paid)"
        )

    def test_settle_non_existent(self, cl: HoldStub) -> None:
        payment_preimage = random.randbytes(32).hex()

        with pytest.raises(_InactiveRpcError) as err:
            cl.Settle(SettleRequest(payment_preimage=payment_preimage))

        assert err.value.code() == grpc.StatusCode.INTERNAL
        assert err.value.details() == "NoSuchInvoiceError()"

    def test_cancel_unpaid(self, cl: HoldStub) -> None:
        payment_preimage, payment_hash, invoice = add_hold_invoice(cl)
        cl.Cancel(CancelRequest(payment_hash=payment_hash))

        assert (
            cl.List(ListRequest(payment_hash=payment_hash)).invoices[0].state
            == InvoiceCancelled
        )

    def test_cancel_non_existent(self, cl: HoldStub) -> None:
        payment_hash = random.randbytes(32).hex()

        with pytest.raises(_InactiveRpcError) as err:
            cl.Cancel(CancelRequest(payment_hash=payment_hash))

        assert err.value.code() == grpc.StatusCode.INTERNAL
        assert err.value.details() == "NoSuchInvoiceError()"

    def test_track_settle(self, cl: HoldStub) -> None:
        payment_preimage, payment_hash, invoice = add_hold_invoice(cl)

        def track_states() -> list[InvoiceState]:
            return [
                update.state
                for update in cl.Track(TrackRequest(payment_hash=payment_hash))
            ]

        with concurrent.futures.ThreadPoolExecutor() as pool:
            fut = pool.submit(track_states)

            pay = LndPay(LndNode.One, invoice)
            pay.start()
            time.sleep(1)

            cl.Settle(SettleRequest(payment_preimage=payment_preimage))
            pay.join()

            assert fut.result() == [InvoiceUnpaid, InvoiceAccepted, InvoicePaid]

    def test_track_cancel(self, cl: HoldStub) -> None:
        _, payment_hash, invoice = add_hold_invoice(cl)

        def track_states() -> list[InvoiceState]:
            return [
                update.state
                for update in cl.Track(TrackRequest(payment_hash=payment_hash))
            ]

        with concurrent.futures.ThreadPoolExecutor() as pool:
            fut = pool.submit(track_states)

            pay = LndPay(LndNode.One, invoice)
            pay.start()
            time.sleep(1)

            cl.Cancel(CancelRequest(payment_hash=payment_hash))
            pay.join()

            assert fut.result() == [InvoiceUnpaid, InvoiceAccepted, InvoiceCancelled]

    def test_track_multiple(self, cl: HoldStub) -> None:
        _, payment_hash, invoice = add_hold_invoice(cl)

        def track_states() -> list[InvoiceState]:
            return [
                update.state
                for update in cl.Track(TrackRequest(payment_hash=payment_hash))
            ]

        with concurrent.futures.ThreadPoolExecutor() as pool:
            futs = [pool.submit(track_states), pool.submit(track_states)]

            pay = LndPay(LndNode.One, invoice)
            pay.start()
            time.sleep(1)

            cl.Cancel(CancelRequest(payment_hash=payment_hash))
            pay.join()

            for res in [fut.result() for fut in futs]:
                assert res == [InvoiceUnpaid, InvoiceAccepted, InvoiceCancelled]

    def test_track_cancelled_sub(self, cl: HoldStub) -> None:
        _, payment_hash, invoice = add_hold_invoice(cl)

        sub = cl.Track(TrackRequest(payment_hash=payment_hash))

        for update in sub:
            assert update.state == InvoiceUnpaid
            break

        assert sub.cancel()

        pay = LndPay(LndNode.One, invoice)
        pay.start()
        time.sleep(1)

        cl.Cancel(CancelRequest(payment_hash=payment_hash))
        pay.join()

        # Make sure the plugin is still alive
        invoice_res = cl.List(ListRequest(payment_hash=payment_hash)).invoices[0]
        assert invoice_res.bolt11 == invoice
        assert invoice_res.state == InvoiceCancelled

    def test_track_multiple_cancelled_sub(self, cl: HoldStub) -> None:
        _, payment_hash, invoice = add_hold_invoice(cl)

        def track_states(cancel: bool) -> list[InvoiceState]:
            if cancel:
                sub = cl.Track(TrackRequest(payment_hash=payment_hash))

                updates = []
                for update in sub:
                    updates = [update.state]
                    sub.cancel()
                    break

                return updates

            return [
                update.state
                for update in cl.Track(TrackRequest(payment_hash=payment_hash))
            ]

        with concurrent.futures.ThreadPoolExecutor(2) as pool:
            futs = [pool.submit(track_states, True), pool.submit(track_states, False)]

            pay = LndPay(LndNode.One, invoice)
            pay.start()
            time.sleep(1)

            cl.Cancel(CancelRequest(payment_hash=payment_hash))
            pay.join()

            res = [fut.result() for fut in futs]
            assert res[0] == [InvoiceUnpaid]
            assert res[1] == [InvoiceUnpaid, InvoiceAccepted, InvoiceCancelled]
