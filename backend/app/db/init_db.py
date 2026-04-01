from pathlib import Path

from sqlalchemy import inspect, text

from app.core.config import get_settings
from app.db.models import Base
from app.db.session import engine


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
    _ensure_column("face", "person_cluster_id", "INTEGER")


def init_db() -> None:
    settings = get_settings()
    Path(settings.data_dir).mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)
    _apply_compat_migrations()
