from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.models import Job
from app.db.session import get_db
from app.schemas.export import ExportRequest, ExportStartResponse
from app.schemas.jobs import JobRead
from app.services.exporter import run_export_job
from app.services.job_runner import submit_job

router = APIRouter(prefix="/export", tags=["export"])


@router.post("", response_model=ExportStartResponse)
def start_export(request: ExportRequest, db: Session = Depends(get_db)) -> ExportStartResponse:
    job = Job(job_type="export", status="queued", total_items=0, processed_items=0, error_count=0)
    db.add(job)
    db.commit()
    db.refresh(job)

    submit_job(
        run_export_job,
        job.id,
        request.output_dir,
        request.strategy,
        request.include_report,
    )
    return ExportStartResponse(job_id=job.id, status=job.status)


@router.get("/jobs/{job_id}", response_model=JobRead)
def get_export_job(job_id: int, db: Session = Depends(get_db)) -> JobRead:
    job = db.get(Job, job_id)
    if not job or job.job_type != "export":
        raise HTTPException(status_code=404, detail="Export job not found")
    return JobRead.model_validate(job)
