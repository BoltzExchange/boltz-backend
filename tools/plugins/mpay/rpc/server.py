import grpc
from bolt11 import decode as bolt11_decode
from pyln.client import Plugin
from sqlalchemy.orm import Session

from plugins.hold.grpc_server import GrpcServer
from plugins.mpay.consts import PLUGIN_NAME, VERSION
from plugins.mpay.data.payments import Payments
from plugins.mpay.data.routes import Routes
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
    _routes: Routes

    def __init__(
        self,
        db: Database,
        mpay: MPay,
        routes: Routes,
    ) -> None:
        self._db = db
        self._mpay = mpay
        self._routes = routes

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
            max_delay=request.max_delay if request.max_delay != 0 else None,
        )

        return PayResponse(
            destination=res.destination,
            payment_hash=res.payment_hash,
            payment_preimage=res.payment_preimage,
            amount_msat=int(res.amount_msat),
            amount_sent_msat=int(res.amount_sent_msat),
            fee_msat=int(res.fee_msat),
            parts=res.parts,
            status=res.status,
            time=res.time,
            created_at=res.created_at,
        )

    def GetRoutes(  # noqa: N802
        self,
        request: GetRoutesRequest,
        context: grpc.ServicerContext,  # noqa: ARG002
    ) -> GetRoutesResponse:
        if request.destination != "":
            destinations = [request.destination]
        else:
            destinations = self._routes.get_destinations()

        routes = {
            dest: routes_to_grpc(
                self._routes.get_routes(dest, request.min_success, request.min_success_ema)
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

        with (Session(self._db.engine) as s):
            if payment_hash != "":
                res = Payments.fetch(s, payment_hash)
            elif request.HasField("pagination"):
                res = Payments.fetch_paginated(s, request.pagination.offset, request.pagination.limit)
            else:
                res = Payments.fetch_all(s)
            return ListPaymentsResponse(payments=[payment_to_grpc(payment) for payment in res])

    def ResetPathMemory(  # noqa: N802
        self,
        request: ResetPathMemoryRequest,
        context: grpc.ServicerContext,  # noqa: ARG002
    ) -> ResetPathMemoryResponse:
        if not request.exclude_temporary_memory:
            self._mpay.reset_excludes()

        if not request.exclude_permanent_memory:
            res = self._routes.reset()
            return ResetPathMemoryResponse(
                payments=res.payments,
                attempts=res.attempts,
                hops=res.hops,
            )

        return ResetPathMemoryResponse(
            payments=0,
            attempts=0,
            hops=0,
        )


class Server(GrpcServer):
    _db: Database
    _mpay: MPay
    _routes: Routes

    def __init__(
        self,
        pl: Plugin,
        db: Database,
        mpay: MPay,
        routes: Routes,
    ) -> None:
        super().__init__(PLUGIN_NAME, pl)

        self._db = db
        self._mpay = mpay
        self._routes = routes

    def _register_service(self) -> None:
        add_MpayServicer_to_server(
            MpayService(self._db, self._mpay, self._routes),
            self._server,
        )
