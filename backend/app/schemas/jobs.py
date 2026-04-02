from datetime import datetime

from pydantic import BaseModel


class JobRead(BaseModel):
    id: int
    job_type: str
    status: str
    total_items: int
    processed_items: int
    error_count: int
    message: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class JobListResponse(BaseModel):
    items: list[JobRead]
    total: int


class ProcessingSummary(BaseModel):
    total_images: int
    images_with_faces: int
    total_faces: int
    cluster_count: int
    unclustered_faces: int
    failed_images: int
    unresolved_errors: int


class RetryFailedItemsRequest(BaseModel):
    limit: int = 100


class RetryFailedItemsResponse(BaseModel):
    job_id: int
    retried_items: int
    remaining_failed_items: int
