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
    def fetch_all(s: Session) -> Iterator[Payment]:
        return Payments._fetch(s, None, None, None)

    @staticmethod
    def fetch_paginated(s: Session, start_id: int, offset: int) -> Iterator[Payment]:
        return Payments._fetch(s, None, start_id, offset)

    @staticmethod
    def _fetch(
        s: Session,
        payment_hash: str | None,
        offset: int | None,
        limit: int | None,
    ) -> Iterator[Payment]:
        query = (
            select(Payment)
            .order_by(Payment.created_at)
            .options(joinedload(Payment.attempts, Attempt.hops))
        )

        if payment_hash is not None:
            query = query.where(Payment.payment_hash == payment_hash)

        if offset is not None:
            query = query.where(Payment.id > offset)

        if limit is not None:
            query = query.limit(limit)

        for row in s.execute(query).unique():
            yield row[0]
