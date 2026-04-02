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


class MergeClustersRequest(BaseModel):
    source_cluster_ids: list[int] = Field(min_length=1)
    target_cluster_id: int


class SplitFacesRequest(BaseModel):
    source_cluster_id: int
    face_ids: list[int] = Field(min_length=1)
    destination_cluster_name: str | None = Field(default=None, min_length=1, max_length=255)


class CreateClusterFromFacesRequest(BaseModel):
    face_ids: list[int] = Field(min_length=1)
    cluster_name: str | None = Field(default=None, min_length=1, max_length=255)


class ClusterMutationResponse(BaseModel):
    status: str
    affected_cluster_ids: list[int]
    moved_face_count: int
