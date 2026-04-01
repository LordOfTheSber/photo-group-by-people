from pathlib import Path
from threading import Lock

from sqlalchemy import inspect, text

from app.core.config import get_settings
from app.db.models import Base
from app.db.session import engine

_COMPAT_DONE = False
_COMPAT_LOCK = Lock()


def _ensure_column(table_name: str, column_name: str, ddl_type: str) -> None:
    inspector = inspect(engine)
    if table_name not in inspector.get_table_names():
        return

    existing_columns = {column["name"] for column in inspector.get_columns(table_name)}
    if column_name in existing_columns:
        return

    with engine.begin() as connection:
        connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {ddl_type}"))


def _apply_compat_migrations() -> None:
    """Apply small backward-compatible schema fixes for existing databases."""
    _ensure_column("person_cluster", "cover_face_id", "INTEGER")

    # Older Face schema variants may miss one or more columns introduced later.
    _ensure_column("face", "person_cluster_id", "INTEGER")
    _ensure_column("face", "bbox_json", "TEXT")
    _ensure_column("face", "embedding_path", "VARCHAR(1024)")
    _ensure_column("face", "thumbnail_path", "VARCHAR(1024)")


def ensure_compat_schema() -> None:
    global _COMPAT_DONE
    if _COMPAT_DONE:
        return

    with _COMPAT_LOCK:
        if _COMPAT_DONE:
            return
        _apply_compat_migrations()
        _COMPAT_DONE = True


def init_db() -> None:
    settings = get_settings()
    Path(settings.data_dir).mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)
    ensure_compat_schema()
