import threading
from concurrent import futures
from typing import Callable, TypeVar

import grpc
from encoder import Defaults

# noinspection PyProtectedMember
from grpc._server import _Context, _Server
from grpc_interceptor import ServerInterceptor
from protos.hold_pb2 import (
    CancelRequest,
    CancelResponse,
    InvoiceRequest,
    InvoiceResponse,
    ListRequest,
    ListResponse,
    SettleRequest,
    SettleResponse,
)
from protos.hold_pb2_grpc import HoldServicer, add_HoldServicer_to_server
from pyln.client import Plugin
from transformers import Transformers

from hold import Hold

T = TypeVar("T")


def optional_default(value: T | None, default: T, fallback: T) -> T:
    return value if value is not None and value != default else fallback


class HoldService(HoldServicer):
    def __init__(self, hold: Hold) -> None:
        self._hold = hold

    def Invoice(  # noqa: N802
        self, request: InvoiceRequest, context: _Context  # noqa: ARG002
    ) -> InvoiceResponse:
        return InvoiceResponse(
            bolt11=self._hold.invoice(
                request.payment_hash,
                request.amount_msat,
                request.description,
                optional_default(request.expiry, 0, Defaults.Expiry),
                optional_default(
                    request.min_final_cltv_expiry, 0, Defaults.MinFinalCltvExpiry
                ),
            )
        )

    def Settle(  # noqa: N802
        self, request: SettleRequest, context: _Context  # noqa: ARG002
    ) -> SettleResponse:
        self._hold.settle(request.payment_preimage)
        return SettleResponse()

    def Cancel(  # noqa: N802
        self, request: CancelRequest, context: _Context  # noqa: ARG002
    ) -> CancelResponse:
        self._hold.cancel(request.payment_hash)
        return CancelResponse()

    def List(  # noqa: N802
        self, request: ListRequest, context: _Context  # noqa: ARG002
    ) -> ListResponse:
        return ListResponse(
            invoices=[
                Transformers.invoice_to_grpc(inv)
                for inv in self._hold.list_invoices(request.payment_hash)
            ]
        )


class ServerError(Exception):
    def __init__(self, message: str) -> None:
        super().__init__(message)


class LogInterceptor(ServerInterceptor):
    _plugin: Plugin

    def __init__(self, plugin: Plugin) -> None:
        self._plugin = plugin

    def intercept(
        self,
        method: Callable,
        request: object,
        context: grpc.ServicerContext,
        method_name: str,
    ) -> object:
        try:
            self._plugin.log(f"gRPC call {method_name}", level="debug")
            return method(request, context)
        except Exception as e:
            estr = str(e) if str(e) != "" else repr(e)

            self._plugin.log(f"gRPC call {method_name} failed: {estr}", level="warn")
            context.abort(grpc.StatusCode.INTERNAL, estr)


class Server:
    _hold: Hold

    _plugin: Plugin
    _server: _Server | None

    _server_thread: threading.Thread

    def __init__(self, plugin: Plugin, hold: Hold) -> None:
        self._hold = hold
        self._plugin = plugin

    def start(self, host: str, port: int) -> None:
        # TODO: authentication (same as cln itself?)
        self._server = grpc.server(
            futures.ThreadPoolExecutor(), interceptors=[LogInterceptor(self._plugin)]
        )
        add_HoldServicer_to_server(HoldService(self._hold), self._server)

        address = f"{host}:{port}"
        self._server.add_insecure_port(address)

        def start_server() -> None:
            self._server.start()

            self._plugin.log(f"Started gRPC server on {address}")
            self._server.wait_for_termination()

        self._server_thread = threading.Thread(target=start_server)
        self._server_thread.start()

    def stop(self) -> None:
        if self._server is not None:
            self._server.stop(False)
            self._server_thread.join()
            self._plugin.log("Stopped gRPC server")
        else:
            msg = "server not running"
            raise ServerError(msg)
