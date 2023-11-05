from time import perf_counter
from typing import Any

from pyln.client import Millisatoshi, Plugin
from sqlalchemy.orm import Session

from plugins.mpay.data.network_info import NetworkInfo
from plugins.mpay.data.route_stats import RouteStats
from plugins.mpay.data.router import Router
from plugins.mpay.db.helpers import insert_failed_attempt, insert_successful_attempt
from plugins.mpay.db.models import Payment
from plugins.mpay.pay.channels import ChannelsHelper, NoRouteError, PeerChannels
from plugins.mpay.pay.excludes import ExcludesPayment
from plugins.mpay.pay.route import Route
from plugins.mpay.pay.sendpay import PaymentError, PaymentHelper, PaymentResult
from plugins.mpay.utils import fee_with_percent

_MAX_HOPS = 5


class PaymentTimeoutError(Exception):
    pass


class Payer:
    _pl: Plugin

    _router: Router
    _pay: PaymentHelper
    _channels: ChannelsHelper
    _network_info: NetworkInfo

    _excludes: ExcludesPayment

    _session: Session
    _payment: Payment

    _bolt11: str
    _dec: dict[str, Any]
    _amount: Millisatoshi

    _max_fee: Millisatoshi
    _timeout: int

    _start_time: float

    def __init__(
        self,
        pl: Plugin,
        router: Router,
        pay: PaymentHelper,
        channel: ChannelsHelper,
        network_info: NetworkInfo,
        excludes: ExcludesPayment,
        session: Session,
        payment: Payment,
        bolt11: str,
        dec: dict[str, Any],
        max_fee: Millisatoshi,
        timeout: int,
    ) -> None:
        self._pl = pl

        self._router = router
        self._pay = pay
        self._channels = channel
        self._network_info = network_info

        self._excludes = excludes

        self._session = session
        self._payment = payment

        self._bolt11 = bolt11
        self._dec = dec
        self._amount = dec["amount_msat"]

        self._max_fee = max_fee
        self._timeout = timeout

    def start(self) -> PaymentResult:
        self._start_time = perf_counter()

        peer_channels = self._channels.get_peer_channels()
        self._excludes.init_locals(peer_channels.get_exclude_list(self._amount))

        res = self._check_direct_channels(peer_channels)
        if res is not None:
            return res

        self._pl.log("Fetching known routes")
        for stats, route in self._router.fetch_routes(self._dec, self._amount, self._excludes):
            res = self._send_payment(
                route,
                stats,
            )
            if res is not None:
                return res

            self._check_timeout()

        self._pl.log("Ran out of known routes to try; falling back to getroute")
        for max_hops in range(2, _MAX_HOPS + 1):
            res = self._send_via_get_route(max_hops)
            if res is not None:
                return res

        raise NoRouteError

    def _check_direct_channels(self, peer_channels: PeerChannels) -> PaymentResult | None:
        direct_channels = peer_channels.get_direct_channels(self._dec["payee"], self._amount)
        if len(direct_channels) == 0:
            return None

        self._pl.log(f"Found {len(direct_channels)} suitable direct channels")
        return self._send_via_get_route(1)

    def _send_via_get_route(self, max_hops: int) -> PaymentResult | None:
        try:
            for route in self._channels.get_route(self._dec, self._excludes, max_hops):
                res = self._send_payment(
                    route,
                    None,
                )
                if res is not None:
                    return res

                self._check_timeout()

        except NoRouteError:
            return None

    def _send_payment(
        self,
        route: Route,
        stats: RouteStats | None,
    ) -> PaymentResult | None:
        if route.exceeds_fee(self._max_fee):
            self._pl.log(
                f"Not attempting route {route.pretty_print(self._network_info)}: "
                f"fee {fee_with_percent(self._amount, route.fee)} exceeds budget"
            )

            # TODO: more sophisticated approach
            most_expensive, fee = route.most_expensive_channel()
            most_expensive_id = Route.channel_to_short_id(most_expensive)
            self._excludes.add_local(most_expensive_id)

            self._pl.log(f"Excluding most expensive channel {most_expensive_id} ({fee})")

            return None

        route.add_cltv(self._dec["min_final_cltv_expiry"])
        self._pl.log(
            f"Attempting route for {self._payment.payment_hash} with fee "
            f"{fee_with_percent(self._amount, route.fee)}: "
            f"{route.pretty_print(self._network_info)}"
            f"{f' {stats.pretty_statistics}' if stats is not None else ''}"
        )

        try:
            res = self._pay.send(route, self._bolt11, self._dec)
        except PaymentError as e:
            # TODO: more granular handling of these errors
            self._excludes.add(f"{e.erring_channel}/{e.erring_direction}")
            insert_failed_attempt(self._session, self._payment, route, e)

            if e.is_permanent:
                raise

            return None

        insert_successful_attempt(self._session, self._payment, route, res.time)

        res.time = self._time_elapsed
        self._pl.log(
            f"Paid {self._payment.payment_hash} "
            f"with fee {fee_with_percent(self._amount, res.fee_msat)} "
            f"in {res.time}s via: {route.pretty_print(self._network_info)}"
        )

        return res

    @property
    def _time_elapsed(self) -> int:
        return round(perf_counter() - self._start_time)

    def _check_timeout(self) -> None:
        if self._time_elapsed > self._timeout:
            raise PaymentTimeoutError
