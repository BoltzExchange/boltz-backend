from pyln.client import Millisatoshi

from plugins.mpay.utils import fee_with_percent, format_error


class NoStrException(BaseException):
    pass


class TestUtils:
    def test_format_error(self) -> None:
        msg = "test"
        assert format_error(ValueError(msg)) == msg
        assert format_error(NoStrException()) == repr(NoStrException())

    def test_fee_with_percent(self) -> None:
        assert fee_with_percent(Millisatoshi(100), Millisatoshi(1)) == "1msat (1.0%)"
        assert fee_with_percent(Millisatoshi(3), Millisatoshi(1)) == "1msat (33.3333%)"
