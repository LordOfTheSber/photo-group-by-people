from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings

settings = get_settings()

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Session:
    from app.db.init_db import ensure_compat_schema

    ensure_compat_schema()

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
