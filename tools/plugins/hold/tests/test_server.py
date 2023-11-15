import socket
from contextlib import closing
from unittest.mock import MagicMock

import grpc
import pytest

# noinspection PyProtectedMember
from grpc._channel import _InactiveRpcError

from plugins.hold.protos.hold_pb2 import InvoiceRequest
from plugins.hold.protos.hold_pb2_grpc import HoldStub
from plugins.hold.server import Server


def free_port() -> int:
    with closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as s:
        s.bind(("", 0))
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        return s.getsockname()[1]


class TestServer:
    hold = MagicMock()
    plugin = MagicMock()

    @pytest.fixture(scope="class", autouse=True)
    def client(self) -> HoldStub:
        host = "127.0.0.1"
        port = free_port()
        server = Server(self.plugin, self.hold)
        server.start(host, port, None)

        channel = grpc.insecure_channel(f"{host}:{port}")
        hold = HoldStub(channel)

        yield hold

        channel.close()
        server.stop()

    def test_log_request(self, client: HoldStub) -> None:
        expected = "invoice"
        self.hold.invoice.return_value = expected

        assert client.Invoice(InvoiceRequest()).bolt11 == expected

        assert self.hold.invoice.call_count == 1
        assert self.plugin.log.call_count == 2
        assert self.plugin.log.call_args_list[1][0] == ("gRPC call /hold.Hold/Invoice",)
        assert self.plugin.log.call_args_list[1][1] == {"level": "debug"}

    def test_log_error(self, client: HoldStub) -> None:
        class TestError(Exception):
            def __init__(self, message: str) -> None:
                super().__init__(message)

        self.hold.invoice.side_effect = TestError("critical error")

        with pytest.raises(_InactiveRpcError):
            client.Invoice(InvoiceRequest())

        assert self.hold.invoice.call_count == 2
        assert self.plugin.log.call_count == 4
        assert self.plugin.log.call_args_list[2][0] == ("gRPC call /hold.Hold/Invoice",)
        assert self.plugin.log.call_args_list[2][1] == {"level": "debug"}
        assert self.plugin.log.call_args_list[3][0] == (
            "gRPC call /hold.Hold/Invoice failed: critical error",
        )
        assert self.plugin.log.call_args_list[3][1] == {"level": "warn"}

    def test_log_error_repr(self, client: HoldStub) -> None:
        class CustomNameError(Exception):
            pass

        self.hold.invoice.side_effect = CustomNameError()

        with pytest.raises(_InactiveRpcError):
            client.Invoice(InvoiceRequest())

        assert self.hold.invoice.call_count == 3
        assert self.plugin.log.call_count == 6
        assert self.plugin.log.call_args_list[4][0] == ("gRPC call /hold.Hold/Invoice",)
        assert self.plugin.log.call_args_list[4][1] == {"level": "debug"}
        assert self.plugin.log.call_args_list[5][0] == (
            f"gRPC call /hold.Hold/Invoice failed: {CustomNameError()!r}",
        )
        assert self.plugin.log.call_args_list[5][1] == {"level": "warn"}
