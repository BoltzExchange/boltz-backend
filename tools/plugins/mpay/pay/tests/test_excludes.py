import pytest

from plugins.mpay.pay.excludes import Excludes, ExcludesPayment


class TestExcludes:
    excludes = Excludes()

    @pytest.mark.parametrize("channel", ["1/1", "0/0", "123x123x123/0"])
    def test_add(self, channel: str) -> None:
        self.excludes.add(channel)
        assert channel in self.excludes

    def test_to_set(self) -> None:
        excludes = ["1/1", "0/0", "123x123x123/0"]
        for exclude in excludes:
            self.excludes.add(exclude)

        assert self.excludes.to_set() == set(excludes)


class TestExcludesPayment:
    excludes: Excludes
    excludes_payment: ExcludesPayment

    @pytest.fixture(autouse=True)
    def _before_each(self) -> None:
        self.excludes = Excludes()
        self.excludes_payment = ExcludesPayment(self.excludes)

    @pytest.mark.parametrize("channels", [["1/1", "0/0", "123x123x123/0"]])
    def test_init_locals(self, channels: list[str]) -> None:
        self.excludes_payment.init_locals(channels)

        for channel in channels:
            assert channel in self.excludes_payment

    @pytest.mark.parametrize("channel", ["1/1", "0/0", "123x123x123/0"])
    def test_add(self, channel: str) -> None:
        self.excludes_payment.add(channel)

        assert channel in self.excludes_payment
        assert channel in self.excludes

        assert channel in self.excludes_payment._excludes  # noqa: SLF001

    @pytest.mark.parametrize("channel", ["1/1", "0/0", "123x123x123/0"])
    def test_add_local(self, channel: str) -> None:
        self.excludes_payment.add_local(channel)

        assert channel in self.excludes_payment
        assert channel not in self.excludes

    def test_to_list(self) -> None:
        excludes = ["1/1", "2/1"]
        excludes_payment = ["1/0"]

        for exclude in excludes:
            self.excludes.add(exclude)

        for exclude in excludes_payment:
            self.excludes_payment.add(exclude)

        assert set(excludes + excludes_payment) == set(self.excludes_payment.to_list())
