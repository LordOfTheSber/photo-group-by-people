from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.models import Job
from app.db.session import get_db
from app.schemas.jobs import JobRead
from app.services.face_pipeline import run_face_detection_job, run_face_embedding_job

router = APIRouter(prefix="/faces", tags=["faces"])


@router.post("/detect", response_model=JobRead)
def start_face_detection(background_tasks: BackgroundTasks, db: Session = Depends(get_db)) -> JobRead:
    job = Job(job_type="face_detection", status="queued", total_items=0, processed_items=0, error_count=0)
    db.add(job)
    db.commit()
    db.refresh(job)

    background_tasks.add_task(run_face_detection_job, job.id)
    return JobRead.model_validate(job)


@router.post("/embed", response_model=JobRead)
def start_face_embeddings(background_tasks: BackgroundTasks, db: Session = Depends(get_db)) -> JobRead:
    job = Job(job_type="face_embedding", status="queued", total_items=0, processed_items=0, error_count=0)
    db.add(job)
    db.commit()
    db.refresh(job)

    background_tasks.add_task(run_face_embedding_job, job.id)
    return JobRead.model_validate(job)


@router.get("/jobs/{job_id}", response_model=JobRead)
def get_face_job(job_id: int, db: Session = Depends(get_db)) -> JobRead:
    job = db.get(Job, job_id)
    if not job or job.job_type not in {"face_detection", "face_embedding"}:
        raise HTTPException(status_code=404, detail="Face job not found")
    return JobRead.model_validate(job)
