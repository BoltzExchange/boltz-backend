import json
from dataclasses import dataclass
from typing import Any

from pyln.client import Plugin
from sqlalchemy import delete
from sqlalchemy.orm import Session

from plugins.mpay.db.db import Database
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
    _db: Database

    def __init__(self, pl: Plugin, db: Database) -> None:
        self._pl = pl
        self._db = db

    def reset_all(self) -> RemovedEntries:
        res = RemovedEntries(0, 0, 0)

        with Session(self._db.engine) as e:
            res.hops = e.execute(delete(Hop)).rowcount
            res.attempts = e.execute(delete(Attempt)).rowcount
            res.payments = e.execute(delete(Payment)).rowcount

            e.commit()

        self._pl.log(f"Reset path memory: {json.dumps(res.to_dict())}")

        return res
