import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.models import Job, JobItemError
from app.db.session import get_db
from app.schemas.jobs import ProcessingSummary, RetryFailedItemsRequest, RetryFailedItemsResponse
from app.services.job_reporting import build_processing_summary, retry_scan_item

router = APIRouter(tags=["reporting"])
logger = logging.getLogger(__name__)


@router.get("/reports/processing-summary", response_model=ProcessingSummary)
def get_processing_summary(db: Session = Depends(get_db)) -> ProcessingSummary:
    return ProcessingSummary(**build_processing_summary(db))


@router.post("/jobs/{job_id}/retry-failed", response_model=RetryFailedItemsResponse)
def retry_failed_items(job_id: int, request: RetryFailedItemsRequest, db: Session = Depends(get_db)) -> RetryFailedItemsResponse:
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    open_errors = (
        db.query(JobItemError)
        .filter(JobItemError.job_id == job_id, JobItemError.resolved_at.is_(None))
        .order_by(JobItemError.id.asc())
        .limit(max(1, request.limit))
        .all()
    )
    if not open_errors:
        return RetryFailedItemsResponse(job_id=job_id, retried_items=0, remaining_failed_items=0)

    retried_items = 0
    for item in open_errors:
        try:
            if job.job_type == "scan":
                ok = retry_scan_item(db, job=job, item_error=item)
            else:
                # For non-scan jobs fallback to "retry bookkeeping", rerun main job through existing endpoint actions.
                item.retry_count += 1
                ok = False

            if ok:
                retried_items += 1
        except Exception:  # pragma: no cover - defensive
            logger.exception("retry failed: job_id=%s item_error_id=%s", job_id, item.id)

    db.commit()
    remaining = (
        db.query(JobItemError)
        .filter(JobItemError.job_id == job_id, JobItemError.resolved_at.is_(None))
        .count()
    )
    return RetryFailedItemsResponse(job_id=job_id, retried_items=retried_items, remaining_failed_items=remaining)
