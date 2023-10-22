import threading
from collections.abc import Callable, Iterable
from concurrent import futures
from queue import Empty
from typing import TypeVar

import grpc
from certs import load_certs
from consts import VERSION
from encoder import Defaults
from enums import invoice_state_final
from grpc_interceptor import ServerInterceptor
from protos.hold_pb2 import (
    CancelRequest,
    CancelResponse,
    GetInfoRequest,
    GetInfoResponse,
    GetRouteRequest,
    GetRouteResponse,
    InvoiceRequest,
    InvoiceResponse,
    ListRequest,
    ListResponse,
    PayStatusRequest,
    PayStatusResponse,
    RoutingHintsRequest,
    RoutingHintsResponse,
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

    def GetInfo(  # noqa: N802
        self, request: GetInfoRequest, context: grpc.ServicerContext  # noqa: ARG002
    ) -> GetInfoResponse:
        return GetInfoResponse(version=VERSION)

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
                Transformers.routing_hints_from_grpc(list(request.routing_hints)),
            )
        )

    def RoutingHints(  # noqa: N802
        self,
        request: RoutingHintsRequest,
        context: grpc.ServicerContext,  # noqa: ARG002
    ) -> RoutingHintsResponse:
        return Transformers.routing_hints_to_grpc(
            self._hold.get_private_channels(request.node)
        )

    def List(  # noqa: N802
        self, request: ListRequest, context: grpc.ServicerContext  # noqa: ARG002
    ) -> ListResponse:
        return ListResponse(
            invoices=[
                Transformers.invoice_to_grpc(inv)
                for inv in self._hold.list_invoices(request.payment_hash)
            ]
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
                        bolt11=ev.bolt11,
                        state=INVOICE_STATE_TO_GRPC[ev.update],
                    )
                except Empty:  # noqa: PERF203
                    pass

        except Exception as e:
            handle_grpc_error(self._plugin, self.TrackAll.__name__, context, e)

    def PayStatus(  # noqa: N802
        self, request: PayStatusRequest, context: grpc.ServicerContext  # noqa: ARG002
    ) -> PayStatusResponse:
        return Transformers.pay_status_response_to_grpc(
            self._plugin.rpc.paystatus(request.bolt11 if request.bolt11 != "" else None)
        )

    def GetRoute(  # noqa: N802
        self, request: GetRouteRequest, context: grpc.ServicerContext  # noqa: ARG002
    ) -> GetRouteResponse:
        route = self._hold.router.get_route(
            request.destination,
            request.amount_msat,
            request.risk_factor,
            request.max_cltv if request.max_cltv != 0 else None,
            request.final_cltv_delta if request.final_cltv_delta != 0 else None,
            request.max_retries if request.max_retries != 0 else None,
        )
        return GetRouteResponse(
            hops=Transformers.route_to_grpc(route),
            fees_msat=route[0].amount_msat - request.amount_msat,
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
            handle_grpc_error(self._plugin, method_name, context, e)


class Server:
    _hold: Hold

    _plugin: Plugin
    _server: grpc.Server | None

    _server_thread: threading.Thread

    def __init__(self, plugin: Plugin, hold: Hold) -> None:
        self._hold = hold
        self._plugin = plugin
        self._server = None

    def start(self, host: str, port: int, lightning_dir: str | None) -> None:
        self._server = grpc.server(
            futures.ThreadPoolExecutor(), interceptors=[LogInterceptor(self._plugin)]
        )
        add_HoldServicer_to_server(HoldService(self._plugin, self._hold), self._server)

        address = f"{host}:{port}"

        if lightning_dir is not None:
            ca_cert, server_cert = load_certs(f"{lightning_dir}/hold")
            self._server.add_secure_port(
                address,
                grpc.ssl_server_credentials(
                    [(server_cert.key, server_cert.cert)], ca_cert.cert, True
                ),
            )
        else:
            self._server.add_insecure_port(address)

        def start_server() -> None:
            self._server.start()

            self._plugin.log(f"Started gRPC server on {address}")
            self._server.wait_for_termination()

        self._server_thread = threading.Thread(target=start_server)
        self._server_thread.start()

    def is_running(self) -> bool:
        return self._server is not None

    def stop(self) -> None:
        if self.is_running():
            self._server.stop(False)
            self._server_thread.join()
            self._plugin.log("Stopped gRPC server")
        else:
            msg = "server not running"
            raise ServerError(msg)
