from pyln.client import Plugin
from sqlalchemy import URL, Connection, Engine, create_engine

from plugins.mpay.db.models import Base


class Database:
    con: Connection
    engine: Engine

    _pl: Plugin

    def __init__(self, pl: Plugin) -> None:
        self._pl = pl

    def connect(self, host: str, port: int, database: str, username: str, password: str) -> None:
        url = URL.create(
            drivername="postgresql+psycopg",
            host=host,
            port=port,
            database=database,
            username=username,
            password=password,
        )

        try:
            self.engine = create_engine(url)
            self.con = self.engine.connect()
            Base.metadata.create_all(self.engine)

            self._pl.log("Connected to database")
        except BaseException as e:
            self._pl.log(f"Could not connect to database: {e}", level="warn")
            raise

    def close(self) -> None:
        self.con.close()
