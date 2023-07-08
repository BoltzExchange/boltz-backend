import json
import os
import random
import time
import uuid
from collections.abc import Callable
from enum import Enum
from hashlib import sha256
from threading import Thread
from typing import Any

import pytest

PLUGIN_PATH = "/tools/hold/plugin.py"

CliCaller = Callable[..., dict[str, Any]]


class LndNode(Enum):
    One = 1
    Two = 2


def lnd_raw(node: LndNode, *args: str) -> str:
    node_cmd = "docker exec regtest lncli --network regtest --lnddir /root/.lnd-btc"

    if node == LndNode.Two:
        node_cmd += " --rpcserver localhost:10011"

    return os.popen(
        f"{node_cmd} {' '.join(args)}",
    ).read()


def lnd(node: LndNode, *args: str) -> dict[str, Any]:
    return json.loads(lnd_raw(node, *args))


def format_json(args: dict[str, Any] | list[Any]) -> str:
    return json.dumps(args).replace('"', '\\"').replace(" ", "")


def stop_plugin(cln: CliCaller) -> None:
    plugins = cln("plugin", "list")["plugins"]
    if not any(PLUGIN_PATH in plugin["name"] for plugin in plugins):
        return

    cln("plugin", "stop", PLUGIN_PATH)


def add_hold_invoice(cln: CliCaller) -> tuple[str, str, str]:
    payment_secret = random.randbytes(32)
    payment_hash = sha256(payment_secret).hexdigest()

    invoice = cln(
        "holdinvoice",
        lnd(
            LndNode.Two,
            "addholdinvoice",
            payment_hash,
            "100000",
        )["payment_request"],
    )["bolt11"]

    return payment_secret.hex(), payment_hash, invoice


class LndPay(Thread):
    res: dict[str, Any] = None

    def __init__(
            self,
            node: LndNode,
            invoice: str,
            max_shard_size: int | None = None,
            outgoing_chan_id: str | None = None,
    ) -> None:
        Thread.__init__(self)

        self.node = node
        self.invoice = invoice
        self.max_shard_size = max_shard_size
        self.outgoing_chan_id = outgoing_chan_id

    def run(self) -> None:
        cmd = "payinvoice --force --json"

        if self.outgoing_chan_id is not None:
            cmd += f" --outgoing_chan_id {self.outgoing_chan_id}"

        if self.max_shard_size is not None:
            cmd += f" --max_shard_size_sat {self.max_shard_size}"

        res = lnd_raw(self.node, f"{cmd} {self.invoice} 2> /dev/null")
        res = res[res.find("{"):]
        self.res = json.loads(res)


class TestHold:
    @pytest.fixture(scope="class", autouse=True)
    def cln(self) -> CliCaller:
        def cln_con(*args: str) -> dict[str, Any]:
            return json.load(os.popen(
                f"docker exec regtest lightning-cli {' '.join(args)}",
            ))

        stop_plugin(cln_con)
        cln_con("plugin", "start", PLUGIN_PATH)
        cln_con("dev-wipeholdinvoices")

        yield cln_con

        cln_con("dev-wipeholdinvoices")
        stop_plugin(cln_con)

    def test_add(self, cln: CliCaller) -> None:
        lnd_res = lnd(LndNode.Two, "addinvoice", "100000")
        payment_hash = lnd_res["r_hash"]
        invoice = lnd_res["payment_request"]

        cln_res = cln("holdinvoice", invoice)
        assert "bolt11" in cln_res

        hold_invoices = cln("listholdinvoices")["holdinvoices"]
        assert len(hold_invoices) == 1
        assert hold_invoices[0]["state"] == "unpaid"
        assert hold_invoices[0]["payment_preimage"] is None
        assert hold_invoices[0]["bolt11"] == cln_res["bolt11"]
        assert hold_invoices[0]["payment_hash"] == payment_hash

    def test_add_duplicate_fail(self, cln: CliCaller) -> None:
        invoice = lnd(LndNode.Two, "addinvoice", "100000")["payment_request"]
        assert "bolt11" in cln("holdinvoice", invoice)

        cln_res = cln("holdinvoice", invoice)
        assert cln_res["code"] == 2101
        assert cln_res["message"] == \
               "hold invoice with that payment hash exists already"

    def test_add_invoice_duplicate_fail(self, cln: CliCaller) -> None:
        invoice = cln("invoice", "1000", str(uuid.uuid4()), '""')["bolt11"]

        cln_res = cln("holdinvoice", invoice)
        assert cln_res["code"] == 2101
        assert cln_res["message"] == \
               "hold invoice with that payment hash exists already"

    def test_list(self, cln: CliCaller) -> None:
        invoices = cln("listholdinvoices")["holdinvoices"]
        assert len(invoices) == 2

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
        payment_secret, payment_hash, invoice = add_hold_invoice(cln)

        pay = LndPay(LndNode.One, invoice)
        pay.start()

        time.sleep(1)

        assert cln(
            "listholdinvoices",
            payment_hash,
        )["holdinvoices"][0]["state"] == "accepted"

        cln("settleholdinvoice", payment_secret)
        pay.join()

        assert pay.res["status"] == "SUCCEEDED"

        assert cln(
            "listholdinvoices",
            payment_hash,
        )["holdinvoices"][0]["state"] == "paid"

    @pytest.mark.parametrize("parts", [2, 4])
    def test_settle_accepted_mpp(self, cln: CliCaller, parts: int) -> None:
        payment_secret, payment_hash, invoice = add_hold_invoice(cln)
        amount = int(lnd(LndNode.One, "decodepayreq", invoice)["num_satoshis"])

        pay = LndPay(LndNode.One, invoice, max_shard_size=int(amount/parts))
        pay.start()

        time.sleep(1)

        assert cln(
            "listholdinvoices",
            payment_hash,
        )["holdinvoices"][0]["state"] == "accepted"

        cln("settleholdinvoice", payment_secret)
        pay.join()

        assert pay.res["status"] == "SUCCEEDED"
        assert len(pay.res["htlcs"]) == parts

        assert cln(
            "listholdinvoices",
            payment_hash,
        )["holdinvoices"][0]["state"] == "paid"

    def test_settle_unpaid(self, cln: CliCaller) -> None:
        payment_secret, _, _ = add_hold_invoice(cln)

        err_res = cln("settleholdinvoice", payment_secret)
        assert err_res["code"] == 2103
        assert err_res["message"] == \
               "illegal hold invoice state transition (unpaid -> paid)"

    def test_settle_cancelled(self, cln: CliCaller) -> None:
        payment_secret, payment_hash, _ = add_hold_invoice(cln)

        cln("cancelholdinvoice", payment_hash)
        err_res = cln("settleholdinvoice", payment_secret)
        assert err_res["code"] == 2103
        assert err_res["message"] == \
               "illegal hold invoice state transition (cancelled -> paid)"

    def test_settle_non_existent(self, cln: CliCaller) -> None:
        payment_hash = random.randbytes(32).hex()
        res = cln("cancelholdinvoice", payment_hash)

        assert res["code"] == 2102
        assert res["message"] == "hold invoice with that payment hash does not exist"

    def test_cancel_unpaid(self, cln: CliCaller) -> None:
        invoice = lnd(LndNode.Two, "addinvoice", "100000")
        cln("holdinvoice", invoice["payment_request"])

        assert len(cln("cancelholdinvoice", invoice["r_hash"])) == 0
        assert cln(
            "listholdinvoices",
            invoice["r_hash"],
        )["holdinvoices"][0]["state"] == "cancelled"

    def test_cancel_accepted(self, cln: CliCaller) -> None:
        _, payment_hash, invoice = add_hold_invoice(cln)

        pay = LndPay(LndNode.One, invoice)
        pay.start()

        time.sleep(0.5)

        assert cln(
            "listholdinvoices",
            payment_hash,
        )["holdinvoices"][0]["state"] == "accepted"

        cln("cancelholdinvoice", payment_hash)
        pay.join()

        assert pay.res["status"] == "FAILED"
        assert pay.res["failure_reason"] == "FAILURE_REASON_INCORRECT_PAYMENT_DETAILS"

        assert cln(
            "listholdinvoices",
            payment_hash,
        )["holdinvoices"][0]["state"] == "cancelled"

    def test_cancel_cancelled_fail(self, cln: CliCaller) -> None:
        invoice = lnd(LndNode.Two, "addinvoice", "100000")
        cln("holdinvoice", invoice["payment_request"])

        assert len(cln("cancelholdinvoice", invoice["r_hash"])) == 0

        err_res = cln("cancelholdinvoice", invoice["r_hash"])
        assert err_res["code"] == 2103
        assert err_res["message"] == \
               "illegal hold invoice state transition (cancelled -> cancelled)"

    def test_cancel_non_existent(self, cln: CliCaller) -> None:
        payment_hash = random.randbytes(32).hex()
        res = cln("cancelholdinvoice", payment_hash)

        assert res["code"] == 2102
        assert res["message"] == "hold invoice with that payment hash does not exist"

    def test_mpp_timeout(self, cln: CliCaller) -> None:
        _, payment_hash, invoice = add_hold_invoice(cln)
        amount = lnd(LndNode.One, "decodepayreq", invoice)["num_satoshis"]
        cln_node = cln("getinfo")["id"]

        routes = lnd(LndNode.One, "queryroutes", cln_node, str(int(amount) - 1))

        res = lnd(
            LndNode.One,
            "sendtoroute",
            "--payment_hash",
            payment_hash,
            format_json(routes),
        )

        assert res["status"] == "FAILED"
        assert res["failure"]["code"] == "MPP_TIMEOUT"

    def test_htlc_too_little_cltv(self, cln: CliCaller) -> None:
        _, payment_hash, invoice = add_hold_invoice(cln)
        amount = lnd(LndNode.One, "decodepayreq", invoice)["num_satoshis"]
        cln_node = cln("getinfo")["id"]

        routes = lnd(LndNode.One, "queryroutes", cln_node, amount)
        routes["routes"][0]["total_time_lock"] = 200
        routes["routes"][0]["hops"][0]["expiry"] = 200

        res = lnd(
            LndNode.One,
            "sendtoroute",
            "--payment_hash",
            payment_hash,
            format_json(routes),
        )

        assert res["status"] == "FAILED"
        assert res["failure"]["code"] == "INCORRECT_OR_UNKNOWN_PAYMENT_DETAILS"

        assert cln(
            "listholdinvoices",
            payment_hash,
        )["holdinvoices"][0]["state"] == "unpaid"

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

    @pytest.mark.skip("forwarding over the CLN node is broken in regtest setup")
    def test_ignore_forward(self, cln: CliCaller) -> None:
        cln_id = cln("getinfo")["id"]
        channels = lnd(LndNode.Two, "listchannels")["channels"]
        cln_channel = next(
            c for c in channels if c["remote_pubkey"] == cln_id
        )["chan_id"]

        invoice = lnd(LndNode.One, "addinvoice", "10000")["payment_request"]

        pay = LndPay(LndNode.Two, invoice, outgoing_chan_id=cln_channel)
        pay.start()
        pay.join()

        assert pay.res["status"] == "SUCCEEDED"
        assert len(pay.res["htlcs"][0]["route"]["hops"]) == 2

    def test_plugin_still_alive(self, cln: CliCaller) -> None:
        plugins = cln("plugin", "list")["plugins"]
        assert any(PLUGIN_PATH in plugin["name"] for plugin in plugins)
