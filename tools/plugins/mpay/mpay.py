#!/usr/bin/env python3
import sys
from concurrent.futures import ThreadPoolExecutor
from typing import Any

from bolt11 import decode as bolt11_decode
from bolt11.exceptions import Bolt11Bech32InvalidException
from pyln.client import Plugin
from requests import Request

from plugins.mpay.async_methods import thread_method
from plugins.mpay.config import Config, register_options
from plugins.mpay.consts import PLUGIN_NAME, VERSION
from plugins.mpay.data.payments import Payments
from plugins.mpay.data.reset import Reset
from plugins.mpay.data.route_stats import RouteStatsFetcher
from plugins.mpay.db.db import Database
from plugins.mpay.errors import Errors
from plugins.mpay.pay.mpay import MPay
from plugins.mpay.utils import format_error

_EMPTY_VALUES = ["", "none", "null", None]

executor = ThreadPoolExecutor()

pl = Plugin()
register_options(pl)

db = Database(pl)
reset = Reset(pl, db)
payments_fetcher = Payments(pl, db)
route_stats_fetcher = RouteStatsFetcher(pl, db)

mpay = MPay(pl, db, route_stats_fetcher)


@pl.init()
def init(
    options: dict[str, Any],
    configuration: dict[str, Any],
    plugin: Plugin,
    **kwargs: dict[str, Any],
) -> None:
    try:
        cfg = Config(options)
        mpay.default_max_fee_perc = cfg.default_max_fee

        db.connect(
            cfg.postgres_host,
            cfg.postgres_port,
            cfg.postgres_db,
            cfg.postgres_user,
            cfg.postgres_password,
        )
        pl.log(f"Plugin {PLUGIN_NAME} v{VERSION} initialized")
    except BaseException as e:
        pl.log(f"Could not start {PLUGIN_NAME} v{VERSION}: {e}", level="warn")
        sys.exit(1)


@pl.subscribe("shutdown")
def shutdown(**kwargs: dict[str, Any]) -> None:
    pl.log(f"Plugin {PLUGIN_NAME} stopping")

    db.close()

    pl.log(f"Plugin {PLUGIN_NAME} stopped")
    sys.exit(0)


@pl.async_method(
    method_name="mpay",
    category=PLUGIN_NAME,
)
@thread_method(executor=executor)
def mpay_method(
    request: Request,
    bolt11: str = "",
    max_fee: int | None = None,
    exempt_fee: int = 21_000,
    timeout: int = 60,
) -> dict[str, Any]:
    if bolt11 == "":
        return Errors.no_bolt11

    if max_fee is not None and max_fee < 0:
        return Errors.no_negative_fee

    try:
        res = mpay.pay(bolt11, max_fee, exempt_fee, timeout)
    except BaseException as e:
        return {"error": format_error(e)}

    return res.to_dict()


@pl.async_method(
    method_name="mpay-routes",
    category=PLUGIN_NAME,
)
@thread_method(executor=executor)
def mpay_routes(
    request: Request, destination: str = "", min_success: float = 0, min_success_ema: float = 0
) -> dict[str, Any]:
    if destination != "":
        routes = route_stats_fetcher.get_routes(destination, min_success, min_success_ema)
        return {"routes": {destination: [route.__dict__ for route in routes]}}

    destinations = route_stats_fetcher.get_destinations()
    return {
        "routes": {
            dest: [
                route.__dict__
                for route in route_stats_fetcher.get_routes(dest, min_success, min_success_ema)
            ]
            for dest in destinations
        }
    }


@pl.async_method(
    method_name="mpay-list",
    category=PLUGIN_NAME,
)
@thread_method(executor=executor)
def mpay_list(request: Request, bolt11: str = "", payment_hash: str = "") -> dict[str, Any]:
    if bolt11 not in _EMPTY_VALUES:
        try:
            payment_hash = bolt11_decode(bolt11).payment_hash
        except Bolt11Bech32InvalidException:
            return Errors.invalid_bolt11

    if payment_hash not in _EMPTY_VALUES:
        payments = payments_fetcher.fetch(payment_hash)
    else:
        payments = payments_fetcher.fetch_all()

    return {"payments": payments}


@pl.async_method(
    method_name="mpay-resetpm",
    category=PLUGIN_NAME,
)
@thread_method(executor=executor)
def mpay_reset(request: Request) -> dict[str, Any]:
    return {"deleted": reset.reset_all()}


pl.run()
