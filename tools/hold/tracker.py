import threading
from dataclasses import dataclass
from queue import SimpleQueue
from typing import Generic, TypeVar

from enums import InvoiceState


@dataclass(frozen=True)
class InvoiceUpdate:
    payment_hash: str
    update: InvoiceState


T = TypeVar("T")


class MultiForward(Generic[T]):
    _qs: list[SimpleQueue[T]]

    def __init__(self) -> None:
        self._qs = []

    def size(self) -> int:
        return len(self._qs)

    def send_update(self, update: T) -> None:
        for q in self._qs:
            q.put(update)

    def track(self) -> SimpleQueue[T]:
        q = SimpleQueue()
        self._qs.append(q)
        return q

    def stop_tracking(self, q: SimpleQueue[T]) -> None:
        self._qs.remove(q)


class Tracker:
    _lock: threading.Lock

    _fwds: dict[str, MultiForward[InvoiceState]]
    _all_fwds: MultiForward[InvoiceUpdate]

    def __init__(self) -> None:
        self._fwds = {}
        self._all_fwds = MultiForward()
        self._lock = threading.Lock()

    def send_update(self, payment_hash: str, update: InvoiceState) -> None:
        with self._lock:
            fwd = self._fwds.get(payment_hash)
            if fwd is not None:
                fwd.send_update(update)

            self._all_fwds.send_update(
                InvoiceUpdate(payment_hash=payment_hash, update=update)
            )

    def track(self, payment_hash: str) -> SimpleQueue[InvoiceState]:
        with self._lock:
            fwd = self._fwds.get(payment_hash)

            if fwd is None:
                fwd = MultiForward()
                self._fwds[payment_hash] = fwd

            return fwd.track()

    def track_all(self) -> SimpleQueue[InvoiceUpdate]:
        with self._lock:
            return self._all_fwds.track()

    def stop_tracking(self, payment_hash: str, q: SimpleQueue[InvoiceState]) -> None:
        with self._lock:
            fwd = self._fwds.get(payment_hash)
            if fwd is None:
                return

            fwd.stop_tracking(q)
            if fwd.size() == 0:
                del self._fwds[payment_hash]

    def stop_tracking_all(self, q: SimpleQueue[InvoiceUpdate]) -> None:
        with self._lock:
            self._all_fwds.stop_tracking(q)
