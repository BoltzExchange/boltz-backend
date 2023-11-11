from pyln.client import Plugin
from sqlalchemy import Connection, Engine, create_engine

from plugins.mpay.db.models import Base


class Database:
    con: Connection
    engine: Engine

    _pl: Plugin

    def __init__(self, pl: Plugin) -> None:
        self._pl = pl

    def connect(self, connection: str) -> None:
        try:
            self.engine = create_engine(connection)
            self.con = self.engine.connect()
            Base.metadata.create_all(self.engine)

            self._pl.log("Connected to database")
        except BaseException as e:
            self._pl.log(f"Could not connect to database: {e}", level="warn")
            raise

    def close(self) -> None:
        self.con.close()
