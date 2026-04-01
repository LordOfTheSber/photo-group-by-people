from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Face Photo Sorter API"
    app_version: str = "0.2.0"
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/face_photo_sorter"
    data_dir: Path = Field(default=Path("./data"))
    cors_origins: list[str] = Field(default=["http://localhost:5173", "http://127.0.0.1:5173"])

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _parse_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    model_config = SettingsConfigDict(env_file=".env", env_prefix="FPS_")


@lru_cache
def get_settings() -> Settings:
    return Settings()
