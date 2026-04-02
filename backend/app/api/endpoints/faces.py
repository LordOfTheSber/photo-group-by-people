from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.models import Job
from app.db.session import get_db
from app.schemas.jobs import JobRead
from app.services.clustering import run_face_clustering_job
from app.services.face_pipeline import run_face_detection_job, run_face_embedding_job
from app.services.job_runner import submit_job

router = APIRouter(prefix="/faces", tags=["faces"])


@router.post("/detect", response_model=JobRead)
def start_face_detection(db: Session = Depends(get_db)) -> JobRead:
    job = Job(job_type="face_detection", status="queued", total_items=0, processed_items=0, error_count=0)
    db.add(job)
    db.commit()
    db.refresh(job)

    submit_job(run_face_detection_job, job.id)
    return JobRead.model_validate(job)


@router.post("/embed", response_model=JobRead)
def start_face_embeddings(db: Session = Depends(get_db)) -> JobRead:
    job = Job(job_type="face_embedding", status="queued", total_items=0, processed_items=0, error_count=0)
    db.add(job)
    db.commit()
    db.refresh(job)

    submit_job(run_face_embedding_job, job.id)
    return JobRead.model_validate(job)




@router.post("/cluster", response_model=JobRead)
def start_face_clustering(db: Session = Depends(get_db)) -> JobRead:
    job = Job(job_type="face_clustering", status="queued", total_items=0, processed_items=0, error_count=0)
    db.add(job)
    db.commit()
    db.refresh(job)

    submit_job(run_face_clustering_job, job.id)
    return JobRead.model_validate(job)


@router.get("/jobs/{job_id}", response_model=JobRead)
def get_face_job(job_id: int, db: Session = Depends(get_db)) -> JobRead:
    job = db.get(Job, job_id)
    if not job or job.job_type not in {"face_detection", "face_embedding", "face_clustering"}:
        raise HTTPException(status_code=404, detail="Face job not found")
    return JobRead.model_validate(job)
