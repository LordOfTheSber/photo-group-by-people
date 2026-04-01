import json
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import AuditEvent, Face, PersonCluster, PersonImage


@dataclass
class MutationResult:
    affected_cluster_ids: list[int]
    moved_face_count: int


def _refresh_cluster_links(db: Session, cluster_id: int) -> None:
    cluster = db.get(PersonCluster, cluster_id)
    if not cluster:
        return

    linked_image_ids = {
        image_id
        for (image_id,) in db.query(Face.image_id).filter(Face.person_cluster_id == cluster_id).distinct().all()
    }
    existing_image_ids = {
        image_id
        for (image_id,) in db.query(PersonImage.image_id).filter(PersonImage.person_cluster_id == cluster_id).all()
    }

    for image_id in linked_image_ids - existing_image_ids:
        db.add(PersonImage(person_cluster_id=cluster_id, image_id=image_id))

    stale_ids = existing_image_ids - linked_image_ids
    if stale_ids:
        (
            db.query(PersonImage)
            .filter(
                PersonImage.person_cluster_id == cluster_id,
                PersonImage.image_id.in_(stale_ids),
            )
            .delete(synchronize_session=False)
        )

    cover_face = db.query(Face).filter(Face.person_cluster_id == cluster_id).order_by(Face.id.asc()).first()
    cluster.cover_face_id = cover_face.id if cover_face else None


def _write_audit_event(db: Session, event_type: str, payload: dict) -> None:
    db.add(AuditEvent(event_type=event_type, payload_json=json.dumps(payload, sort_keys=True)))


def merge_clusters(db: Session, source_cluster_ids: list[int], target_cluster_id: int) -> MutationResult:
    dedup_sources = sorted({cluster_id for cluster_id in source_cluster_ids if cluster_id != target_cluster_id})
    if not dedup_sources:
        raise ValueError("No source clusters remain after removing target cluster")

    target = db.get(PersonCluster, target_cluster_id)
    if not target:
        raise ValueError("Target cluster not found")

    existing_sources = db.scalars(select(PersonCluster).where(PersonCluster.id.in_(dedup_sources))).all()
    if len(existing_sources) != len(dedup_sources):
        raise ValueError("One or more source clusters were not found")

    moved_faces = (
        db.query(Face)
        .filter(Face.person_cluster_id.in_(dedup_sources))
        .update({Face.person_cluster_id: target_cluster_id}, synchronize_session=False)
    )

    for cluster_id in dedup_sources:
        _refresh_cluster_links(db, cluster_id)

    _refresh_cluster_links(db, target_cluster_id)

    for source in existing_sources:
        source.cover_face_id = None
        db.delete(source)

    _write_audit_event(
        db,
        "merge_clusters",
        {
            "source_cluster_ids": dedup_sources,
            "target_cluster_id": target_cluster_id,
            "moved_face_count": moved_faces,
        },
    )

    return MutationResult(affected_cluster_ids=[target_cluster_id], moved_face_count=moved_faces)


def create_cluster_from_faces(
    db: Session,
    face_ids: list[int],
    cluster_name: str | None,
    source_cluster_id: int | None = None,
) -> MutationResult:
    unique_face_ids = sorted(set(face_ids))
    if not unique_face_ids:
        raise ValueError("No faces were provided")

    faces = db.scalars(select(Face).where(Face.id.in_(unique_face_ids))).all()
    if len(faces) != len(unique_face_ids):
        raise ValueError("One or more faces were not found")

    if source_cluster_id is not None:
        if any(face.person_cluster_id != source_cluster_id for face in faces):
            raise ValueError("At least one face does not belong to the source cluster")

    next_name = cluster_name.strip() if cluster_name else f"Person_New_{unique_face_ids[0]}"
    new_cluster = PersonCluster(name=next_name)
    db.add(new_cluster)
    db.flush()

    source_cluster_ids = {face.person_cluster_id for face in faces if face.person_cluster_id is not None}
    for face in faces:
        face.person_cluster_id = new_cluster.id

    _refresh_cluster_links(db, new_cluster.id)
    for cluster_id in sorted(source_cluster_ids):
        _refresh_cluster_links(db, cluster_id)

    _write_audit_event(
        db,
        "create_cluster_from_faces",
        {
            "source_cluster_id": source_cluster_id,
            "source_cluster_ids": sorted(source_cluster_ids),
            "new_cluster_id": new_cluster.id,
            "face_ids": unique_face_ids,
        },
    )

    affected_cluster_ids = sorted(source_cluster_ids | {new_cluster.id})
    return MutationResult(affected_cluster_ids=affected_cluster_ids, moved_face_count=len(unique_face_ids))
