from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Image(Base):
    __tablename__ = "image"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    file_path: Mapped[str] = mapped_column(String(1024), unique=True, index=True)
    file_name: Mapped[str] = mapped_column(String(512), index=True)
    file_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    width: Mapped[int | None] = mapped_column(Integer, nullable=True)
    height: Mapped[int | None] = mapped_column(Integer, nullable=True)
    exif_datetime: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    faces: Mapped[list["Face"]] = relationship(back_populates="image")


class Face(Base):
    __tablename__ = "face"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    image_id: Mapped[int] = mapped_column(ForeignKey("image.id", ondelete="CASCADE"), index=True)
    person_cluster_id: Mapped[int | None] = mapped_column(
        ForeignKey("person_cluster.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )
    bbox_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    embedding_path: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    thumbnail_path: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    image: Mapped[Image] = relationship(back_populates="faces")
    cluster: Mapped["PersonCluster | None"] = relationship(back_populates="faces", foreign_keys=[person_cluster_id])


class PersonCluster(Base):
    __tablename__ = "person_cluster"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    cover_face_id: Mapped[int | None] = mapped_column(ForeignKey("face.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    faces: Mapped[list[Face]] = relationship(back_populates="cluster", foreign_keys=[Face.person_cluster_id])
    images: Mapped[list["PersonImage"]] = relationship(back_populates="cluster")
    cover_face: Mapped[Face | None] = relationship(foreign_keys=[cover_face_id], post_update=True)


class PersonImage(Base):
    __tablename__ = "person_image"
    __table_args__ = (UniqueConstraint("person_cluster_id", "image_id", name="uq_person_image_pair"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    person_cluster_id: Mapped[int] = mapped_column(ForeignKey("person_cluster.id", ondelete="CASCADE"), index=True)
    image_id: Mapped[int] = mapped_column(ForeignKey("image.id", ondelete="CASCADE"), index=True)
    confidence: Mapped[int | None] = mapped_column(Integer, nullable=True)

    cluster: Mapped[PersonCluster] = relationship(back_populates="images")
    image: Mapped[Image] = relationship()


class Job(Base):
    __tablename__ = "job"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    job_type: Mapped[str] = mapped_column(String(64), index=True)
    status: Mapped[str] = mapped_column(String(32), index=True)
    total_items: Mapped[int] = mapped_column(Integer, default=0)
    processed_items: Mapped[int] = mapped_column(Integer, default=0)
    error_count: Mapped[int] = mapped_column(Integer, default=0)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    item_errors: Mapped[list["JobItemError"]] = relationship(back_populates="job", cascade="all, delete-orphan")


class JobItemError(Base):
    __tablename__ = "job_item_error"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("job.id", ondelete="CASCADE"), index=True)
    stage: Mapped[str] = mapped_column(String(64), index=True)
    image_id: Mapped[int | None] = mapped_column(ForeignKey("image.id", ondelete="SET NULL"), index=True, nullable=True)
    face_id: Mapped[int | None] = mapped_column(ForeignKey("face.id", ondelete="SET NULL"), index=True, nullable=True)
    file_path: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    error_message: Mapped[str] = mapped_column(Text, nullable=False)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    job: Mapped[Job] = relationship(back_populates="item_errors")


class AuditEvent(Base):
    __tablename__ = "audit_event"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    event_type: Mapped[str] = mapped_column(String(64), index=True)
    payload_json: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
