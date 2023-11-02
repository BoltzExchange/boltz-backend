import json

from pyln.client import Plugin
from sqlalchemy import delete
from sqlalchemy.orm import Session

from plugins.mpay.db.db import Database
from plugins.mpay.db.models import Attempt, Hop, Payment


class Reset:
    _pl: Plugin
    _db: Database

    def __init__(self, pl: Plugin, db: Database) -> None:
        self._pl = pl
        self._db = db

    def reset_all(self) -> dict[str, int]:
        res: dict[str, int] = {}

        with Session(self._db.engine) as e:
            res["hops"] = e.execute(delete(Hop)).rowcount
            res["attempts"] = e.execute(delete(Attempt)).rowcount
            res["payments"] = e.execute(delete(Payment)).rowcount

            e.commit()

        self._pl.log(f"Reset path memory: {json.dumps(res)}")

        return res
