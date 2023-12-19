from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import (
    BIGINT,
    TIMESTAMP,
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def to_dict(obj: object) -> dict[str, Any]:
    return {
        field.name: getattr(obj, field.name)
        if not isinstance(getattr(obj, field.name), datetime)
        else int(getattr(obj, field.name).timestamp())
        for field in obj.__table__.c
    }


class Base(DeclarativeBase):
    pass


# TODO: also other params or get from listpays?
class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    destination: Mapped[str] = mapped_column(String(70), nullable=False)
    payment_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    amount: Mapped[int] = mapped_column(BIGINT, nullable=False)
    ok: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    created_at: Mapped[DateTime] = mapped_column(
        TIMESTAMP, nullable=False, server_default=func.now()
    )

    attempts: Mapped[list[Attempt]] = relationship()

    __table_args__ = (
        Index("destination_idx", destination),
        Index("payment_hash_idx", payment_hash),
    )

    def to_dict(self) -> dict[str, Any]:
        res = to_dict(self)
        res["attempts"] = [a.to_dict() for a in self.attempts]

        return res


# TODO: save relative fee?
class Attempt(Base):
    __tablename__ = "attempts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    payment_id: Mapped[int] = mapped_column(ForeignKey("payments.id"), nullable=False)
    ok: Mapped[bool] = mapped_column(Boolean, nullable=False)
    time: Mapped[int] = mapped_column(Integer, nullable=False)

    created_at: Mapped[DateTime] = mapped_column(
        TIMESTAMP, nullable=False, server_default=func.now()
    )

    hops: Mapped[list[Hop]] = relationship()

    __table_args__ = (Index("payment_id_idx", payment_id),)

    def to_dict(self) -> dict[str, Any]:
        res = to_dict(self)
        res["hops"] = [h.to_dict() for h in self.hops]

        return res


class Hop(Base):
    __tablename__ = "hops"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    attempt_id: Mapped[int] = mapped_column(ForeignKey("attempts.id"), nullable=False)

    node: Mapped[str] = mapped_column(String(70), nullable=False)
    channel: Mapped[str] = mapped_column(String(50), nullable=False)
    direction: Mapped[int] = mapped_column(Integer, nullable=False)
    ok: Mapped[bool] = mapped_column(Boolean, nullable=False)

    __table_args__ = (
        Index("attempt_id_idx", attempt_id),
        Index("node_idx", node),
        Index("channel_idx", channel),
    )

    def to_dict(self) -> dict[str, Any]:
        return to_dict(self)
