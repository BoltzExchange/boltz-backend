import threading
from abc import ABC, abstractmethod
from concurrent.futures import ThreadPoolExecutor
from typing import Callable

import grpc
from grpc_interceptor import ServerInterceptor
from pyln.client import Plugin

from plugins.hold.certs import load_certs


def handle_grpc_error(
    plugin: Plugin,
    method_name: str,
    context: grpc.ServicerContext,
    e: Exception,
) -> None:
    estr = str(e) if str(e) != "" else repr(e)

    plugin.log(f"gRPC call {method_name} failed: {estr}", level="warn")
    context.abort(grpc.StatusCode.INTERNAL, estr)


class ServerError(Exception):
    def __init__(self, message: str) -> None:
        super().__init__(message)


class LogInterceptor(ServerInterceptor):
    _plugin: Plugin

    def __init__(self, plugin: Plugin) -> None:
        self._plugin = plugin

    def intercept(
        self,
        method: Callable,
        request: object,
        context: grpc.ServicerContext,
        method_name: str,
    ) -> object:
        try:
            self._plugin.log(f"gRPC call {method_name}", level="debug")
            return method(request, context)
        except Exception as e:
            handle_grpc_error(self._plugin, method_name, context, e)


class GrpcServer(ABC):
    _name: str
    _use_ssl: bool

    _plugin: Plugin
    _server: grpc.Server | None

    _server_thread: threading.Thread | None

    def __init__(self, name: str, pl: Plugin, use_ssl: bool = True) -> None:
        self._name = name
        self._use_ssl = use_ssl

        self._plugin = pl
        self._server = None
        self._server_thread = None

    def start(self, host: str, port: int, lightning_dir: str | None) -> None:
        self._server = grpc.server(
            ThreadPoolExecutor(),
            interceptors=[LogInterceptor(self._plugin)],
        )
        self._register_service()

        address = f"{host}:{port}"

        if self._use_ssl and lightning_dir is not None:
            ca_cert, server_cert = load_certs(self._name, f"{lightning_dir}/{self._name}")
            self._server.add_secure_port(
                address,
                grpc.ssl_server_credentials(
                    [(server_cert.key, server_cert.cert)], ca_cert.cert, True
                ),
            )
        else:
            self._server.add_insecure_port(address)

        def start_server() -> None:
            self._server.start()

            self._plugin.log(f"Started {self._name} gRPC server on {address}")
            self._server.wait_for_termination()

        self._server_thread = threading.Thread(target=start_server)
        self._server_thread.start()

    def is_running(self) -> bool:
        return self._server is not None

    def stop(self) -> None:
        if self.is_running():
            self._server.stop(False)
            self._server_thread.join()
            self._plugin.log("Stopped gRPC server")
        else:
            msg = "server not running"
            raise ServerError(msg)

    @abstractmethod
    def _register_service(self) -> None:
        pass
