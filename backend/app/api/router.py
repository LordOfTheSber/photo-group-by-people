from fastapi import APIRouter

from app.api.endpoints.faces import router as faces_router
from app.api.endpoints.health import router as health_router
from app.api.endpoints.scan import router as scan_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(scan_router)
api_router.include_router(faces_router)
