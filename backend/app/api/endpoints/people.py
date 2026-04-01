from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.models import Face, Image, Job, PersonCluster, PersonImage
from app.db.session import get_db
from app.schemas.jobs import JobListResponse, JobRead
from app.schemas.people import (
    ClusterFaceRead,
    ClusterImageListResponse,
    ClusterImageRead,
    PersonClusterDetail,
    PersonClusterListResponse,
    PersonClusterSummary,
)

router = APIRouter(tags=["read-api"])


@router.get("/jobs", response_model=JobListResponse)
def list_jobs(
    limit: int = Query(default=20, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    job_type: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> JobListResponse:
    query = db.query(Job)
    if job_type:
        query = query.filter(Job.job_type == job_type)

    total = query.count()
    jobs = query.order_by(Job.created_at.desc(), Job.id.desc()).offset(offset).limit(limit).all()
    return JobListResponse(items=[JobRead.model_validate(job) for job in jobs], total=total)


@router.get("/people", response_model=PersonClusterListResponse)
def list_person_clusters(
    limit: int = Query(default=20, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> PersonClusterListResponse:
    total = db.query(func.count(PersonCluster.id)).scalar() or 0
    clusters = db.query(PersonCluster).order_by(PersonCluster.id.asc()).offset(offset).limit(limit).all()

    items: list[PersonClusterSummary] = []
    for cluster in clusters:
        face_count = db.query(func.count(Face.id)).filter(Face.person_cluster_id == cluster.id).scalar() or 0
        image_count = db.query(func.count(PersonImage.id)).filter(PersonImage.person_cluster_id == cluster.id).scalar() or 0

        cover_face_thumbnail_url = None
        if cluster.cover_face_id:
            cover_face_thumbnail_url = f"/assets/faces/{cluster.cover_face_id}/thumbnail"

        items.append(
            PersonClusterSummary(
                id=cluster.id,
                name=cluster.name,
                face_count=face_count,
                image_count=image_count,
                cover_face_thumbnail_url=cover_face_thumbnail_url,
                created_at=cluster.created_at,
            )
        )

    return PersonClusterListResponse(items=items, total=total)


@router.get("/people/{cluster_id}", response_model=PersonClusterDetail)
def get_person_cluster_detail(cluster_id: int, db: Session = Depends(get_db)) -> PersonClusterDetail:
    cluster = db.get(PersonCluster, cluster_id)
    if not cluster:
        raise HTTPException(status_code=404, detail="Person cluster not found")

    faces = db.query(Face).filter(Face.person_cluster_id == cluster_id).order_by(Face.id.asc()).all()
    person_images = (
        db.query(PersonImage, Image)
        .join(Image, Image.id == PersonImage.image_id)
        .filter(PersonImage.person_cluster_id == cluster_id)
        .order_by(Image.id.asc())
        .all()
    )

    return PersonClusterDetail(
        id=cluster.id,
        name=cluster.name,
        created_at=cluster.created_at,
        cover_face_thumbnail_url=f"/assets/faces/{cluster.cover_face_id}/thumbnail" if cluster.cover_face_id else None,
        faces=[
            ClusterFaceRead(
                id=face.id,
                image_id=face.image_id,
                thumbnail_url=f"/assets/faces/{face.id}/thumbnail" if face.thumbnail_path else None,
                bbox_json=face.bbox_json,
            )
            for face in faces
        ],
        images=[
            ClusterImageRead(
                id=image.id,
                file_name=image.file_name,
                preview_url=f"/assets/images/{image.id}/preview",
            )
            for _, image in person_images
        ],
    )


@router.get("/people/{cluster_id}/images", response_model=ClusterImageListResponse)
def list_cluster_images(
    cluster_id: int,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> ClusterImageListResponse:
    cluster = db.get(PersonCluster, cluster_id)
    if not cluster:
        raise HTTPException(status_code=404, detail="Person cluster not found")

    query = db.query(PersonImage, Image).join(Image, Image.id == PersonImage.image_id).filter(PersonImage.person_cluster_id == cluster_id)
    total = query.count()
    rows = query.order_by(Image.id.asc()).offset(offset).limit(limit).all()

    return ClusterImageListResponse(
        items=[
            ClusterImageRead(
                id=image.id,
                file_name=image.file_name,
                preview_url=f"/assets/images/{image.id}/preview",
            )
            for _, image in rows
        ],
        total=total,
    )


@router.get("/assets/faces/{face_id}/thumbnail")
def get_face_thumbnail(face_id: int, db: Session = Depends(get_db)) -> FileResponse:
    face = db.get(Face, face_id)
    if not face or not face.thumbnail_path:
        raise HTTPException(status_code=404, detail="Face thumbnail not found")

    thumb_path = Path(face.thumbnail_path)
    if not thumb_path.exists() or not thumb_path.is_file():
        raise HTTPException(status_code=404, detail="Face thumbnail file missing")

    settings = get_settings()
    if not thumb_path.is_relative_to(Path(settings.data_dir).resolve()):
        raise HTTPException(status_code=400, detail="Thumbnail path is outside allowed assets directory")

    return FileResponse(path=str(thumb_path), media_type="image/jpeg")


@router.get("/assets/images/{image_id}/preview")
def get_image_preview(image_id: int, db: Session = Depends(get_db)) -> FileResponse:
    image = db.get(Image, image_id)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    image_path = Path(image.file_path)
    if not image_path.exists() or not image_path.is_file():
        raise HTTPException(status_code=404, detail="Image file missing")

    suffix = image_path.suffix.lower()
    media_type = "image/jpeg"
    if suffix == ".png":
        media_type = "image/png"
    elif suffix in {".webp"}:
        media_type = "image/webp"

    return FileResponse(path=str(image_path), media_type=media_type)
