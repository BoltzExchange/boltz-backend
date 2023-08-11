#!/usr/bin/env python3
import json
from datetime import datetime, timezone
from enum import Enum
from typing import Any

from pyln.client import Plugin
from webdav3.client import Client, unquote

PLUGIN_NAME = "backup"

BACKUP_UPLOAD_DESC = "Upload a backup of the current SCB to the configured WebDAV"


class OptionKeys(str, Enum):
    WebDavHost = f"{PLUGIN_NAME}-webdav-host"
    WebDavUser = f"{PLUGIN_NAME}-webdav-user"
    WebDavPassword = f"{PLUGIN_NAME}-webdav-password"


class WebDav:
    plugin: Plugin
    client: Client = None

    def init(self, plugin: Plugin, host: str, user: str, password: str) -> None:
        self.plugin = plugin

        client = Client({
            "webdav_hostname": host,
            "webdav_login": user,
            "webdav_password": password,
        })
        # Sanity check the configuration
        client.info(unquote(client.root))
        self.client = client

    def upload_backup(self) -> None:
        if self.client is None:
            msg = "plugin was misconfigured"
            raise ValueError(msg)

        scb = self.plugin.rpc.call("staticbackup")
        date = datetime.now(tz=timezone.utc).strftime("%Y-%m-%d-%H-%M-%S")
        file_name = f"scb-{date}.txt"
        self.plugin.log(f"Uploading SCB {file_name} with {len(scb['scb'])} SCBs")

        self.client.execute_request(
            "upload",
            f"{unquote(self.client.root)}{file_name}",
            json.dumps(scb),
        )


pl = Plugin()
wd = WebDav()


@pl.init()
def init(
        plugin: Plugin,
        options: dict[str, Any],
        configuration: dict[str: Any],
        **kwargs: dict[str, Any],
) -> None:
    host = options[OptionKeys.WebDavHost]

    def log_could_not_init(msg: str) -> None:
        plugin.log(
            f"Plugin {PLUGIN_NAME} could not be initialized because: {msg}",
            level="warn",
        )

    if host == "":
        log_could_not_init("WebDAV host is missing")
        return

    try:
        wd.init(
            host=host,
            plugin=plugin,
            user=options[OptionKeys.WebDavUser],
            password=options[OptionKeys.WebDavPassword],
        )
        plugin.log(f"Plugin {PLUGIN_NAME} initialized")

    except Exception as e:
        log_could_not_init(str(e))


@pl.method(
    "backup-upload",
    category="backup",
    desc=BACKUP_UPLOAD_DESC,
    long_desc=BACKUP_UPLOAD_DESC,
)
def backup_upload(plugin: Plugin) -> dict[str, Any]:
    try:
        wd.upload_backup()
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
        }

    return {
        "status": "success",
    }


@pl.subscribe("channel_opened")
def on_channel(
        plugin: Plugin,
        channel_opened: dict[str, Any],
        **kwargs: dict[str, Any],
) -> None:
    try:
        wd.upload_backup()
    except Exception as e:
        plugin.log(f"Could not upload SCB: {e!s}")


pl.add_option(OptionKeys.WebDavHost, "", "Host of the backup WebDav server")
pl.add_option(OptionKeys.WebDavUser, "", "Username for the backup WebDav server")
pl.add_option(OptionKeys.WebDavPassword, "", "Password for the backup WebDav server")

pl.run()
