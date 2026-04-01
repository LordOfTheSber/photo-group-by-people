from fastapi import FastAPI

from app.api.router import api_router
from app.core.config import get_settings
from app.db.init_db import init_db

settings = get_settings()
app = FastAPI(title=settings.app_name, version=settings.app_version)
app.include_router(api_router)


@app.on_event("startup")
def on_startup() -> None:
    init_db()
