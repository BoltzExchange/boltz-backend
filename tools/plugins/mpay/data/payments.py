from __future__ import annotations

from typing import Iterator

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from plugins.mpay.db.models import Attempt, Payment


class Payments:
    @staticmethod
    def fetch(s: Session, payment_hash: str) -> Iterator[Payment]:
        return Payments._fetch(s, payment_hash, None, None)

    @staticmethod
    def fetch_all(s: Session, start_id: int, limit: int) -> Iterator[Payment]:
        return Payments._fetch(s, None, start_id, limit)

    @staticmethod
    def _fetch(
        s: Session,
        payment_hash: str | None,
        start_id: int | None,
        limit: int | None,
    ) -> Iterator[Payment]:
        query = (
            select(Payment)
            .order_by(Payment.created_at)
            .options(joinedload(Payment.attempts, Attempt.hops))
        )

        if payment_hash is not None:
            query = query.where(Payment.payment_hash == payment_hash)

        if start_id is not None:
            query = query.where(Payment.id > start_id)

        if limit is not None:
            query = query.limit(limit)

        for row in s.execute(query).unique():
            yield row[0]
