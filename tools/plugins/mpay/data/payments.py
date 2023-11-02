from typing import Any

from pyln.client import Plugin
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from plugins.mpay.db.db import Database
from plugins.mpay.db.models import Attempt, Payment


class Payments:
    def __init__(self, pl: Plugin, db: Database) -> None:
        self._pl = pl
        self._db = db

    def fetch(self, payment_hash: str) -> list[dict[str, Any]]:
        return self._fetch(payment_hash)

    def fetch_all(self) -> list[dict[str, Any]]:
        return self._fetch(None)

    def _fetch(self, payment_hash: str | None) -> list[dict[str, Any]]:
        query = (
            select(Payment)
            .order_by(Payment.created_at)
            .options(joinedload(Payment.attempts, Attempt.hops))
        )

        if payment_hash is not None:
            query = query.where(Payment.payment_hash == payment_hash)

        with Session(self._db.engine) as s:
            return [r[0].to_dict() for r in s.execute(query).unique()]
