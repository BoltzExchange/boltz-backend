#!/usr/bin/env python3
import json
import sys
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from io import BytesIO
from typing import Any

from minio import Minio
from pyln.client import Plugin
from strenum import StrEnum
from webdav3.client import Client, unquote

PLUGIN_NAME = "backup"

BACKUP_UPLOAD_DESC = "Upload a backup of the current SCB to the configured WebDAV"


class OptionKeys(StrEnum):
    WebDavHost = f"{PLUGIN_NAME}-webdav-host"
    WebDavUser = f"{PLUGIN_NAME}-webdav-user"
    WebDavPassword = f"{PLUGIN_NAME}-webdav-password"

    S3Endpoint = f"{PLUGIN_NAME}-s3-endpoint"
    S3Bucket = f"{PLUGIN_NAME}-s3-bucket"
    S3Path = f"{PLUGIN_NAME}-s3-path"
    S3AccessKey = f"{PLUGIN_NAME}-s3-access-key"
    S3SecretKey = f"{PLUGIN_NAME}-s3-secret-key"


class Provider(ABC):
    client: Any | None = None

    @abstractmethod
    def upload_scb(self, file_name: str, data: object) -> None:
        pass


class WebDav(Provider):
    client: Client | None = None

    def init(self, host: str, user: str, password: str) -> None:
        client = Client(
            {
                "webdav_hostname": host,
                "webdav_login": user,
                "webdav_password": password,
            }
        )
        # Sanity check the configuration
        client.info(unquote(client.root))
        self.client = client

    def upload_scb(self, file_name: str, data: object) -> None:
        self.client.execute_request(
            "upload",
            f"{unquote(self.client.root)}{file_name}",
            json.dumps(data),
        )


class S3(Provider):
    client: Minio | None = None
    bucket: str | None = None
    path: str | None = None

    def init(
        self,
        endpoint: str,
        bucket: str,
        path: str,
        access_key: str,
        secret_key: str,
    ) -> None:
        client = Minio(endpoint, access_key=access_key, secret_key=secret_key)
        # Sanity check the client
        if not client.bucket_exists(bucket):
            msg = "plugin misconfigured: bucket does not exist"
            raise ValueError(msg)

        self.client = client
        self.bucket = bucket
        self.path = f"{path.rstrip('/')}/"

    def upload_scb(self, file_name: str, data: object) -> None:
        to_upload = BytesIO(json.dumps(data).encode("utf-8"))
        self.client.put_object(
            self.bucket,
            f"{self.path}{file_name}",
            to_upload,
            len(to_upload.getvalue()),
            "application/json",
        )


class Backup:
    plugin: Plugin
    providers: list[Provider]

    def init(self, plugin: Plugin, options: dict[str, Any]) -> None:
        self.plugin = plugin
        self.providers = []

        webdav = WebDav()
        if options[OptionKeys.WebDavHost] != "":
            self.plugin.log("Enabling WebDav backups")
            webdav.init(
                options[OptionKeys.WebDavHost],
                options[OptionKeys.WebDavUser],
                options[OptionKeys.WebDavPassword],
            )
            self.providers.append(webdav)

        s3 = S3()
        if options[OptionKeys.S3Endpoint] != "":
            self.plugin.log("Enabling S3 backups")
            s3.init(
                options[OptionKeys.S3Endpoint],
                options[OptionKeys.S3Bucket],
                options[OptionKeys.S3Path],
                options[OptionKeys.S3AccessKey],
                options[OptionKeys.S3SecretKey],
            )
            self.providers.append(s3)

    def upload_backup(self) -> None:
        if len(self.providers) == 0:
            msg = "plugin misconfigured"
            raise ValueError(msg)

        scb = self.plugin.rpc.call("staticbackup")
        date = datetime.now(tz=timezone.utc).strftime("%Y-%m-%d-%H-%M-%S")
        file_name = f"scb-{date}.json"
        self.plugin.log(f"Uploading SCB {file_name} with {len(scb['scb'])} channels")

        for provider in self.providers:
            provider.upload_scb(file_name, scb)


pl = Plugin()
backup = Backup()


@pl.init()
def init(
    plugin: Plugin,
    options: dict[str, Any],
    configuration: dict[str, Any],
    **kwargs: dict[str, Any],
) -> None:
    try:
        backup.init(
            plugin,
            options,
        )
        plugin.log(f"Plugin {PLUGIN_NAME} initialized")
        backup.upload_backup()
    except Exception as e:
        plugin.log(
            f"Plugin {PLUGIN_NAME} could not be initialized because: {e}",
            level="warn",
        )
        sys.exit(1)


@pl.method(
    "backup-upload",
    category="backup",
    desc=BACKUP_UPLOAD_DESC,
    long_desc=BACKUP_UPLOAD_DESC,
)
def backup_upload(plugin: Plugin) -> dict[str, Any]:
    """Upload a backup of the current SCB to the configured WebDAV."""
    try:
        backup.upload_backup()
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
        backup.upload_backup()
    except Exception as e:
        plugin.log(f"Could not upload SCB: {e!s}")


pl.add_option(OptionKeys.WebDavHost, "", "Host of the backup WebDav server")
pl.add_option(OptionKeys.WebDavUser, "", "Username for the backup WebDav server")
pl.add_option(OptionKeys.WebDavPassword, "", "Password for the backup WebDav server")

pl.add_option(OptionKeys.S3Endpoint, "", "Endpoint of the S3 compatible API")
pl.add_option(OptionKeys.S3Bucket, "", "S3 bucket to use")
pl.add_option(OptionKeys.S3Path, "", "Path to store the S3 backups in")
pl.add_option(OptionKeys.S3AccessKey, "", "S3 access key")
pl.add_option(OptionKeys.S3SecretKey, "", "S3 secret key")

pl.run()
