import json
from enum import Enum
from typing import Any

from consts import PLUGIN_NAME
from pyln.client import Plugin


class OptionKeys(str, Enum):
    CheckInterval = f"{PLUGIN_NAME}-check-interval"
    CustomUris = f"{PLUGIN_NAME}-custom-uris"


class OptionDefaults(str, Enum):
    CheckInterval = "120"
    CustomUris = "[]"


def register_options(pl: Plugin) -> None:
    pl.add_option(
        OptionKeys.CheckInterval,
        OptionDefaults.CheckInterval,
        "interval in seconds to check for disabled channels",
    )
    pl.add_option(
        OptionKeys.CustomUris,
        OptionDefaults.CustomUris,
        "list of URIs that should be used instead of the publicly announced ones",
    )


class Config:
    check_interval: int
    custom_uris: dict[str, str]

    def __init__(self, pl: Plugin, configuration: dict[str, Any]) -> None:
        self.check_interval = int(configuration[OptionKeys.CheckInterval])

        try:
            self.custom_uris = Config._parse_uris(pl, configuration[OptionKeys.CustomUris])
        except Exception as e:
            pl.log(f"Could not decode custom URIs: {e!s}", level="warn")
            self.custom_uris = {}

    @staticmethod
    def _parse_uris(pl: Plugin, uris_str: str) -> dict[str, str]:
        uris_list: list[str] = json.loads(uris_str)
        if not isinstance(uris_list, list):
            msg = "not a list"
            raise TypeError(msg)

        uris: dict[str, str] = {}

        for uri in uris_list:
            split = uri.split("@")
            if len(split) != 2:
                pl.log(f'Ignoring custom URI because of invalid format: "{uri}"')
                continue

            uris[split[0].lower()] = uri

        return uris
