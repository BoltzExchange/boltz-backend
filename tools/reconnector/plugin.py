#!/usr/bin/env python3

import sys
from typing import Any

from consts import PLUGIN_NAME, VERSION
from pyln.client import Plugin
from reconnector_config import Config, register_options

from reconnector import Reconnector

pl = Plugin()
register_options(pl)

rec = Reconnector(pl)


@pl.init()
def init(
    options: dict[str, Any],
    configuration: dict[str, Any],
    plugin: Plugin,
    **kwargs: dict[str, Any],
) -> None:
    cfg = Config(pl, options)
    rec.init(cfg)

    pl.log(f"Plugin {PLUGIN_NAME} v{VERSION} initialized")


@pl.subscribe("shutdown")
def shutdown(**kwargs: dict[str, Any]) -> None:
    pl.log(f"Plugin {PLUGIN_NAME} stopping")
    rec.stop()

    pl.log(f"Plugin {PLUGIN_NAME} stopped")
    sys.exit(0)


pl.run()
