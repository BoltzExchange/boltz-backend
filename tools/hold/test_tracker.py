import random

from enums import InvoiceState
from tracker import Tracker


class TestTracker:
    def test_track_new_payment_hash(self) -> None:
        payment_hash = random.randbytes(32).hex()

        track = Tracker()
        q = track.track(payment_hash)

        assert len(track._qs[payment_hash]) == 1  # noqa: SLF001
        assert track._qs[payment_hash][0] == q  # noqa: SLF001

    def test_track_existing_payment_hash(self) -> None:
        payment_hash = random.randbytes(32).hex()
        track = Tracker()

        q1 = track.track(payment_hash)
        q2 = track.track(payment_hash)

        assert len(track._qs[payment_hash]) == 2  # noqa: SLF001
        assert track._qs[payment_hash][0] == q1  # noqa: SLF001
        assert track._qs[payment_hash][1] == q2  # noqa: SLF001

    def test_stop_tracking_empty_afterwards(self) -> None:
        payment_hash = random.randbytes(32).hex()
        track = Tracker()
        q = track.track(payment_hash)

        track.stop_tracking(payment_hash, q)

        assert len(track._qs) == 0  # noqa: SLF001

    def test_stop_tracking(self) -> None:
        payment_hash = random.randbytes(32).hex()
        track = Tracker()
        q1 = track.track(payment_hash)
        q2 = track.track(payment_hash)

        track.stop_tracking(payment_hash, q1)

        assert len(track._qs[payment_hash]) == 1  # noqa: SLF001
        assert track._qs[payment_hash][0] == q2  # noqa: SLF001

    def test_send_update_no_queues(self) -> None:
        payment_hash = random.randbytes(32).hex()
        track = Tracker()
        track.send_update(payment_hash, InvoiceState.Paid)

    def test_send_update_queue(self) -> None:
        payment_hash = random.randbytes(32).hex()
        track = Tracker()
        q = track.track(payment_hash)

        update = InvoiceState.Accepted
        track.send_update(payment_hash, update)

        assert q.get() == update

    def test_send_update_queues(self) -> None:
        payment_hash = random.randbytes(32).hex()
        track = Tracker()
        q1 = track.track(payment_hash)
        q2 = track.track(payment_hash)

        update = InvoiceState.Accepted
        track.send_update(payment_hash, update)

        assert q1.get() == update
        assert q2.get() == update
