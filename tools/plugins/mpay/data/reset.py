import json
from dataclasses import dataclass
from typing import Any

from pyln.client import Plugin
from sqlalchemy import delete
from sqlalchemy.orm import Session

from plugins.mpay.db.models import Attempt, Hop, Payment


@dataclass
class RemovedEntries:
    payments: int
    attempts: int
    hops: int

    def to_dict(self) -> dict[str, Any]:
        return self.__dict__


class Reset:
    _pl: Plugin

    def __init__(self, pl: Plugin) -> None:
        self._pl = pl

    def reset_all(self, s: Session) -> RemovedEntries:
        res = RemovedEntries(0, 0, 0)

        res.hops = s.execute(delete(Hop)).rowcount
        res.attempts = s.execute(delete(Attempt)).rowcount
        res.payments = s.execute(delete(Payment)).rowcount

        s.commit()

        self._pl.log(f"Reset path memory: {json.dumps(res.to_dict())}")

        return res
