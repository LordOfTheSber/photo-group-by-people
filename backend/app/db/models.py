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
    bbox_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    embedding_path: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    image: Mapped[Image] = relationship(back_populates="faces")


class PersonCluster(Base):
    __tablename__ = "person_cluster"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    images: Mapped[list["PersonImage"]] = relationship(back_populates="cluster")


class PersonImage(Base):
    __tablename__ = "person_image"
    __table_args__ = (UniqueConstraint("person_cluster_id", "image_id", name="uq_person_image_pair"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    person_cluster_id: Mapped[int] = mapped_column(ForeignKey("person_cluster.id", ondelete="CASCADE"), index=True)
    image_id: Mapped[int] = mapped_column(ForeignKey("image.id", ondelete="CASCADE"), index=True)
    confidence: Mapped[int | None] = mapped_column(Integer, nullable=True)

    cluster: Mapped[PersonCluster] = relationship(back_populates="images")


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
