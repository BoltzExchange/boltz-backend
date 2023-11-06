from pyln.client import Plugin
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from plugins.mpay.db.db import Database
from plugins.mpay.db.fetcher import DatabaseFetcher
from plugins.mpay.db.models import Attempt, Payment


class Payments:
    _pl: Plugin
    _db: Database

    def __init__(self, pl: Plugin, db: Database) -> None:
        self._pl = pl
        self._db = db

    def fetch(self, payment_hash: str) -> DatabaseFetcher[Payment]:
        return self._fetch(payment_hash)

    def fetch_all(self) -> DatabaseFetcher[Payment]:
        return self._fetch(None)

    def _fetch(self, payment_hash: str | None) -> DatabaseFetcher[Payment]:
        query = (
            select(Payment)
            .order_by(Payment.created_at)
            .options(joinedload(Payment.attempts, Attempt.hops))
        )

        if payment_hash is not None:
            query = query.where(Payment.payment_hash == payment_hash)

        return DatabaseFetcher[Payment](self._db, query)
