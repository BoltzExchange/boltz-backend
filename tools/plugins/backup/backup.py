#!/usr/bin/env python3
import gzip
import json
import sys
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from io import BytesIO
from typing import Any

from minio import Minio
from pyln.client import Plugin
from strenum import StrEnum

PLUGIN_NAME = "backup"

BACKUP_UPLOAD_DESC = "Upload a backup of the current SCB to the configured S3 API"


class OptionKeys(StrEnum):
    S3Endpoint = f"{PLUGIN_NAME}-s3-endpoint"
    S3Bucket = f"{PLUGIN_NAME}-s3-bucket"
    S3Path = f"{PLUGIN_NAME}-s3-path"
    S3AccessKey = f"{PLUGIN_NAME}-s3-access-key"
    S3SecretKey = f"{PLUGIN_NAME}-s3-secret-key"


class Provider(ABC):
    client: Any | None = None

    @abstractmethod
    def upload_scb(self, file_name: str, data: bytes) -> None:
        pass


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

    def upload_scb(self, file_name: str, data: bytes) -> None:
        to_upload = BytesIO(data)
        self.client.put_object(
            self.bucket,
            f"{self.path}{file_name}",
            to_upload,
            len(to_upload.getvalue()),
            "application/gzip",
        )


class Backup:
    plugin: Plugin
    providers: list[Provider]

    def init(self, plugin: Plugin, options: dict[str, Any]) -> None:
        self.plugin = plugin
        self.providers = []

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
        file_name = f"scb-{date}.json.gz"
        self.plugin.log(f"Uploading SCB {file_name} with {len(scb['scb'])} channels")

        data = gzip.compress(json.dumps(scb).encode("utf-8"), compresslevel=9)

        for provider in self.providers:
            provider.upload_scb(file_name, data)


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
    """Upload a backup of the current SCB to the configured S3 API."""
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


pl.add_option(OptionKeys.S3Endpoint, "", "Endpoint of the S3 compatible API")
pl.add_option(OptionKeys.S3Bucket, "", "S3 bucket to use")
pl.add_option(OptionKeys.S3Path, "", "Path to store the S3 backups in")
pl.add_option(OptionKeys.S3AccessKey, "", "S3 access key")
pl.add_option(OptionKeys.S3SecretKey, "", "S3 secret key")

pl.run()
