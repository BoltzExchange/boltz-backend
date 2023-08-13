import threading
from concurrent import futures
from queue import Empty
from typing import Callable, Iterable, TypeVar

import grpc
from encoder import Defaults
from enums import invoice_state_final

# noinspection PyProtectedMember
from grpc._server import _Server
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
    TrackAllRequest,
    TrackAllResponse,
    TrackRequest,
    TrackResponse,
)
from protos.hold_pb2_grpc import HoldServicer, add_HoldServicer_to_server
from pyln.client import Plugin
from transformers import INVOICE_STATE_TO_GRPC, Transformers

from hold import Hold, NoSuchInvoiceError


def handle_grpc_error(
    plugin: Plugin, method_name: str, context: grpc.ServicerContext, e: Exception
) -> None:
    estr = str(e) if str(e) != "" else repr(e)

    plugin.log(f"gRPC call {method_name} failed: {estr}", level="warn")
    context.abort(grpc.StatusCode.INTERNAL, estr)


T = TypeVar("T")


def optional_default(value: T | None, default: T, fallback: T) -> T:
    return value if value is not None and value != default else fallback


class HoldService(HoldServicer):
    def __init__(self, plugin: Plugin, hold: Hold) -> None:
        self._plugin = plugin
        self._hold = hold

    def Invoice(  # noqa: N802
        self, request: InvoiceRequest, context: grpc.ServicerContext  # noqa: ARG002
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
        self, request: SettleRequest, context: grpc.ServicerContext  # noqa: ARG002
    ) -> SettleResponse:
        self._hold.settle(request.payment_preimage)
        return SettleResponse()

    def Cancel(  # noqa: N802
        self, request: CancelRequest, context: grpc.ServicerContext  # noqa: ARG002
    ) -> CancelResponse:
        self._hold.cancel(request.payment_hash)
        return CancelResponse()

    def List(  # noqa: N802
        self, request: ListRequest, context: grpc.ServicerContext  # noqa: ARG002
    ) -> ListResponse:
        return ListResponse(
            invoices=[
                Transformers.invoice_to_grpc(inv)
                for inv in self._hold.list_invoices(request.payment_hash)
            ]
        )

    def Track(  # noqa: N802
        self, request: TrackRequest, context: grpc.ServicerContext
    ) -> Iterable[TrackResponse]:
        try:
            queue = self._hold.tracker.track(request.payment_hash)
            invoices = self._hold.list_invoices(request.payment_hash)

            if len(invoices) == 0:
                self._hold.tracker.stop_tracking(request.payment_hash, queue)
                raise NoSuchInvoiceError  # noqa: TRY301

            yield TrackResponse(state=INVOICE_STATE_TO_GRPC[invoices[0].state])

            while context.is_active():
                state = queue.get()
                yield TrackResponse(state=INVOICE_STATE_TO_GRPC[state])

                if invoice_state_final(state):
                    break

            self._hold.tracker.stop_tracking(request.payment_hash, queue)
        except Exception as e:
            handle_grpc_error(self._plugin, self.Track.__name__, context, e)

    def TrackAll(  # noqa: N802
        self, request: TrackAllRequest, context: grpc.ServicerContext  # noqa: ARG002
    ) -> Iterable[TrackAllResponse]:
        try:
            queue = self._hold.tracker.track_all()

            while context.is_active():
                # Trick to stop the stream when the client cancels
                try:
                    ev = queue.get(block=True, timeout=1)
                    yield TrackAllResponse(
                        payment_hash=ev.payment_hash,
                        state=INVOICE_STATE_TO_GRPC[ev.update],
                    )
                except Empty:  # noqa: PERF203
                    pass
        except Exception as e:
            handle_grpc_error(self._plugin, self.TrackAll.__name__, context, e)


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
            handle_grpc_error(self._plugin, method_name, context, e)


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
        add_HoldServicer_to_server(HoldService(self._plugin, self._hold), self._server)

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
