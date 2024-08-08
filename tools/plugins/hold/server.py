from collections.abc import Iterable
from queue import Empty
from typing import TypeVar

import grpc
from pyln.client import Plugin

from plugins.hold.consts import PLUGIN_NAME, VERSION
from plugins.hold.encoder import Defaults
from plugins.hold.enums import invoice_state_final
from plugins.hold.grpc_server import GrpcServer, handle_grpc_error
from plugins.hold.hold import Hold, NoSuchInvoiceError
from plugins.hold.protos.hold_pb2 import (
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
from plugins.hold.protos.hold_pb2_grpc import HoldServicer, add_HoldServicer_to_server
from plugins.hold.transformers import INVOICE_STATE_TO_GRPC, Transformers

T = TypeVar("T")


def optional_default(value: T | None, default: T, fallback: T) -> T:
    return value if value is not None and value != default else fallback


class HoldService(HoldServicer):
    def __init__(self, plugin: Plugin, hold: Hold) -> None:
        self._plugin = plugin
        self._hold = hold

    def GetInfo(  # noqa: N802
        self,
        request: GetInfoRequest,  # noqa: ARG002
        context: grpc.ServicerContext,  # noqa: ARG002
    ) -> GetInfoResponse:
        return GetInfoResponse(version=VERSION)

    def Invoice(  # noqa: N802
        self,
        request: InvoiceRequest,
        context: grpc.ServicerContext,  # noqa: ARG002
    ) -> InvoiceResponse:
        return InvoiceResponse(
            bolt11=self._hold.invoice(
                request.payment_hash,
                request.amount_msat,
                request.description,
                request.description_hash,
                optional_default(request.expiry, 0, Defaults.Expiry),
                optional_default(
                    request.min_final_cltv_expiry,
                    0,
                    Defaults.MinFinalCltvExpiry,
                ),
                Transformers.routing_hints_from_grpc(list(request.routing_hints)),
            )
        )

    def RoutingHints(  # noqa: N802
        self,
        request: RoutingHintsRequest,
        context: grpc.ServicerContext,  # noqa: ARG002
    ) -> RoutingHintsResponse:
        return Transformers.routing_hints_to_grpc(self._hold.get_private_channels(request.node))

    def List(  # noqa: N802
        self,
        request: ListRequest,
        context: grpc.ServicerContext,  # noqa: ARG002
    ) -> ListResponse:
        return ListResponse(
            invoices=[
                Transformers.invoice_to_grpc(inv)
                for inv in self._hold.list_invoices(request.payment_hash)
            ]
        )

    def Settle(  # noqa: N802
        self,
        request: SettleRequest,
        context: grpc.ServicerContext,  # noqa: ARG002
    ) -> SettleResponse:
        self._hold.settle(request.payment_preimage)
        return SettleResponse()

    def Cancel(  # noqa: N802
        self,
        request: CancelRequest,
        context: grpc.ServicerContext,  # noqa: ARG002
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
        self,
        request: TrackAllRequest,  # noqa: ARG002
        context: grpc.ServicerContext,
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
        self,
        request: PayStatusRequest,
        context: grpc.ServicerContext,  # noqa: ARG002
    ) -> PayStatusResponse:
        return Transformers.pay_status_response_to_grpc(
            self._plugin.rpc.paystatus(request.bolt11 if request.bolt11 != "" else None)
        )

    def GetRoute(  # noqa: N802
        self,
        request: GetRouteRequest,
        context: grpc.ServicerContext,  # noqa: ARG002
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


class Server(GrpcServer):
    _hold: Hold

    def __init__(self, plugin: Plugin, hold: Hold) -> None:
        super().__init__(PLUGIN_NAME, plugin)
        self._hold = hold

    def _register_service(self) -> None:
        add_HoldServicer_to_server(HoldService(self._plugin, self._hold), self._server)
