from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Face Photo Sorter API"
    app_version: str = "0.2.0"
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/face_photo_sorter"
    data_dir: Path = Field(default=Path("./data"))

    model_config = SettingsConfigDict(env_file=".env", env_prefix="FPS_")


@lru_cache
def get_settings() -> Settings:
    return Settings()
