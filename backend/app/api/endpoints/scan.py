from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.models import Job
from app.db.session import get_db
from app.schemas.jobs import JobRead
from app.schemas.scan import ScanRequest, ScanStartResponse
from app.services.job_runner import submit_job
from app.services.scanner import run_scan_job

router = APIRouter(prefix="/scan", tags=["scan"])


@router.post("", response_model=ScanStartResponse)
def start_scan(request: ScanRequest, db: Session = Depends(get_db)) -> ScanStartResponse:
    folder = Path(request.folder_path)
    if not folder.exists() or not folder.is_dir():
        raise HTTPException(status_code=400, detail="folder_path must point to an existing directory")

    job = Job(job_type="scan", status="queued", total_items=0, processed_items=0, error_count=0)
    db.add(job)
    db.commit()
    db.refresh(job)

    submit_job(run_scan_job, job.id, request.folder_path)
    return ScanStartResponse(job_id=job.id, status=job.status)


@router.get("/jobs/{job_id}", response_model=JobRead)
def get_scan_job(job_id: int, db: Session = Depends(get_db)) -> JobRead:
    job = db.get(Job, job_id)
    if not job or job.job_type != "scan":
        raise HTTPException(status_code=404, detail="Scan job not found")
    return JobRead.model_validate(job)
