import json
import logging
import shutil
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from sqlalchemy.orm import Session

from app.db.models import Job, PersonCluster, PersonImage
from app.db.session import SessionLocal
from app.core.config import get_settings
from app.services.job_reporting import record_item_error

logger = logging.getLogger(__name__)


def _safe_name(value: str, fallback: str) -> str:
    normalized = "".join(ch if ch.isalnum() or ch in {"-", "_", " "} else "_" for ch in value).strip()
    return normalized or fallback


def _place_file(source: Path, destination: Path, strategy: str) -> str | None:
    try:
        if strategy == "symlink":
            destination.symlink_to(source)
            return None
        if strategy == "hardlink":
            destination.hardlink_to(source)
            return None
        shutil.copy2(source, destination)
        return None
    except Exception as exc:
        return str(exc)


def _export_single(source_path: Path, destination: Path, strategy: str) -> str | None:
    if not source_path.exists() or not source_path.is_file():
        return f"Missing source file: {source_path}"

    error = _place_file(source_path, destination, strategy)
    if error and strategy != "copy":
        return _place_file(source_path, destination, "copy")
    return error


def run_export_job(job_id: int, output_dir: str, strategy: str, include_report: bool) -> None:
    db: Session = SessionLocal()
    try:
        settings = get_settings()
        job = db.get(Job, job_id)
        if not job:
            return

        root = Path(output_dir).resolve()
        root.mkdir(parents=True, exist_ok=True)

        links = (
            db.query(PersonCluster, PersonImage)
            .join(PersonImage, PersonImage.person_cluster_id == PersonCluster.id)
            .order_by(PersonCluster.id.asc(), PersonImage.image_id.asc())
            .all()
        )

        job.status = "running"
        job.total_items = len(links)
        job.processed_items = 0
        job.error_count = 0
        job.message = None
        db.commit()

        summary: dict[str, object] = {
            "output_dir": str(root),
            "strategy": strategy,
            "total_links": len(links),
            "processed_links": 0,
            "errors": [],
            "clusters": {},
        }

        export_tasks: list[tuple[PersonCluster, PersonImage, Path, Path]] = []
        for cluster, person_image in links:
            image = person_image.image
            source_path = Path(image.file_path)
            cluster_dir = root / f"{cluster.id:04d}_{_safe_name(cluster.name, f'Person_{cluster.id}')}"
            cluster_dir.mkdir(parents=True, exist_ok=True)

            destination = cluster_dir / image.file_name
            if destination.exists():
                destination = cluster_dir / f"{destination.stem}_{image.id}{destination.suffix}"
            export_tasks.append((cluster, person_image, source_path, destination))

        max_workers = max(1, settings.export_max_workers)
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {
                executor.submit(_export_single, source_path, destination, strategy): (cluster, person_image, source_path)
                for cluster, person_image, source_path, destination in export_tasks
            }
            for future in as_completed(futures):
                cluster, person_image, source_path = futures[future]
                image = person_image.image
                job.processed_items += 1
                error = future.result()
                if error:
                    job.error_count += 1
                    record_item_error(
                        db,
                        job_id=job.id,
                        stage="export",
                        image_id=image.id,
                        file_path=str(source_path),
                        error_message=f"Failed for {source_path}: {error}",
                    )
                    cast_errors = summary["errors"]
                    if isinstance(cast_errors, list):
                        cast_errors.append(f"Failed for {source_path}: {error}")
                else:
                    clusters = summary["clusters"]
                    if isinstance(clusters, dict):
                        key = str(cluster.id)
                        clusters[key] = int(clusters.get(key, 0)) + 1

                db.commit()

        summary["processed_links"] = job.processed_items
        if include_report:
            report_dir = root / "_report"
            report_dir.mkdir(parents=True, exist_ok=True)
            (report_dir / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")

        job.status = "completed"
        job.message = f"Exported {job.processed_items - job.error_count}/{job.processed_items} link targets"
        logger.info("export completed: job_id=%s processed=%s errors=%s", job_id, job.processed_items, job.error_count)
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
