#!/usr/bin/env python3
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Any

from bolt11 import decode as bolt11_decode
from bolt11.exceptions import Bolt11Bech32InvalidException
from pyln.client import Plugin
from requests import Request
from sqlalchemy.orm import Session

import plugins.mpay.defaults as defaults
from plugins.mpay.async_methods import thread_method
from plugins.mpay.config import Config, register_options
from plugins.mpay.consts import PLUGIN_NAME, VERSION
from plugins.mpay.data.payments import Payments
from plugins.mpay.data.route_stats import RouteStats
from plugins.mpay.data.routes import Routes
from plugins.mpay.db.db import Database
from plugins.mpay.errors import Errors
from plugins.mpay.pay.mpay import MPay
from plugins.mpay.rpc.server import Server
from plugins.mpay.utils import format_error

_EMPTY_VALUES = ["", "none", "null", None]

executor = ThreadPoolExecutor()

pl = Plugin()
register_options(pl)

db = Database(pl)

routes = Routes(pl, db)
mpay = MPay(pl, db, routes)

server = Server(pl, db, mpay, routes)


@pl.init()
def init(
    options: dict[str, Any],
    configuration: dict[str, Any],
    plugin: Plugin,
    **kwargs: dict[str, Any],
) -> None:
    try:
        Path(f"{pl.lightning_dir}/{PLUGIN_NAME}").mkdir(exist_ok=True)

        cfg = Config(pl, options)
        mpay.default_max_fee_perc = cfg.default_max_fee

        db.connect(cfg.db)
        mpay.init()
        executor.submit(routes.fetch_from_db)

        if cfg.grpc_port != -1:
            server.start(cfg.grpc_host, cfg.grpc_port, configuration["lightning-dir"])
        else:
            plugin.log("Not starting gRPC server")

        pl.log(f"Plugin {PLUGIN_NAME} v{VERSION} initialized")
    except BaseException as e:
        pl.log(f"Could not start {PLUGIN_NAME} v{VERSION}: {e}", level="warn")
        sys.exit(1)


@pl.subscribe("shutdown")
def shutdown(**kwargs: dict[str, Any]) -> None:
    pl.log(f"Plugin {PLUGIN_NAME} stopping")

    if server.is_running():
        server.stop()

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
    maxfee: int | None = None,
    exemptfee: int = defaults.EXEMPT_FEE,
    retry_for: int = defaults.PAYMENT_TIMEOUT,
    maxfeepercent: float =  defaults.MAX_FEEPERCENT,
    description: str | None = None,
    maxdelay : int | None = None,
    localinvreqid : str | None = None,
    exclude : list[str] | None = None,
) -> dict[str, Any]:

    # TODO: implement the following arguments
    arg = maxfeepercent or description or localinvreqid or exclude
    if arg:
        pl.log(f"mpay: `{arg}` not implemented yet", "debug")

    if bolt11 == "":
        return Errors.no_bolt11

    if maxfee is not None and maxfee < 0:
        return Errors.no_negative_fee

    res = mpay.pay(bolt11, maxfee, exemptfee, retry_for, maxdelay)
    return res.to_dict()


@pl.async_method(
    method_name="mpay-routes",
    category=PLUGIN_NAME,
)
@thread_method(executor=executor)
def mpay_routes(
    request: Request, destination: str = "", min_success: float = 0, min_success_ema: float = 0
) -> dict[str, Any]:
    def transform_route(route: RouteStats) -> dict[str, Any]:
        return {
            "route": list(route.route),
            "nodes": list(route.nodes),
            "success_rate": route.success_rate,
            "success_rate_ema": route.success_rate_ema,
        }

    if destination != "":
        res = {
            destination: [
                transform_route(route)
                for route in routes.get_routes(destination, min_success, min_success_ema)
            ]
        }
    else:
        destinations = routes.get_destinations()
        res = {
            dest: [
                transform_route(route)
                for route in routes.get_routes(dest, min_success, min_success_ema)
            ]
            for dest in destinations
        }

    for key in [k for k, v in res.items() if len(v) == 0]:
        del res[key]

    return {"routes": res}


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

    with Session(db.engine) as s:
        if payment_hash not in _EMPTY_VALUES:
            res = Payments.fetch(s, payment_hash)
        else:
            res = Payments.fetch_all(s)

        return {"payments": [payment.to_dict() for payment in res]}


@pl.async_method(
    method_name="mpay-resetpm",
    category=PLUGIN_NAME,
)
@thread_method(executor=executor)
def mpay_reset(request: Request) -> dict[str, Any]:
    return {"deleted": routes.reset().to_dict()}


pl.run()
