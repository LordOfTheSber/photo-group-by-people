from pydantic import BaseModel, Field


class ExportRequest(BaseModel):
    output_dir: str = Field(min_length=1)
    strategy: str = Field(default="copy", pattern="^(copy|symlink|hardlink)$")
    include_report: bool = True


class ExportStartResponse(BaseModel):
    job_id: int
    status: str
