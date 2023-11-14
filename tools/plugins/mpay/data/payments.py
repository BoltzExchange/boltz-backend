from typing import Iterator

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from plugins.mpay.db.models import Attempt, Payment


class Payments:
    @staticmethod
    def fetch(s: Session, payment_hash: str) -> Iterator[Payment]:
        return Payments._fetch(s, payment_hash)

    @staticmethod
    def fetch_all(s: Session) -> Iterator[Payment]:
        return Payments._fetch(s, None)

    @staticmethod
    def _fetch(s: Session, payment_hash: str | None) -> Iterator[Payment]:
        query = (
            select(Payment)
            .order_by(Payment.created_at)
            .options(joinedload(Payment.attempts, Attempt.hops))
        )

        if payment_hash is not None:
            query = query.where(Payment.payment_hash == payment_hash)

        for row in s.execute(query).unique():
            yield row[0]
