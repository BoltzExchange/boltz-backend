import threading
from queue import SimpleQueue

from enums import InvoiceState


class Tracker:
    _lock: threading.Lock
    _qs: dict[str, list[SimpleQueue[InvoiceState]]]

    def __init__(self) -> None:
        self._qs = {}
        self._lock = threading.Lock()

    def send_update(self, payment_hash: str, update: InvoiceState) -> None:
        with self._lock:
            for q in self._qs.get(payment_hash, []):
                q.put(update)

    def track(self, payment_hash: str) -> SimpleQueue[InvoiceState]:
        q = SimpleQueue()

        with self._lock:
            if payment_hash not in self._qs:
                self._qs[payment_hash] = []

            self._qs.get(payment_hash).append(q)

        return q

    def stop_tracking(self, payment_hash: str, q: SimpleQueue[InvoiceState]) -> None:
        with self._lock:
            qs = self._qs.get(payment_hash, [])
            qs.remove(q)

            if len(qs) == 0:
                del self._qs[payment_hash]
