import json
import os
from collections.abc import Callable
from typing import Any

CliCaller = Callable[..., dict[str, Any]]


def cln_con(*args: str) -> dict[str, Any]:
    return json.load(os.popen(
        f"docker exec regtest lightning-cli {' '.join(args)}",
    ))
