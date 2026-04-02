from fastapi import APIRouter

from app.api.endpoints.export import router as export_router
from app.api.endpoints.faces import router as faces_router
from app.api.endpoints.health import router as health_router
from app.api.endpoints.people import router as people_router
from app.api.endpoints.reporting import router as reporting_router
from app.api.endpoints.scan import router as scan_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(scan_router)
api_router.include_router(faces_router)
api_router.include_router(people_router)
api_router.include_router(export_router)
api_router.include_router(reporting_router)
