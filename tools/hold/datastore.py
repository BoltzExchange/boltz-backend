from dataclasses import dataclass
from enum import Enum
from typing import Any

from consts import PLUGIN_NAME
from invoice import HoldInvoice
from pyln.client import Plugin, RpcError
from settler import Htlc, Settler


class DataErrorCodes(int, Enum):
    KeyDoesNotExist = 1200
    KeyExists = 1202


@dataclass
class HoldInvoiceHtlcs:
    invoice: HoldInvoice
    htlcs: list[Htlc]


class DataStore:
    _plugin: Plugin
    _settler: Settler
    _invoices_key = "invoices"

    def __init__(self, plugin: Plugin, settler: Settler) -> None:
        self._plugin = plugin
        self._settler = settler

    # TODO: save creation time
    def save_invoice(self, invoice: HoldInvoice, mode: str = "must-create") -> None:
        self._plugin.rpc.datastore(
            key=[PLUGIN_NAME, DataStore._invoices_key, invoice.payment_hash],
            string=invoice.to_json(),
            mode=mode,
        )

    def list_invoices(self, payment_hash: str | None) -> list[HoldInvoiceHtlcs]:
        key = [PLUGIN_NAME, DataStore._invoices_key]
        if payment_hash is not None:
            key.append(payment_hash)

        return self._add_htlcs(
            self._parse_invoices(
                self._plugin.rpc.listdatastore(
                    key=key,
                )
            )
        )

    def get_invoice(self, payment_hash: str) -> HoldInvoiceHtlcs | None:
        invoices = self.list_invoices(payment_hash)
        if len(invoices) == 0:
            return None

        return invoices[0]

    def delete_invoice(self, payment_hash: str) -> bool:
        try:
            self._plugin.rpc.deldatastore(
                [PLUGIN_NAME, DataStore._invoices_key, payment_hash],
            )
        except RpcError as e:
            # noinspection PyTypeChecker
            if e.error["code"] == DataErrorCodes.KeyDoesNotExist:
                return False

            raise

        return True

    def settle_invoice(self, invoice: HoldInvoice, preimage: str) -> None:
        # TODO: save in the normal invoice table of CLN
        invoice.payment_preimage = preimage
        self._settler.settle(invoice)
        self.save_invoice(invoice, mode="must-replace")

    def cancel_invoice(self, invoice: HoldInvoice) -> None:
        self._settler.cancel(invoice)
        self.save_invoice(invoice, mode="must-replace")

    def delete_invoices(self) -> int:
        key = [PLUGIN_NAME, DataStore._invoices_key]
        invoices = self._plugin.rpc.listdatastore(key=key)["datastore"]
        for invoice in invoices:
            # TODO: also cancel?
            self._plugin.rpc.deldatastore(invoice["key"])

        return len(invoices)

    def _add_htlcs(self, invoices: list[HoldInvoice]) -> list[HoldInvoiceHtlcs]:
        return [
            HoldInvoiceHtlcs(
                invoice=invoice,
                htlcs=self._settler.htlcs[invoice.payment_hash].htlcs
                if invoice.payment_hash in self._settler.htlcs
                else [],
            )
            for invoice in invoices
        ]

    @staticmethod
    def _parse_invoices(data: dict[str, Any]) -> list[HoldInvoice]:
        return [HoldInvoice.from_json(i["string"]) for i in data["datastore"]]
