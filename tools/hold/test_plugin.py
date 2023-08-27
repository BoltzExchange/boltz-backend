import random
import time
import uuid
from hashlib import sha256

import bolt11
import pytest
from bolt11.types import MilliSatoshi
from encoder import Defaults
from test_utils import (
    PLUGIN_PATH,
    CliCaller,
    LndNode,
    LndPay,
    cln_con,
    connect_peers,
    format_json,
    get_channel_info,
    lnd,
    start_plugin,
    stop_plugin,
)


def add_hold_invoice(cln: CliCaller) -> tuple[str, str, str]:
    payment_preimage = random.randbytes(32)
    payment_hash = sha256(payment_preimage).hexdigest()

    invoice = cln(
        "holdinvoice",
        payment_hash,
        "100000",
    )["bolt11"]

    return payment_preimage.hex(), payment_hash, invoice


class TestHold:
    @pytest.fixture(scope="class", autouse=True)
    def cln(self) -> CliCaller:
        stop_plugin(cln_con)
        start_plugin(cln_con)
        cln_con("dev-wipeholdinvoices")

        connect_peers(cln_con)

        yield cln_con

        cln_con("dev-wipeholdinvoices")
        stop_plugin(cln_con)

    def test_add(self, cln: CliCaller) -> None:
        payment_hash = random.randbytes(32).hex()

        cln_res = cln("holdinvoice", payment_hash, "10000")
        assert "bolt11" in cln_res

        hold_invoices = cln("listholdinvoices")["holdinvoices"]
        assert len(hold_invoices) == 1
        assert hold_invoices[0]["state"] == "unpaid"
        assert hold_invoices[0]["payment_preimage"] is None
        assert hold_invoices[0]["bolt11"] == cln_res["bolt11"]
        assert hold_invoices[0]["payment_hash"] == payment_hash

    def test_add_defaults(self, cln: CliCaller) -> None:
        amount = 10000
        payment_hash = random.randbytes(32).hex()

        invoice = cln("holdinvoice", payment_hash, str(amount))["bolt11"]

        dec = cln("decode", invoice)
        assert dec["valid"]
        assert dec["description"] == ""
        assert dec["amount_msat"] == amount
        assert dec["expiry"] == Defaults.Expiry
        assert dec["payment_hash"] == payment_hash
        assert dec["min_final_cltv_expiry"] == Defaults.MinFinalCltvExpiry

    @pytest.mark.parametrize("description", ["some", "text", "Send to BTC address"])
    def test_add_description(self, cln: CliCaller, description: str) -> None:
        invoice = cln(
            "holdinvoice",
            random.randbytes(32).hex(),
            "10000",
            f'"{description}"',
        )["bolt11"]

        dec = cln("decode", invoice)
        assert dec["valid"]
        assert dec["description"] == description

    @pytest.mark.parametrize("expiry", [1, 2, 3, 3600, 24000, 86400])
    def test_add_expiry(self, cln: CliCaller, expiry: int) -> None:
        invoice = cln(
            "-k",
            "holdinvoice",
            f"payment_hash={random.randbytes(32).hex()}",
            "amount_msat=10000",
            f"expiry={expiry}",
        )["bolt11"]

        dec = cln("decode", invoice)
        assert dec["valid"]
        assert dec["expiry"] == expiry

    @pytest.mark.parametrize("min_final_cltv_expiry", [1, 2, 3, 80, 144, 150, 200])
    def test_add_min_final_cltv_expiry(
        self,
        cln: CliCaller,
        min_final_cltv_expiry: int,
    ) -> None:
        invoice = cln(
            "-k",
            "holdinvoice",
            f"payment_hash={random.randbytes(32).hex()}",
            "amount_msat=10000",
            f"min_final_cltv_expiry={min_final_cltv_expiry}",
        )["bolt11"]

        dec = cln("decode", invoice)
        assert dec["valid"]
        assert dec["min_final_cltv_expiry"] == min_final_cltv_expiry

    def test_invoice_routing_hints(self, cln: CliCaller) -> None:
        lnd_pubkey = lnd(LndNode.One, "getinfo")["identity_pubkey"]
        hints = cln("routinghints", lnd_pubkey)["hints"]

        invoice = cln(
            "-k",
            "holdinvoice",
            f"payment_hash={random.randbytes(32).hex()}",
            "amount_msat=10000",
            f"routing_hints={format_json(hints)}",
        )["bolt11"]

        dec = cln_con("decode", invoice)
        assert dec["valid"]
        assert len(dec["routes"]) == 1
        assert len(dec["routes"][0]) == 1

        hop = dec["routes"][0][0]
        hint = hints[0]["routes"][0]

        assert hop["pubkey"] == hint["public_key"]
        assert hop["fee_base_msat"] == hint["base_fee"]
        assert hop["short_channel_id"] == hint["short_channel_id"]
        assert hop["fee_proportional_millionths"] == hint["ppm_fee"]

    def test_invoice_routing_hints_multiple(self, cln: CliCaller) -> None:
        lnd_pubkey = lnd(LndNode.One, "getinfo")["identity_pubkey"]
        hints = cln("routinghints", lnd_pubkey)["hints"]
        hints.append(hints[0])

        invoice = cln(
            "-k",
            "holdinvoice",
            f"payment_hash={random.randbytes(32).hex()}",
            "amount_msat=10000",
            f"routing_hints={format_json(hints)}",
        )["bolt11"]

        dec = cln_con("decode", invoice)
        assert dec["valid"]
        assert len(dec["routes"]) == 2
        assert len(dec["routes"][0]) == 1
        assert len(dec["routes"][1]) == 1

        assert dec["routes"][0] == dec["routes"][1]

    def test_add_duplicate_fail(self, cln: CliCaller) -> None:
        amount = 10000
        payment_hash = random.randbytes(32).hex()

        assert "bolt11" in cln("holdinvoice", payment_hash, str(amount))

        cln_res = cln("holdinvoice", payment_hash, str(amount))
        assert cln_res["code"] == 2101
        assert (
            cln_res["message"] == "hold invoice with that payment hash exists already"
        )

    def test_add_invoice_duplicate_fail(self, cln: CliCaller) -> None:
        payment_hash = cln("invoice", "1000", str(uuid.uuid4()), '""')["payment_hash"]

        cln_res = cln("holdinvoice", payment_hash, "10000")
        assert cln_res["code"] == 2101
        assert (
            cln_res["message"] == "hold invoice with that payment hash exists already"
        )

    def test_list(self, cln: CliCaller) -> None:
        invoices = cln("listholdinvoices")["holdinvoices"]
        # TODO: assert properties
        assert len(invoices) > 1

    def test_list_single(self, cln: CliCaller) -> None:
        invoices = cln("listholdinvoices")["holdinvoices"]

        query = invoices[0]["payment_hash"]
        invoice = cln("listholdinvoices", query)["holdinvoices"]
        assert len(invoice) == 1

        assert invoice[0]["payment_hash"] == query

    def test_list_not_found(self, cln: CliCaller) -> None:
        payment_hash = random.randbytes(32).hex()
        invoices = cln("listholdinvoices", payment_hash)

        assert len(invoices["holdinvoices"]) == 0

    def test_settle_accepted(self, cln: CliCaller) -> None:
        payment_preimage, payment_hash, invoice = add_hold_invoice(cln)

        pay = LndPay(LndNode.One, invoice)
        pay.start()

        time.sleep(1)

        assert (
            cln(
                "listholdinvoices",
                payment_hash,
            )["holdinvoices"][
                0
            ]["state"]
            == "accepted"
        )

        cln("settleholdinvoice", payment_preimage)
        pay.join()

        assert pay.res["status"] == "SUCCEEDED"

        assert (
            cln(
                "listholdinvoices",
                payment_hash,
            )["holdinvoices"][
                0
            ]["state"]
            == "paid"
        )

    @pytest.mark.parametrize("parts", [2, 4])
    def test_settle_accepted_mpp(self, cln: CliCaller, parts: int) -> None:
        payment_preimage, payment_hash, invoice = add_hold_invoice(cln)
        amount = int(lnd(LndNode.One, "decodepayreq", invoice)["num_satoshis"])

        pay = LndPay(LndNode.One, invoice, max_shard_size=int(amount / parts))
        pay.start()

        time.sleep(1)

        assert (
            cln(
                "listholdinvoices",
                payment_hash,
            )["holdinvoices"][
                0
            ]["state"]
            == "accepted"
        )

        cln("settleholdinvoice", payment_preimage)
        pay.join()

        assert pay.res["status"] == "SUCCEEDED"
        assert len(pay.res["htlcs"]) == parts

        assert (
            cln(
                "listholdinvoices",
                payment_hash,
            )["holdinvoices"][
                0
            ]["state"]
            == "paid"
        )

    def test_settle_unpaid(self, cln: CliCaller) -> None:
        payment_preimage, _, _ = add_hold_invoice(cln)

        err_res = cln("settleholdinvoice", payment_preimage)
        assert err_res["code"] == 2103
        assert (
            err_res["message"]
            == "illegal hold invoice state transition (unpaid -> paid)"
        )

    def test_settle_cancelled(self, cln: CliCaller) -> None:
        payment_preimage, payment_hash, _ = add_hold_invoice(cln)

        cln("cancelholdinvoice", payment_hash)
        err_res = cln("settleholdinvoice", payment_preimage)
        assert err_res["code"] == 2103
        assert (
            err_res["message"]
            == "illegal hold invoice state transition (cancelled -> paid)"
        )

    def test_settle_non_existent(self, cln: CliCaller) -> None:
        payment_preimage = random.randbytes(32).hex()
        res = cln("settleholdinvoice", payment_preimage)

        assert res["code"] == 2102
        assert res["message"] == "hold invoice with that payment hash does not exist"

    def test_cancel_unpaid(self, cln: CliCaller) -> None:
        payment_hash = random.randbytes(32).hex()
        cln("holdinvoice", payment_hash, "100000")

        assert len(cln("cancelholdinvoice", payment_hash)) == 0
        assert (
            cln(
                "listholdinvoices",
                payment_hash,
            )["holdinvoices"][
                0
            ]["state"]
            == "cancelled"
        )

    def test_cancel_accepted(self, cln: CliCaller) -> None:
        _, payment_hash, invoice = add_hold_invoice(cln)

        pay = LndPay(LndNode.One, invoice)
        pay.start()

        time.sleep(0.5)

        assert (
            cln(
                "listholdinvoices",
                payment_hash,
            )["holdinvoices"][
                0
            ]["state"]
            == "accepted"
        )

        cln("cancelholdinvoice", payment_hash)
        pay.join()

        assert pay.res["status"] == "FAILED"
        assert pay.res["failure_reason"] == "FAILURE_REASON_INCORRECT_PAYMENT_DETAILS"

        assert (
            cln(
                "listholdinvoices",
                payment_hash,
            )["holdinvoices"][
                0
            ]["state"]
            == "cancelled"
        )

    def test_cancel_cancelled(self, cln: CliCaller) -> None:
        payment_hash = random.randbytes(32).hex()
        cln("holdinvoice", payment_hash, "100000")

        assert len(cln("cancelholdinvoice", payment_hash)) == 0
        assert len(cln("cancelholdinvoice", payment_hash)) == 0

    def test_cancel_non_existent(self, cln: CliCaller) -> None:
        payment_hash = random.randbytes(32).hex()
        res = cln("cancelholdinvoice", payment_hash)

        assert res["code"] == 2102
        assert res["message"] == "hold invoice with that payment hash does not exist"

    def test_mpp_timeout(self, cln: CliCaller) -> None:
        _, payment_hash, invoice = add_hold_invoice(cln)
        dec = bolt11.decode(invoice)
        dec.amount_msat = MilliSatoshi(dec.amount_msat - 1000)

        less_invoice = cln("signinvoice", bolt11.encode(dec))["bolt11"]

        pay = LndPay(LndNode.One, less_invoice, timeout=5)
        pay.start()

        time.sleep(0.5)
        assert (
            cln(
                "listholdinvoices",
                payment_hash,
            )["holdinvoices"][
                0
            ]["state"]
            == "unpaid"
        )

        pay.join()

        assert pay.res["status"] == "FAILED"
        assert pay.res["failure_reason"] == "FAILURE_REASON_TIMEOUT"
        assert len(pay.res["htlcs"]) == 1

        htlc = pay.res["htlcs"][0]
        assert htlc["failure"]["code"] == "MPP_TIMEOUT"

    def test_htlc_too_little_cltv(self, cln: CliCaller) -> None:
        _, payment_hash, invoice = add_hold_invoice(cln)
        dec = lnd(LndNode.One, "decodepayreq", invoice)
        block_height = lnd(LndNode.One, "getinfo")["block_height"]

        routes = lnd(
            LndNode.One,
            "queryroutes",
            dec["destination"],
            dec["num_satoshis"],
        )

        time_lock = int(block_height) + int(dec["cltv_expiry"]) - 1
        routes["routes"][0]["total_time_lock"] = time_lock
        routes["routes"][0]["hops"][0]["expiry"] = time_lock

        res = lnd(
            LndNode.One,
            "sendtoroute",
            "--payment_hash",
            payment_hash,
            format_json(routes),
        )

        assert res["status"] == "FAILED"
        assert res["failure"]["code"] == "INCORRECT_OR_UNKNOWN_PAYMENT_DETAILS"

        assert (
            cln(
                "listholdinvoices",
                payment_hash,
            )["holdinvoices"][
                0
            ]["state"]
            == "unpaid"
        )

    def test_htlc_payment_secret_wrong(self, cln: CliCaller) -> None:
        payment_preimage, payment_hash, invoice = add_hold_invoice(cln)
        cltv = cln_con("decode", invoice)["min_final_cltv_expiry"]

        cln_invoice = cln_con(
            "invoice",
            "-k",
            "amount_msat=10000",
            f"label={uuid.uuid4()!s}",
            "description=copy",
            f"preimage={payment_preimage}",
            f"cltv={cltv}",
        )["bolt11"]

        pay = LndPay(LndNode.One, cln_invoice)
        pay.start()

        pay.join()

        assert pay.res["status"] == "FAILED"
        assert pay.res["failure_reason"] == "FAILURE_REASON_INCORRECT_PAYMENT_DETAILS"

        assert (
            cln(
                "listholdinvoices",
                payment_hash,
            )["holdinvoices"][
                0
            ]["state"]
            == "unpaid"
        )

    def test_htlc_payment_secret_missing(self, cln: CliCaller) -> None:
        _, payment_hash, invoice = add_hold_invoice(cln)
        dec = lnd(LndNode.One, "decodepayreq", invoice)

        routes = lnd(
            LndNode.One,
            "queryroutes",
            dec["destination"],
            dec["num_satoshis"],
        )
        res = lnd(
            LndNode.One,
            "sendtoroute",
            "--payment_hash",
            payment_hash,
            format_json(routes),
        )

        assert res["status"] == "FAILED"
        assert res["failure"]["code"] == "INCORRECT_OR_UNKNOWN_PAYMENT_DETAILS"

        assert (
            cln(
                "listholdinvoices",
                payment_hash,
            )["holdinvoices"][
                0
            ]["state"]
            == "unpaid"
        )

    def test_routinghints(self, cln: CliCaller) -> None:
        lnd_pubkey = lnd(LndNode.One, "getinfo")["identity_pubkey"]
        hints = cln("routinghints", lnd_pubkey)["hints"]
        assert len(hints) == 1

        routes = hints[0]
        assert len(routes) == 1
        assert len(routes["routes"]) == 1

        route = routes["routes"][0]

        channel_info = get_channel_info(lnd_pubkey, route["short_channel_id"])

        assert route["cltv_expiry_delta"] == channel_info["delay"]
        assert route["ppm_fee"] == channel_info["fee_per_millionth"]
        assert route["base_fee"] == channel_info["base_fee_millisatoshi"]
        assert route["short_channel_id"] == channel_info["short_channel_id"]

    def test_routinghints_none_found(self, cln: CliCaller) -> None:
        res = cln("routinghints", "none")
        assert "hints" in res
        assert len(res["hints"]) == 0

    def test_wipe_single(self, cln: CliCaller) -> None:
        _, payment_hash, _ = add_hold_invoice(cln)
        res = cln("dev-wipeholdinvoices", payment_hash)

        assert res["deleted_count"] == 1
        assert len(cln("listholdinvoices", payment_hash)["holdinvoices"]) == 0

    def test_wipe(self, cln: CliCaller) -> None:
        for _ in range(0, 11):
            add_hold_invoice(cln)

        invoices = len(cln("listholdinvoices")["holdinvoices"])

        assert cln("dev-wipeholdinvoices")["deleted_count"] == invoices
        assert len(cln("listholdinvoices")["holdinvoices"]) == 0

    def test_wipe_not_found(self, cln: CliCaller) -> None:
        payment_hash = random.randbytes(32).hex()
        res = cln("dev-wipeholdinvoices", payment_hash)

        assert res["code"] == 2102
        assert res["message"] == "hold invoice with that payment hash does not exist"

    def test_ignore_non_hold(self, cln: CliCaller) -> None:
        invoice = cln("invoice", "1000", str(uuid.uuid4()), '""')["bolt11"]

        pay = LndPay(LndNode.One, invoice)
        pay.start()
        pay.join()

        assert pay.res["status"] == "SUCCEEDED"

    def test_ignore_forward(self, cln: CliCaller) -> None:
        cln_id = cln("getinfo")["id"]
        channels = lnd(LndNode.One, "listchannels")["channels"]
        cln_channel = next(c for c in channels if c["remote_pubkey"] == cln_id)[
            "chan_id"
        ]

        invoice = lnd(LndNode.Two, "addinvoice", "10000")["payment_request"]

        pay = LndPay(LndNode.One, invoice, outgoing_chan_id=cln_channel)
        pay.start()
        pay.join()

        assert pay.res["status"] == "SUCCEEDED"
        assert len(pay.res["htlcs"][0]["route"]["hops"]) == 2

    def test_plugin_still_alive(self, cln: CliCaller) -> None:
        plugins = cln("plugin", "list")["plugins"]
        assert any(PLUGIN_PATH in plugin["name"] for plugin in plugins)
