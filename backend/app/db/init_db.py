from pathlib import Path

from sqlalchemy import inspect, text

from app.core.config import get_settings
from app.db.models import Base
from app.db.session import engine


def _apply_compat_migrations() -> None:
    """Apply small backward-compatible schema fixes for existing databases."""
    inspector = inspect(engine)

    if "person_cluster" not in inspector.get_table_names():
        return

    cluster_columns = {column["name"] for column in inspector.get_columns("person_cluster")}
    if "cover_face_id" not in cluster_columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE person_cluster ADD COLUMN cover_face_id INTEGER"))


def init_db() -> None:
    settings = get_settings()
    Path(settings.data_dir).mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)
    _apply_compat_migrations()
