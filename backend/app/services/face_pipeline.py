import json
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from io import BytesIO
from pathlib import Path
from uuid import uuid4
from typing import Any

from PIL import Image as PILImage, ImageOps
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.models import Face, Image, Job
from app.db.session import SessionLocal
from app.services.job_reporting import record_item_error, resolve_item_error

THUMBNAIL_SIZE = (224, 224)
logger = logging.getLogger(__name__)


def _ensure_numpy() -> Any:
    try:
        import numpy as np  # type: ignore
    except Exception as exc:  # pragma: no cover - depends on local runtime
        raise RuntimeError(
            "numpy is required for face embedding. Install optional ML dependencies first."
        ) from exc
    return np


def _ensure_face_recognition() -> Any:
    try:
        import face_recognition  # type: ignore
    except Exception as exc:  # pragma: no cover - depends on local runtime
        raise RuntimeError(
            "face_recognition is required for face detection/embedding. Install optional ML dependencies first."
        ) from exc
    return face_recognition


def _thumbnail_output_path() -> Path:
    settings = get_settings()
    out_dir = Path(settings.data_dir) / "faces" / "thumbnails"
    out_dir.mkdir(parents=True, exist_ok=True)
    return out_dir / f"face_{uuid4().hex}.jpg"




def _parse_face_location(bbox_json: str | None) -> tuple[int, int, int, int] | None:
    if not bbox_json:
        return None

    try:
        raw = json.loads(bbox_json)
        top = int(raw["top"])
        right = int(raw["right"])
        bottom = int(raw["bottom"])
        left = int(raw["left"])
        return (top, right, bottom, left)
    except Exception:
        return None


def _embedding_output_path(face_id: int) -> Path:
    settings = get_settings()
    out_dir = Path(settings.data_dir) / "faces" / "embeddings"
    out_dir.mkdir(parents=True, exist_ok=True)
    return out_dir / f"face_{face_id}.npy"


def _detect_faces_for_image(image_path: str) -> dict[str, object]:
    face_recognition = _ensure_face_recognition()
    np_image = face_recognition.load_image_file(image_path)
    locations = face_recognition.face_locations(np_image, model="hog")
    thumbnails: list[bytes] = []

    with PILImage.open(image_path) as source_image:
        normalized = ImageOps.exif_transpose(source_image.convert("RGB"))
        for top, right, bottom, left in locations:
            crop = normalized.crop((left, top, right, bottom))
            crop.thumbnail(THUMBNAIL_SIZE)
            output = BytesIO()
            crop.save(output, format="JPEG", quality=90)
            thumbnails.append(output.getvalue())

    return {"locations": locations, "thumbnails": thumbnails}


def _build_embedding_for_face(
    face_id: int,
    image_path: str | None,
    location: tuple[int, int, int, int] | None,
    thumbnail_path: str | None,
) -> Any:
    face_recognition = _ensure_face_recognition()
    encodings: list[Any] = []
    if location and image_path:
        source_image_data = face_recognition.load_image_file(image_path)
        encodings = face_recognition.face_encodings(source_image_data, known_face_locations=[location])

    if not encodings:
        if not thumbnail_path:
            raise RuntimeError(f"Face {face_id} has no thumbnail_path")
        thumb_image_data = face_recognition.load_image_file(thumbnail_path)
        encodings = face_recognition.face_encodings(thumb_image_data)

    if not encodings:
        raise RuntimeError(f"No embedding generated for face {face_id}")

    np = _ensure_numpy()
    return np.asarray(encodings[0], dtype=np.float32)


def run_face_detection_job(job_id: int) -> None:
    db: Session = SessionLocal()
    try:
        job = db.get(Job, job_id)
        if not job:
            return

        settings = get_settings()
        _ensure_face_recognition()

        images = db.query(Image).order_by(Image.id.asc()).all()
        logger.info("face detection started: job_id=%s images=%s", job_id, len(images))
        job.status = "running"
        job.total_items = len(images)
        job.processed_items = 0
        job.error_count = 0
        job.message = None
        db.commit()

        for image_row in images:
            db.query(Face).filter(Face.image_id == image_row.id).delete(synchronize_session=False)
        db.commit()

        max_workers = max(1, settings.face_detection_max_workers)
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {
                executor.submit(_detect_faces_for_image, image_row.file_path): image_row
                for image_row in images
            }

            for future in as_completed(futures):
                image_row = futures[future]
                job.processed_items += 1
                try:
                    result = future.result()
                    locations = result["locations"]
                    thumbnails = result["thumbnails"]
                    for index, (top, right, bottom, left) in enumerate(locations):
                        bbox = {
                            "top": int(top),
                            "right": int(right),
                            "bottom": int(bottom),
                            "left": int(left),
                            "confidence": None,
                            "detector": "face_recognition_hog",
                            "face_index": index,
                        }

                        thumb_path = _thumbnail_output_path()
                        thumb_path.write_bytes(thumbnails[index])
                        face = Face(
                            image_id=image_row.id,
                            bbox_json=json.dumps(bbox),
                            embedding_path=None,
                            thumbnail_path=str(thumb_path.resolve()),
                        )
                        db.add(face)

                    resolve_item_error(db, stage="face_detection", image_id=image_row.id)
                    db.commit()
                except Exception as exc:
                    db.rollback()
                    job.error_count += 1
                    job.message = f"Some images failed face detection. Last error: {exc}"
                    record_item_error(
                        db,
                        job_id=job.id,
                        stage="face_detection",
                        image_id=image_row.id,
                        file_path=image_row.file_path,
                        error_message=str(exc),
                    )
                    logger.exception("face detection failed: job_id=%s image_id=%s", job_id, image_row.id)
                    db.commit()

        job.status = "completed"
        if job.error_count > 0 and not job.message:
            job.message = "Detection completed with partial errors"
        db.commit()
        logger.info("face detection completed: job_id=%s errors=%s", job_id, job.error_count)
    except Exception as exc:
        db.rollback()
        failed_job = db.get(Job, job_id)
        if failed_job:
            failed_job.status = "failed"
            failed_job.message = str(exc)
            db.commit()
    finally:
        db.close()


def run_face_embedding_job(job_id: int) -> None:
    db: Session = SessionLocal()
    try:
        np = _ensure_numpy()

        job = db.get(Job, job_id)
        if not job:
            return

        settings = get_settings()
        _ensure_face_recognition()

        faces = db.query(Face).order_by(Face.id.asc()).all()
        if not faces:
            job.status = "failed"
            job.total_items = 0
            job.processed_items = 0
            job.error_count = 0
            job.message = "No faces found. Run face detection first."
            db.commit()
            return

        job.status = "running"
        job.total_items = len(faces)
        job.processed_items = 0
        job.error_count = 0
        job.message = None
        db.commit()

        max_workers = max(1, settings.face_embedding_max_workers)
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {}
            for face in faces:
                location = _parse_face_location(face.bbox_json)
                image_path = face.image.file_path if face.image and location else None
                futures[executor.submit(
                    _build_embedding_for_face,
                    face.id,
                    image_path,
                    location,
                    face.thumbnail_path,
                )] = face

            for future in as_completed(futures):
                face = futures[future]
                job.processed_items += 1
                try:
                    embedding = future.result()
                    embedding_path = _embedding_output_path(face.id)
                    np.save(embedding_path, embedding)
                    face.embedding_path = str(embedding_path.resolve())
                    resolve_item_error(db, stage="face_embedding", face_id=face.id)
                    db.commit()
                except Exception as exc:
                    db.rollback()
                    job.error_count += 1
                    job.message = f"Some faces failed embedding generation. Last error: {exc}"
                    record_item_error(
                        db,
                        job_id=job.id,
                        stage="face_embedding",
                        face_id=face.id,
                        image_id=face.image_id,
                        error_message=str(exc),
                    )
                    logger.exception("face embedding failed: job_id=%s face_id=%s", job_id, face.id)
                    db.commit()

        job.status = "completed"
        if job.error_count > 0 and not job.message:
            job.message = "Embedding completed with partial errors"
        db.commit()
    except Exception as exc:
        db.rollback()
        failed_job = db.get(Job, job_id)
        if failed_job:
            failed_job.status = "failed"
            failed_job.message = str(exc)
            db.commit()
    finally:
        db.close()
