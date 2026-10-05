import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

logger = logging.getLogger("weather_viz.db")

DEFAULT_PG_URL = "postgresql://weather_user:weather_password@localhost:5432/weather_viz"
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_PG_URL)

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)


def _create_engine_instance(url: str):
    connect_args = {}
    if url.startswith("sqlite"):
        connect_args["check_same_thread"] = False

    eng = create_engine(url, pool_pre_ping=True, connect_args=connect_args)

    # If DATABASE_URL was not explicitly set and localhost Postgres is not up, fallback to SQLite
    if "DATABASE_URL" not in os.environ and url.startswith("postgresql"):
        try:
            with eng.connect():
                pass
        except Exception:
            logger.info(
                "Local PostgreSQL is not running on localhost:5432. "
                "Using local SQLite (weather.db) fallback for local dev. "
                "To use PostgreSQL, run via Docker Compose (`docker compose up`) or start PostgreSQL."
            )
            return create_engine(
                "sqlite:///./weather.db",
                pool_pre_ping=True,
                connect_args={"check_same_thread": False},
            )

    return eng


engine = _create_engine_instance(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initializes tables on startup."""
    try:
        from app import models  # noqa: F401
        Base.metadata.create_all(bind=engine)
        logger.info(
            f"Database tables verified/created successfully using {engine.url.drivername}."
        )
        return True
    except Exception as exc:
        logger.warning(f"Database table initialization warning: {exc}")
        return False
