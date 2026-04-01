import json
from pathlib import Path
from typing import Any

from PIL import Image as PILImage, ImageOps
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.models import Face, Image, Job
from app.db.session import SessionLocal

THUMBNAIL_SIZE = (224, 224)


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


def _thumbnail_output_path(face_id: int) -> Path:
    settings = get_settings()
    out_dir = Path(settings.data_dir) / "faces" / "thumbnails"
    out_dir.mkdir(parents=True, exist_ok=True)
    return out_dir / f"face_{face_id}.jpg"


def _embedding_output_path(face_id: int) -> Path:
    settings = get_settings()
    out_dir = Path(settings.data_dir) / "faces" / "embeddings"
    out_dir.mkdir(parents=True, exist_ok=True)
    return out_dir / f"face_{face_id}.npy"


def run_face_detection_job(job_id: int) -> None:
    db: Session = SessionLocal()
    try:
        job = db.get(Job, job_id)
        if not job:
            return

        face_recognition = _ensure_face_recognition()

        images = db.query(Image).order_by(Image.id.asc()).all()
        job.status = "running"
        job.total_items = len(images)
        job.processed_items = 0
        job.error_count = 0
        job.message = None
        db.commit()

        for image_row in images:
            job.processed_items += 1
            try:
                db.query(Face).filter(Face.image_id == image_row.id).delete(synchronize_session=False)
                db.commit()

                np_image = face_recognition.load_image_file(image_row.file_path)
                locations = face_recognition.face_locations(np_image, model="hog")

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

                    face = Face(image_id=image_row.id, bbox_json=json.dumps(bbox), embedding_path=None, thumbnail_path=None)
                    db.add(face)
                    db.commit()
                    db.refresh(face)

                    with PILImage.open(image_row.file_path) as source_image:
                        normalized = ImageOps.exif_transpose(source_image.convert("RGB"))
                        crop = normalized.crop((left, top, right, bottom))
                        crop.thumbnail(THUMBNAIL_SIZE)
                        thumb_path = _thumbnail_output_path(face.id)
                        crop.save(thumb_path, format="JPEG", quality=90)

                    face.thumbnail_path = str(thumb_path.resolve())
                    db.commit()
            except Exception as exc:
                db.rollback()
                job.error_count += 1
                job.message = f"Some images failed face detection. Last error: {exc}"
                db.commit()

        job.status = "completed"
        if job.error_count > 0 and not job.message:
            job.message = "Detection completed with partial errors"
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


def run_face_embedding_job(job_id: int) -> None:
    db: Session = SessionLocal()
    try:
        np = _ensure_numpy()

        job = db.get(Job, job_id)
        if not job:
            return

        face_recognition = _ensure_face_recognition()

        faces = db.query(Face).order_by(Face.id.asc()).all()
        job.status = "running"
        job.total_items = len(faces)
        job.processed_items = 0
        job.error_count = 0
        job.message = None
        db.commit()

        for face in faces:
            job.processed_items += 1
            try:
                if not face.thumbnail_path:
                    raise RuntimeError(f"Face {face.id} has no thumbnail_path")

                image_data = face_recognition.load_image_file(face.thumbnail_path)
                encodings = face_recognition.face_encodings(image_data)
                if not encodings:
                    raise RuntimeError(f"No embedding generated for face {face.id}")

                embedding = np.asarray(encodings[0], dtype=np.float32)
                embedding_path = _embedding_output_path(face.id)
                np.save(embedding_path, embedding)

                face.embedding_path = str(embedding_path.resolve())
                db.commit()
            except Exception as exc:
                db.rollback()
                job.error_count += 1
                job.message = f"Some faces failed embedding generation. Last error: {exc}"
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
