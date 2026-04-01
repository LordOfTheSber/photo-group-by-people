from pydantic import BaseModel


class ScanRequest(BaseModel):
    folder_path: str


class ScanStartResponse(BaseModel):
    job_id: int
    status: str
