import hashlib
from datetime import datetime
from pathlib import Path
from typing import Iterable

from PIL import Image as PILImage
from sqlalchemy.orm import Session

from app.db.models import Image, Job
from app.db.session import SessionLocal

SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tiff", ".tif"}


def iter_image_files(folder: Path) -> Iterable[Path]:
    for path in folder.rglob("*"):
        if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS:
            yield path


def compute_sha256(path: Path) -> str:
    hasher = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def parse_exif_datetime(image: PILImage.Image) -> datetime | None:
    exif = image.getexif()
    raw = exif.get(36867) or exif.get(306)
    if not raw:
        return None
    try:
        return datetime.strptime(raw, "%Y:%m:%d %H:%M:%S")
    except ValueError:
        return None


def run_scan_job(job_id: int, folder_path: str) -> None:
    db: Session = SessionLocal()
    try:
        job = db.get(Job, job_id)
        if not job:
            return

        folder = Path(folder_path)
        files = list(iter_image_files(folder)) if folder.exists() else []
        job.total_items = len(files)
        job.status = "running"
        job.message = None
        db.commit()

        for file_path in files:
            job.processed_items += 1
            try:
                file_hash = compute_sha256(file_path)
                existing_by_hash = db.query(Image).filter(Image.file_hash == file_hash).first()
                existing_by_path = db.query(Image).filter(Image.file_path == str(file_path.resolve())).first()
                if existing_by_hash or existing_by_path:
                    db.commit()
                    continue

                with PILImage.open(file_path) as image:
                    width, height = image.size
                    exif_datetime = parse_exif_datetime(image)

                db_image = Image(
                    file_path=str(file_path.resolve()),
                    file_name=file_path.name,
                    file_hash=file_hash,
                    width=width,
                    height=height,
                    exif_datetime=exif_datetime,
                )
                db.add(db_image)
                db.commit()
            except Exception as exc:
                db.rollback()
                job.error_count += 1
                job.message = f"Some files failed to parse. Last error: {exc}"
                db.commit()

        job.status = "completed"
        db.commit()
    except Exception as exc:
        db.rollback()
        job = db.get(Job, job_id)
        if job:
            job.status = "failed"
            job.message = str(exc)
            db.commit()
    finally:
        db.close()
