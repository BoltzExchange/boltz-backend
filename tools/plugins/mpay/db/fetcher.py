from types import TracebackType
from typing import Generic, Iterator, TypeVar

from sqlalchemy import Executable
from sqlalchemy.orm import Session

from plugins.mpay.db.db import Database

T = TypeVar("T")


class DatabaseFetcher(Generic[T]):
    _db: Database
    _query: Executable

    _session: Session

    def __init__(self, db: Database, query: Executable) -> None:
        self._db = db
        self._query = query

    def __enter__(self) -> Iterator[T]:
        """Open a session and yield results."""
        self._session = Session(self._db.engine)

        for row in self._session.execute(self._query).unique():
            yield row[0]

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc_val: BaseException | None,
        exc_tb: TracebackType | None,
    ) -> bool:
        """Close the session opened by __enter__."""
        self._session.close()
        return False
