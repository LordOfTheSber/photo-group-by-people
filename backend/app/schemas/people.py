from datetime import datetime

from pydantic import BaseModel, Field


class PersonClusterSummary(BaseModel):
    id: int
    name: str
    face_count: int
    image_count: int
    cover_face_thumbnail_url: str | None
    created_at: datetime


class PersonClusterListResponse(BaseModel):
    items: list[PersonClusterSummary]
    total: int


class ClusterFaceRead(BaseModel):
    id: int
    image_id: int
    thumbnail_url: str | None
    bbox_json: str | None


class ClusterImageRead(BaseModel):
    id: int
    file_name: str
    preview_url: str


class PersonClusterDetail(BaseModel):
    id: int
    name: str
    created_at: datetime
    cover_face_thumbnail_url: str | None
    faces: list[ClusterFaceRead]
    images: list[ClusterImageRead]


class ClusterImageListResponse(BaseModel):
    items: list[ClusterImageRead]
    total: int


class PersonClusterRenameRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class FaceUnassignResponse(BaseModel):
    cluster_id: int
    face_id: int
    status: str
