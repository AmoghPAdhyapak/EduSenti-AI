import os
from sqlalchemy import event


def _database_uri():
    url = os.environ.get('DATABASE_URL')
    if url:
        # Normalize common Postgres URL prefixes to the SQLAlchemy + psycopg2 driver.
        if url.startswith('postgres://'):
            url = url.replace('postgres://', 'postgresql+psycopg2://', 1)
        elif url.startswith('postgresql://'):
            url = url.replace('postgresql://', 'postgresql+psycopg2://', 1)
        return url
    # Local fallback for development / testing.
    base_dir = os.path.abspath(os.path.dirname(__file__))
    return f"sqlite:///{os.path.join(base_dir, 'edusentiai.db')}"


class Config:
    SECRET_KEY = os.environ.get('SESSION_SECRET')
    SQLALCHEMY_DATABASE_URI = _database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # Reconnect dead pooled connections (important for serverless + managed PG).
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}


def is_sqlite():
    return Config.SQLALCHEMY_DATABASE_URI.startswith('sqlite')


def enable_sqlite_wal(engine):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL;")
        cursor.execute("PRAGMA synchronous=NORMAL;")
        cursor.close()
