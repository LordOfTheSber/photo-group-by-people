import hashlib
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path
from typing import Iterable

from PIL import Image as PILImage
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.models import Image, Job
from app.db.session import SessionLocal
from app.services.job_reporting import record_item_error, resolve_item_error

SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tiff", ".tif"}
logger = logging.getLogger(__name__)


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


def _scan_file(file_path: Path) -> dict[str, object]:
    file_hash = compute_sha256(file_path)
    with PILImage.open(file_path) as image:
        width, height = image.size
        exif_datetime = parse_exif_datetime(image)

    return {
        "file_path": file_path,
        "file_hash": file_hash,
        "width": width,
        "height": height,
        "exif_datetime": exif_datetime,
    }


def run_scan_job(job_id: int, folder_path: str) -> None:
    db: Session = SessionLocal()
    try:
        settings = get_settings()
        job = db.get(Job, job_id)
        if not job:
            return

        folder = Path(folder_path)
        files = list(iter_image_files(folder)) if folder.exists() else []
        logger.info("scan job started: job_id=%s folder=%s files=%s", job_id, folder_path, len(files))
        job.total_items = len(files)
        job.status = "running"
        job.message = None
        db.commit()

        max_workers = max(1, settings.scan_max_workers)
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {executor.submit(_scan_file, file_path): file_path for file_path in files}
            seen_hashes: set[str] = set()
            seen_paths: set[str] = set()

            for future in as_completed(futures):
                file_path = futures[future]
                resolved_path = str(file_path.resolve())
                job.processed_items += 1
                try:
                    result = future.result()
                    file_hash = str(result["file_hash"])

                    if file_hash in seen_hashes or resolved_path in seen_paths:
                        resolve_item_error(db, stage="scan", file_path=resolved_path)
                        db.commit()
                        continue

                    existing_by_hash = db.query(Image).filter(Image.file_hash == file_hash).first()
                    existing_by_path = db.query(Image).filter(Image.file_path == resolved_path).first()
                    if existing_by_hash or existing_by_path:
                        resolve_item_error(db, stage="scan", file_path=resolved_path)
                        db.commit()
                        continue

                    db_image = Image(
                        file_path=resolved_path,
                        file_name=file_path.name,
                        file_hash=file_hash,
                        width=int(result["width"]),
                        height=int(result["height"]),
                        exif_datetime=result["exif_datetime"],
                    )
                    db.add(db_image)
                    seen_hashes.add(file_hash)
                    seen_paths.add(resolved_path)
                    resolve_item_error(db, stage="scan", file_path=resolved_path)
                    db.commit()
                except Exception as exc:
                    db.rollback()
                    job.error_count += 1
                    job.message = f"Some files failed to parse. Last error: {exc}"
                    record_item_error(
                        db,
                        job_id=job.id,
                        stage="scan",
                        file_path=resolved_path,
                        error_message=str(exc),
                    )
                    logger.exception("scan file failed: job_id=%s file=%s", job_id, file_path)
                    db.commit()

        job.status = "completed"
        logger.info(
            "scan job completed: job_id=%s processed=%s errors=%s",
            job_id,
            job.processed_items,
            job.error_count,
        )
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
