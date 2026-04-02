from __future__ import annotations

from datetime import datetime, UTC
from pathlib import Path

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.models import Face, Image, Job, JobItemError, PersonCluster


def record_item_error(
    db: Session,
    *,
    job_id: int,
    stage: str,
    error_message: str,
    image_id: int | None = None,
    face_id: int | None = None,
    file_path: str | None = None,
) -> JobItemError:
    entry = JobItemError(
        job_id=job_id,
        stage=stage,
        image_id=image_id,
        face_id=face_id,
        file_path=file_path,
        error_message=error_message[:4000],
    )
    db.add(entry)
    return entry


def resolve_item_error(
    db: Session,
    *,
    stage: str,
    image_id: int | None = None,
    face_id: int | None = None,
    file_path: str | None = None,
) -> None:
    query = db.query(JobItemError).filter(JobItemError.stage == stage, JobItemError.resolved_at.is_(None))
    if image_id is not None:
        query = query.filter(JobItemError.image_id == image_id)
    if face_id is not None:
        query = query.filter(JobItemError.face_id == face_id)
    if file_path is not None:
        query = query.filter(JobItemError.file_path == file_path)

    now = datetime.now(UTC).replace(tzinfo=None)
    for item in query.all():
        item.resolved_at = now
        item.retry_count += 1


def build_processing_summary(db: Session) -> dict[str, int]:
    total_images = db.query(func.count(Image.id)).scalar() or 0
    images_with_faces = db.query(func.count(func.distinct(Face.image_id))).scalar() or 0
    total_faces = db.query(func.count(Face.id)).scalar() or 0
    cluster_count = db.query(func.count(PersonCluster.id)).scalar() or 0
    unclustered_faces = db.query(func.count(Face.id)).filter(Face.person_cluster_id.is_(None)).scalar() or 0
    failed_images = db.query(func.count(func.distinct(JobItemError.image_id))).filter(JobItemError.resolved_at.is_(None)).scalar() or 0
    unresolved_errors = db.query(func.count(JobItemError.id)).filter(JobItemError.resolved_at.is_(None)).scalar() or 0

    return {
        "total_images": int(total_images),
        "images_with_faces": int(images_with_faces),
        "total_faces": int(total_faces),
        "cluster_count": int(cluster_count),
        "unclustered_faces": int(unclustered_faces),
        "failed_images": int(failed_images),
        "unresolved_errors": int(unresolved_errors),
    }


def retry_scan_item(db: Session, *, job: Job, item_error: JobItemError) -> bool:
    from app.services.scanner import compute_sha256, parse_exif_datetime
    from PIL import Image as PILImage

    target = Path(item_error.file_path or "")
    if not target.exists() or not target.is_file():
        return False

    file_hash = compute_sha256(target)
    existing_by_hash = db.query(Image).filter(Image.file_hash == file_hash).first()
    existing_by_path = db.query(Image).filter(Image.file_path == str(target.resolve())).first()
    if existing_by_hash or existing_by_path:
        return True

    with PILImage.open(target) as image:
        width, height = image.size
        exif_datetime = parse_exif_datetime(image)

    db_image = Image(
        file_path=str(target.resolve()),
        file_name=target.name,
        file_hash=file_hash,
        width=width,
        height=height,
        exif_datetime=exif_datetime,
    )
    db.add(db_image)
    resolve_item_error(db, stage=item_error.stage, image_id=item_error.image_id)
    return True
