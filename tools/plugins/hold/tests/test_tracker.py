import random

from plugins.hold.enums import InvoiceState
from plugins.hold.tracker import InvoiceUpdate, Tracker


class TestTracker:
    def test_track_new_payment_hash(self) -> None:
        payment_hash = random.randbytes(32).hex()

        track = Tracker()
        q = track.track(payment_hash)

        assert track._fwds[payment_hash].size() == 1  # noqa: SLF001
        assert track._fwds[payment_hash]._qs[0] == q  # noqa: SLF001

    def test_track_existing_payment_hash(self) -> None:
        payment_hash = random.randbytes(32).hex()
        track = Tracker()

        q1 = track.track(payment_hash)
        q2 = track.track(payment_hash)

        assert track._fwds[payment_hash].size() == 2  # noqa: SLF001
        assert track._fwds[payment_hash]._qs[0] == q1  # noqa: SLF001
        assert track._fwds[payment_hash]._qs[1] == q2  # noqa: SLF001

    def test_stop_tracking_empty_afterwards(self) -> None:
        payment_hash = random.randbytes(32).hex()
        track = Tracker()
        q = track.track(payment_hash)

        track.stop_tracking(payment_hash, q)

        assert len(track._fwds) == 0  # noqa: SLF001

    def test_stop_tracking(self) -> None:
        payment_hash = random.randbytes(32).hex()
        track = Tracker()
        q1 = track.track(payment_hash)
        q2 = track.track(payment_hash)

        track.stop_tracking(payment_hash, q1)

        assert track._fwds[payment_hash].size() == 1  # noqa: SLF001
        assert track._fwds[payment_hash]._qs[0] == q2  # noqa: SLF001

    def test_send_update_no_queues(self) -> None:
        payment_hash = random.randbytes(32).hex()
        track = Tracker()
        track.send_update(payment_hash, "invoice", InvoiceState.Paid)

    def test_send_update_queue(self) -> None:
        payment_hash = random.randbytes(32).hex()
        track = Tracker()
        q = track.track(payment_hash)

        update = InvoiceState.Accepted
        track.send_update(payment_hash, "invoice", update)

        assert q.get() == update

    def test_send_update_queues(self) -> None:
        payment_hash = random.randbytes(32).hex()
        track = Tracker()
        q1 = track.track(payment_hash)
        q2 = track.track(payment_hash)

        update = InvoiceState.Accepted
        track.send_update(payment_hash, "invoice", update)

        assert q1.get() == update
        assert q2.get() == update

    def test_track_all(self) -> None:
        track = Tracker()
        q = track.track_all()

        assert track._all_fwds is not None  # noqa: SLF001
        assert track._all_fwds.size() == 1  # noqa: SLF001
        assert track._all_fwds._qs[0] == q  # noqa: SLF001

    def test_stop_tracking_all(self) -> None:
        track = Tracker()
        q1 = track.track_all()
        q2 = track.track_all()

        track.stop_tracking_all(q1)

        assert track._all_fwds.size() == 1  # noqa: SLF001
        assert track._all_fwds._qs[0] == q2  # noqa: SLF001

    def test_send_update_all(self) -> None:
        payment_hash = random.randbytes(32).hex()
        track = Tracker()
        q = track.track_all()

        invoice = "lnbc"
        update = InvoiceState.Accepted
        track.send_update(payment_hash, invoice, update)

        assert q.get() == InvoiceUpdate(payment_hash, invoice, update)

    def test_send_update_single_all(self) -> None:
        invoice = "lnbcrt"
        payment_hash = random.randbytes(32).hex()
        track = Tracker()

        q = track.track(payment_hash)
        q_all = track.track_all()

        update = InvoiceState.Accepted
        track.send_update(payment_hash, invoice, update)

        assert q.get() == update
        assert q_all.get() == InvoiceUpdate(payment_hash, invoice, update)
