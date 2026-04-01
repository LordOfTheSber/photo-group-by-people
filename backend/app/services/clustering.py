from pathlib import Path

import numpy as np
from sqlalchemy.orm import Session

from app.db.models import Face, Job, PersonCluster, PersonImage
from app.db.session import SessionLocal

DEFAULT_DBSCAN_EPS = 0.48
DEFAULT_DBSCAN_MIN_SAMPLES = 2


def _dbscan(embeddings: np.ndarray, eps: float, min_samples: int) -> np.ndarray:
    n_samples = embeddings.shape[0]
    labels = np.full(n_samples, -1, dtype=int)
    visited = np.zeros(n_samples, dtype=bool)

    distance_matrix = np.linalg.norm(embeddings[:, None, :] - embeddings[None, :, :], axis=2)
    cluster_id = 0

    for index in range(n_samples):
        if visited[index]:
            continue

        visited[index] = True
        neighbors = np.where(distance_matrix[index] <= eps)[0]
        if neighbors.size < min_samples:
            labels[index] = -1
            continue

        labels[index] = cluster_id
        seeds = set(neighbors.tolist())
        seeds.discard(index)

        while seeds:
            current = seeds.pop()
            if not visited[current]:
                visited[current] = True
                current_neighbors = np.where(distance_matrix[current] <= eps)[0]
                if current_neighbors.size >= min_samples:
                    seeds.update(current_neighbors.tolist())

            if labels[current] == -1:
                labels[current] = cluster_id

        cluster_id += 1

    return labels


def run_face_clustering_job(job_id: int, eps: float = DEFAULT_DBSCAN_EPS, min_samples: int = DEFAULT_DBSCAN_MIN_SAMPLES) -> None:
    db: Session = SessionLocal()
    try:
        job = db.get(Job, job_id)
        if not job:
            return

        faces_with_embeddings: list[tuple[Face, np.ndarray]] = []
        for face in db.query(Face).order_by(Face.id.asc()).all():
            if not face.embedding_path:
                continue
            emb_path = Path(face.embedding_path)
            if not emb_path.exists():
                continue
            embedding = np.load(emb_path)
            faces_with_embeddings.append((face, embedding.astype(np.float32)))

        job.status = "running"
        job.total_items = len(faces_with_embeddings)
        job.processed_items = 0
        job.error_count = 0
        job.message = None
        db.commit()

        db.query(PersonImage).delete(synchronize_session=False)
        db.query(PersonCluster).delete(synchronize_session=False)
        db.query(Face).update({Face.person_cluster_id: None}, synchronize_session=False)
        db.commit()

        if not faces_with_embeddings:
            job.status = "completed"
            job.message = "No face embeddings found for clustering"
            db.commit()
            return

        faces, vectors = zip(*faces_with_embeddings)
        embeddings = np.vstack(vectors)
        labels = _dbscan(embeddings, eps=eps, min_samples=min_samples)

        clusters: dict[int, PersonCluster] = {}
        cluster_faces: dict[int, list[Face]] = {}

        for i, face in enumerate(faces):
            job.processed_items += 1
            label = int(labels[i])
            if label < 0:
                continue

            if label not in clusters:
                cluster = PersonCluster(name=f"Person_{len(clusters) + 1}")
                db.add(cluster)
                db.flush()
                clusters[label] = cluster
                cluster_faces[label] = []

            face.person_cluster_id = clusters[label].id
            cluster_faces[label].append(face)

        db.flush()

        for label, cluster in clusters.items():
            faces_for_cluster = cluster_faces[label]
            if faces_for_cluster:
                cluster.cover_face_id = min(
                    faces_for_cluster,
                    key=lambda item: (item.image_id, item.id),
                ).id

            unique_image_ids = sorted({face.image_id for face in faces_for_cluster})
            for image_id in unique_image_ids:
                db.add(PersonImage(person_cluster_id=cluster.id, image_id=image_id, confidence=None))

        job.status = "completed"
        job.message = f"Created {len(clusters)} clusters with eps={eps} and min_samples={min_samples}"
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
