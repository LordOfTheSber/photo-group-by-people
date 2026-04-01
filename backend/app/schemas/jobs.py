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
