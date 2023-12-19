import grpc
from bolt11 import decode as bolt11_decode
from pyln.client import Plugin
from sqlalchemy.orm import Session

from plugins.hold.grpc_server import GrpcServer
from plugins.mpay.consts import PLUGIN_NAME, VERSION
from plugins.mpay.data.payments import Payments
from plugins.mpay.data.reset import Reset
from plugins.mpay.data.route_stats import RouteStatsFetcher
from plugins.mpay.db.db import Database
from plugins.mpay.defaults import DEFAULT_EXEMPT_FEE, DEFAULT_PAYMENT_TIMEOUT
from plugins.mpay.pay.mpay import MPay
from plugins.mpay.protos.mpay_pb2 import (
    GetInfoRequest,
    GetInfoResponse,
    GetRoutesRequest,
    GetRoutesResponse,
    ListPaymentsRequest,
    ListPaymentsResponse,
    PayRequest,
    PayResponse,
    ResetPathMemoryRequest,
    ResetPathMemoryResponse,
)
from plugins.mpay.protos.mpay_pb2_grpc import MpayServicer, add_MpayServicer_to_server
from plugins.mpay.rpc.transformers import payment_to_grpc, routes_to_grpc


class MpayService(MpayServicer):
    _db: Database
    _mpay: MPay
    _reset: Reset
    _route_stats_fetcher: RouteStatsFetcher

    def __init__(
        self,
        db: Database,
        mpay: MPay,
        route_stats_fetcher: RouteStatsFetcher,
        reset: Reset,
    ) -> None:
        self._db = db
        self._mpay = mpay
        self._reset = reset
        self._route_stats_fetcher = route_stats_fetcher

    def GetInfo(self, request: GetInfoRequest, context: grpc.ServicerContext) -> GetInfoResponse:  # noqa: N802, ARG002
        return GetInfoResponse(version=VERSION)

    def Pay(self, request: PayRequest, context: grpc.ServicerContext) -> PayResponse:  # noqa: N802, ARG002
        res = self._mpay.pay(
            bolt11=request.bolt11,
            max_fee=request.max_fee_msat if request.max_fee_msat != 0 else None,
            exempt_fee=request.exempt_fee_msat
            if request.exempt_fee_msat != 0
            else DEFAULT_EXEMPT_FEE,
            timeout=request.timeout if request.timeout != 0 else DEFAULT_PAYMENT_TIMEOUT,
        )

        return PayResponse(
            payment_hash=res.payment_hash,
            payment_preimage=res.payment_preimage,
            fee_msat=int(res.fee_msat),
            time=res.time,
        )

    def GetRoutes(  # noqa: N802
        self,
        request: GetRoutesRequest,
        context: grpc.ServicerContext,  # noqa: ARG002
    ) -> GetRoutesResponse:
        with Session(self._db.engine) as s:
            if request.destination != "":
                destinations = [request.destination]
            else:
                destinations = self._route_stats_fetcher.get_destinations(s)

            routes = {
                dest: routes_to_grpc(
                    self._route_stats_fetcher.get_routes(
                        s, dest, request.min_success, request.min_success_ema
                    )
                )
                for dest in destinations
            }

        for key in [k for k, v in routes.items() if len(v.routes) == 0]:
            del routes[key]

        return GetRoutesResponse(routes=routes)

    def ListPayments(  # noqa: N802
        self,
        request: ListPaymentsRequest,
        context: grpc.ServicerContext,  # noqa: ARG002
    ) -> ListPaymentsResponse:
        payment_hash = request.payment_hash

        if request.bolt11 != "":
            payment_hash = bolt11_decode(request.bolt11).payment_hash

        with Session(self._db.engine) as s:
            res = Payments.fetch(s, payment_hash) if payment_hash != "" else Payments.fetch_all(s)
            return ListPaymentsResponse(payments=[payment_to_grpc(payment) for payment in res])

    def ResetPathMemory(  # noqa: N802
        self,
        request: ResetPathMemoryRequest,  # noqa: ARG002
        context: grpc.ServicerContext,  # noqa: ARG002
    ) -> ResetPathMemoryResponse:
        with Session(self._db.engine) as s:
            res = self._reset.reset_all(s)

        return ResetPathMemoryResponse(
            payments=res.payments,
            attempts=res.attempts,
            hops=res.hops,
        )


class Server(GrpcServer):
    _db: Database
    _mpay: MPay
    _reset: Reset
    _route_stats_fetcher: RouteStatsFetcher

    def __init__(
        self,
        pl: Plugin,
        db: Database,
        mpay: MPay,
        route_stats_fetcher: RouteStatsFetcher,
        reset: Reset,
    ) -> None:
        super().__init__(PLUGIN_NAME, pl)

        self._db = db
        self._mpay = mpay
        self._reset = reset
        self._route_stats_fetcher = route_stats_fetcher

    def _register_service(self) -> None:
        add_MpayServicer_to_server(
            MpayService(self._db, self._mpay, self._route_stats_fetcher, self._reset),
            self._server,
        )
