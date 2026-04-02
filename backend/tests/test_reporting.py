from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from PIL import Image as PILImage
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.db.models import Base, Face, Image, Job, JobItemError, PersonCluster
from app.services.job_reporting import build_processing_summary, retry_scan_item


class ReportingSmokeTests(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(self.engine)
        self.SessionLocal = sessionmaker(bind=self.engine, autocommit=False, autoflush=False)

    def _db(self) -> Session:
        return self.SessionLocal()

    def test_processing_summary_counts(self) -> None:
        db = self._db()
        image_1 = Image(file_path="/tmp/a.jpg", file_name="a.jpg", file_hash="h1", width=100, height=100)
        image_2 = Image(file_path="/tmp/b.jpg", file_name="b.jpg", file_hash="h2", width=100, height=100)
        cluster = PersonCluster(name="Person_1")
        db.add_all([image_1, image_2, cluster])
        db.flush()

        db.add(Face(image_id=image_1.id, person_cluster_id=cluster.id))
        db.add(Face(image_id=image_2.id, person_cluster_id=None))
        db.add(Job(job_type="scan", status="completed", total_items=2, processed_items=2, error_count=1))
        db.add(JobItemError(job_id=1, stage="scan", image_id=image_2.id, error_message="failed parse"))
        db.commit()

        summary = build_processing_summary(db)
        self.assertEqual(summary["total_images"], 2)
        self.assertEqual(summary["images_with_faces"], 2)
        self.assertEqual(summary["total_faces"], 2)
        self.assertEqual(summary["cluster_count"], 1)
        self.assertEqual(summary["unclustered_faces"], 1)
        self.assertEqual(summary["failed_images"], 1)

    def test_retry_scan_item_recreates_image_metadata(self) -> None:
        db = self._db()
        job = Job(job_type="scan", status="completed", total_items=1, processed_items=1, error_count=1)
        db.add(job)
        db.flush()

        with tempfile.TemporaryDirectory() as tmpdir:
            img_path = Path(tmpdir) / "sample.jpg"
            PILImage.new("RGB", (10, 10), color="red").save(img_path)
            error = JobItemError(
                job_id=job.id,
                stage="scan",
                file_path=str(img_path),
                error_message="mock failure",
            )
            db.add(error)
            db.commit()

            ok = retry_scan_item(db, job=job, item_error=error)
            db.commit()
            self.assertTrue(ok)
            saved = db.query(Image).filter(Image.file_name == "sample.jpg").first()
            self.assertIsNotNone(saved)


if __name__ == "__main__":
    unittest.main()
